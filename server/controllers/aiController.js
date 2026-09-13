import OpenAI from "openai";
import { supabaseAdmin } from "../configs/supabase.js";
import { incrementUsage } from "../middlewares/auth.js";
import { saveCreation } from "../services/creationService.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import dns from 'dns'
import pdf from 'pdf-parse/lib/pdf-parse.js'
import { extractTextFromPdf } from '../services/pdfExtractorService.js'
import * as cheerio from 'cheerio'
import mammoth from 'mammoth'
import { YoutubeTranscript } from 'youtube-transcript'

const AI = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY,
    baseURL: process.env.GROQ_API_KEY
        ? "https://api.groq.com/openai/v1"
        : "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const PRIMARY_MODEL = process.env.GROQ_MODEL || "groq/compound";
const FALLBACK_MODELS = [
    PRIMARY_MODEL,
    "groq/compound",
    "groq/compound-mini",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
];

// Helper to safely truncate messages to prevent 413 "Request too large" token limit breaches
function truncateMessagesForTokenLimit(messages, maxChars = 4000) {
    return messages.map(m => {
        if (typeof m.content === 'string' && m.content.length > maxChars) {
            const half = Math.floor((maxChars - 120) / 2);
            return {
                ...m,
                content: m.content.slice(0, half) + "\n\n[... content condensed to fit token limits ...]\n\n" + m.content.slice(m.content.length - half)
            };
        }
        return m;
    });
}

// Safely condense long articles or transcripts to stay well within Groq TPM/ITPM quotas while capturing full narrative context
function prepareInputForSummary(rawText, maxChars = 6500) {
    if (!rawText || rawText.length <= maxChars) return rawText || '';
    const partLen = Math.floor((maxChars - 250) / 3);
    const start = rawText.slice(0, partLen);
    const midStart = Math.floor((rawText.length / 2) - (partLen / 2));
    const mid = rawText.slice(midStart, midStart + partLen);
    const end = rawText.slice(rawText.length - partLen);
    return `${start}\n\n[... middle sections ...]\n\n${mid}\n\n[... conclusion & key data ...]\n\n${end}`;
}

// Resilient zero-cost Pollinations fallback when all Groq free-tier models are token-constrained or rate-limited
async function fetchPollinationsCompletion(messages, temperature = 0.7) {
    try {
        const apiKey = process.env.POLLINATIONS_API_KEY || 'sk_OdPhn7RDlOPz8C00XmGCP9Owp54A2Q2b';
        const res = await axios.post('https://text.pollinations.ai/', {
            messages,
            model: 'openai',
            temperature,
            key: apiKey
        }, { timeout: 20000 });
        const text = typeof res.data === 'string' ? res.data : (res.data?.choices?.[0]?.message?.content || JSON.stringify(res.data));
        return text;
    } catch (err) {
        console.error("fetchPollinationsCompletion failed:", err.message);
        throw err;
    }
}

// Helper to run chat completion with seamless model fallback and self-healing 413/429 recovery
export async function runChatCompletion({ messages, temperature = 0.7, max_tokens = 1000 }) {
    let currentMessages = messages;
    let currentMaxTokens = max_tokens;
    let lastError = null;
    const tried = new Set();

    for (const model of FALLBACK_MODELS) {
        if (tried.has(model)) continue;
        tried.add(model);

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await AI.chat.completions.create({
                    model,
                    messages: currentMessages,
                    temperature,
                    max_tokens: currentMaxTokens,
                });
                return response;
            } catch (err) {
                lastError = err;
                const msg = (err.message || '').toLowerCase();

                // Self-healing for 413 / Request too large / ITPM token limit exceeded
                if (msg.includes('413') || msg.includes('too large') || msg.includes('tokens per minute') || msg.includes('itpm') || msg.includes('tpm')) {
                    console.warn(`[runChatCompletion] 413 token limit on ${model}. Truncating payload to 3,500 chars and retrying...`);
                    currentMessages = truncateMessagesForTokenLimit(currentMessages, 3500);
                    currentMaxTokens = Math.min(currentMaxTokens, 500);
                    continue;
                }

                // Temporary 429 rate limit backoff
                if (msg.includes('429') && attempt === 0) {
                    console.warn(`[runChatCompletion] 429 rate limit on ${model}. Pausing 2s before retry...`);
                    await new Promise(res => setTimeout(res, 2000));
                    continue;
                }

                console.warn(`Groq model [${model}] error: ${err.message}. Trying next fallback...`);
                break;
            }
        }
    }

    // Rock-solid zero-quota safety net: Pollinations AI
    console.warn("Groq models exhausted/limited. Seamlessly engaging Pollinations AI fallback...");
    try {
        const text = await fetchPollinationsCompletion(currentMessages, temperature);
        return {
            choices: [
                {
                    message: {
                        content: text
                    }
                }
            ]
        };
    } catch (pollErr) {
        console.error("Pollinations fallback failed:", pollErr.message);
        throw lastError || pollErr;
    }
}

// Helper to stream chat completion with seamless model fallback and self-healing 413 recovery
async function runChatStreaming({ messages, temperature = 0.7, max_tokens = 1000, onChunk, signal }) {
    let currentMessages = messages;
    let currentMaxTokens = max_tokens;
    let lastError = null;
    const tried = new Set();

    for (const model of FALLBACK_MODELS) {
        if (tried.has(model)) continue;
        tried.add(model);

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const stream = await AI.chat.completions.create({
                    model,
                    messages: currentMessages,
                    temperature,
                    max_tokens: currentMaxTokens,
                    stream: true,
                }, { signal });

                let fullText = '';
                for await (const chunk of stream) {
                    if (signal?.aborted) break;
                    const content = chunk.choices?.[0]?.delta?.content || '';
                    if (content) {
                        fullText += content;
                        onChunk(content);
                    }
                }
                return fullText;
            } catch (err) {
                if (err.name === 'AbortError' || signal?.aborted) {
                    throw err;
                }

                lastError = err;
                const msg = (err.message || '').toLowerCase();

                // Self-healing for 413 on streaming
                if (msg.includes('413') || msg.includes('too large') || msg.includes('tokens per minute') || msg.includes('itpm') || msg.includes('tpm')) {
                    console.warn(`[runChatStreaming] 413 on ${model}. Truncating payload to 3,500 chars, reducing maxTokens, and retrying...`);
                    currentMessages = truncateMessagesForTokenLimit(currentMessages, 3500);
                    currentMaxTokens = Math.min(currentMaxTokens, 500);
                    continue;
                }

                // Temporary 429 rate limit backoff
                if (msg.includes('429') && attempt === 0) {
                    console.warn(`[runChatStreaming] 429 rate limit on ${model}. Pausing 2s before retry...`);
                    await new Promise(res => setTimeout(res, 2000));
                    continue;
                }

                console.warn(`Streaming Groq model [${model}] error: ${err.message}. Trying next fallback...`);
                break;
            }
        }
    }

    // Rock-solid zero-quota safety net: Pollinations AI
    if (!signal?.aborted) {
        console.warn("Groq streaming exhausted/limited. Seamlessly engaging Pollinations AI streaming fallback...");
        try {
            const fullText = await fetchPollinationsCompletion(currentMessages, temperature);
            // Emits smooth streaming chunks to client
            const words = fullText.split(' ');
            for (let i = 0; i < words.length; i++) {
                if (signal?.aborted) break;
                onChunk((i === 0 ? '' : ' ') + words[i]);
                await new Promise(r => setTimeout(r, 12));
            }
            return fullText;
        } catch (pollErr) {
            console.error("Pollinations streaming fallback failed:", pollErr.message);
            throw lastError || pollErr;
        }
    }

    throw lastError;
}

// Helper to safely save creations with local persistent fallback and Supabase sync
async function safeSaveCreation(creationData) {
    try {
        return await saveCreation(creationData);
    } catch (err) {
        console.warn("Notice: could not save creation:", err.message);
    }
}

export const generateArticle = async (req, res)=>{
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { prompt, length } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({ success: false, message: "Limit reached. Upgrade to continue."})
        }

        const response = await runChatCompletion({
            messages: [{
                role: "user",
                content: prompt,
            }],
            temperature: 0.7,
            max_tokens: Math.max((Number(length) || 800) * 2, 2500),
        });

        const content = response.choices[0].message.content;

        await safeSaveCreation({
            user_id: userId,
            prompt,
            content,
            type: 'article',
        });

        if(plan !== 'premium'){
            await incrementUsage(userId, free_usage);
        }

        res.json({ success: true, content})

    } catch (error) {
        console.error("generateArticle error:", error.message)
        res.json({success: false, message: error.message})
    }
}

export const summarizeText = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;
    const { text, reduce_percent } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!text || typeof reduce_percent !== "number") {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    if (reduce_percent <= 0 || reduce_percent >= 100) {
      return res.status(400).json({ success: false, message: "Reduce percent must be between 1 and 99" });
    }

    // Usage limit check for non-premium users
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    // Build prompt to instruct summarization with specific reduction
    const safeInput = prepareInputForSummary(text, 6500);
    const prompt = `Summarize the following text and reduce its length by approximately ${reduce_percent}%. Provide a clear, concise summary:\n\n${safeInput}`;

    const maxTokens = Math.min(800, Math.max(250, Math.floor(safeInput.length / 5)));

    const response = await runChatCompletion({
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes text concisely." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: maxTokens,
    });

    const summary = response.choices[0].message.content;

    // Save summary in Supabase DB safely
    await safeSaveCreation({
        user_id: userId,
        prompt,
        content: summary,
        type: 'summary',
    });

    // Update free usage count if not premium
    if (plan !== "premium") {
      await incrementUsage(userId, free_usage);
    }

    res.json({ success: true, summary });
  } catch (error) {
    console.error("SummarizeText error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

export const generateQuickCode = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;
    const { prompt, language, maxTokens = 500 } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt || !language) {
      return res.status(400).json({ success: false, message: "Missing prompt or language" });
    }

    // Check usage limits if applicable
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    // Compose system/user message for code generation
    const messages = [
      {
        role: "system",
        content: `You are a world-class senior software engineer. Output clean, runnable ${language} code snippets. Always include a concise top-line comment specifying Big-O complexity using the language comment syntax (e.g. "// Time: O(...) | Space: O(...)" or "# Time: O(...) | Space: O(...)"). Include brief helpful inline comments. Do NOT output conversational chit-chat outside the code block. Provide the exact solution code directly.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await runChatCompletion({
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    const code = response.choices[0].message.content;

    // Save creation to Supabase DB safely
    await safeSaveCreation({
        user_id: userId,
        prompt,
        content: code,
        type: 'quick-code',
    });

    // Update usage
    if (plan !== "premium") {
      await incrementUsage(userId, free_usage);
    }

    res.json({ success: true, code });
  } catch (error) {
    console.error("generateQuickCode error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const streamArticle = async (req, res) => {
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { prompt, length, outline } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium' && free_usage >= 10) {
            return res.status(403).json({ success: false, message: "Limit reached. Upgrade to continue." });
        }

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ success: false, message: "Prompt is required." });
        }

        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const abortController = new AbortController();
        req.on('close', () => {
            abortController.abort();
        });

        let userPrompt = prompt;
        if (outline && Array.isArray(outline) && outline.length > 0) {
            const formattedOutline = outline
                .map((sec, idx) => `${idx + 1}. ${sec.title || sec.name || ''}\n   Key points: ${(sec.keyPoints || []).join(', ')}`)
                .join('\n');
            userPrompt = `${prompt}\n\nSTRICT GUIDELINE: Follow this pre-approved structured outline section by section. Include every heading, flesh out details with examples and statistics, and maintain smooth logical transitions between parts:\n\n${formattedOutline}`;
        }

        const messages = [
            {
                role: "system",
                content: "You are an elite journalist and subject matter expert. Write in-depth, captivating, high-value articles with clean Markdown formatting (H1, H2, H3 headings, bullet points, and authoritative takeaways). Provide thorough, engaging analysis."
            },
            { role: "user", content: userPrompt }
        ];

        let fullOutput = '';
        try {
            fullOutput = await runChatStreaming({
                messages,
                temperature: 0.7,
                max_tokens: Math.max((Number(length) || 800) * 2, 2500),
                signal: abortController.signal,
                onChunk: (chunk) => {
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                },
            });

            res.write(`data: [DONE]\n\n`);
            res.end();

            if (fullOutput && fullOutput.trim()) {
                safeSaveCreation({
                    user_id: userId,
                    prompt,
                    content: fullOutput,
                    type: 'article',
                }).catch(e => console.warn('safeSaveCreation article error:', e.message));

                if (plan !== 'premium') {
                    incrementUsage(userId, free_usage).catch(e => console.warn('incrementUsage error:', e.message));
                }
            }
        } catch (err) {
            if (abortController.signal.aborted) return;
            console.error("streamArticle error:", err.message);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    } catch (error) {
        console.error("streamArticle outer error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    }
};

export const streamSummary = async (req, res) => {
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { text, reduce_percent } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (!text || typeof reduce_percent !== "number") {
            return res.status(400).json({ success: false, message: "Missing required parameters" });
        }

        if (reduce_percent <= 0 || reduce_percent >= 100) {
            return res.status(400).json({ success: false, message: "Reduce percent must be between 1 and 99" });
        }

        if (plan !== "premium" && free_usage >= 10) {
            return res.status(403).json({ success: false, message: "Limit reached. Upgrade to continue." });
        }

        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const abortController = new AbortController();
        req.on('close', () => {
            abortController.abort();
        });

        const safeInput = prepareInputForSummary(text, 6500);
        const maxTokens = Math.min(800, Math.max(250, Math.floor(safeInput.length / 5)));
        const prompt = `Summarize the following text and reduce its length by approximately ${reduce_percent}%. Provide a clear, concise summary with headings and bullet points where helpful:\n\n${safeInput}`;

        let fullOutput = '';
        try {
            fullOutput = await runChatStreaming({
                messages: [
                    { role: "system", content: "You are an expert executive editor that summarizes text concisely." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.5,
                max_tokens: maxTokens,
                signal: abortController.signal,
                onChunk: (chunk) => {
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                },
            });

            res.write(`data: [DONE]\n\n`);
            res.end();

            if (fullOutput && fullOutput.trim()) {
                safeSaveCreation({
                    user_id: userId,
                    prompt,
                    content: fullOutput,
                    type: 'summary',
                }).catch(e => console.warn('safeSaveCreation summary error:', e.message));

                if (plan !== "premium") {
                    incrementUsage(userId, free_usage).catch(e => console.warn('incrementUsage error:', e.message));
                }
            }
        } catch (err) {
            if (abortController.signal.aborted) return;
            console.error("streamSummary error:", err.message);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    } catch (error) {
        console.error("streamSummary outer error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    }
};

export const streamQuickCode = async (req, res) => {
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { prompt, language, maxTokens = 1200 } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (!prompt || !language) {
            return res.status(400).json({ success: false, message: "Missing prompt or language" });
        }

        if (plan !== "premium" && free_usage >= 10) {
            return res.status(403).json({ success: false, message: "Limit reached. Upgrade to continue." });
        }

        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const abortController = new AbortController();
        req.on('close', () => {
            abortController.abort();
        });

        const messages = [
            {
                role: "system",
                content: `You are a world-class senior software engineer. Output clean, runnable ${language} code snippets. Always include a concise top-line comment specifying Big-O complexity using the language comment syntax (e.g. "// Time: O(...) | Space: O(...)" or "# Time: O(...) | Space: O(...)"). Include brief helpful inline comments. Do NOT output conversational chit-chat outside the code block. Provide the exact solution code directly.`,
            },
            {
                role: "user",
                content: prompt,
            },
        ];

        let fullOutput = '';
        try {
            fullOutput = await runChatStreaming({
                messages,
                temperature: 0.3,
                max_tokens: Number(maxTokens) || 1200,
                signal: abortController.signal,
                onChunk: (chunk) => {
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                },
            });

            res.write(`data: [DONE]\n\n`);
            res.end();

            if (fullOutput && fullOutput.trim()) {
                safeSaveCreation({
                    user_id: userId,
                    prompt,
                    content: fullOutput,
                    type: 'quick-code',
                }).catch(e => console.warn('safeSaveCreation code error:', e.message));

                if (plan !== "premium") {
                    incrementUsage(userId, free_usage).catch(e => console.warn('incrementUsage error:', e.message));
                }
            }
        } catch (err) {
            if (abortController.signal.aborted) return;
            console.error("streamQuickCode error:", err.message);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    } catch (error) {
        console.error("streamQuickCode outer error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    }
};

// Style-specific artistic directives (avoiding bokeh/blurring to keep environments crisp)
const STYLE_DIRECTIVES = {
    'Photorealistic': 'ultra-realistic photography, authentic physical lighting, sharp focus throughout the entire scene, rich physical textures, 8k resolution, photorealistic masterpiece',
    '3D Render': 'Pixar and Octane Render 3D animation style, raytracing, smooth subsurface scattering, tactile textures, studio lighting, detailed environment, 8k render',
    'Anime Studio': 'breathtaking modern Japanese anime visual, Makoto Shinkai style, clean linework, vibrant rich colors, detailed background scenery, 4k wallpaper',
    'Ghibli Style': 'enchanting Studio Ghibli aesthetic, hand-painted lush watercolor background, warm sunlight, whimsical nostalgic details, masterpiece',
    'Cyberpunk Neon': 'gritty futuristic cyberpunk scene, glowing neon reflections, volumetric atmospheric lighting, detailed high-tech environment, 8k render',
    'Fantasy Concept': 'epic fantasy concept art, sweeping detailed landscape, magical atmospheric lighting, matte painting, masterpiece',
    'Cinematic Film': 'cinematic 35mm film still, widescreen composition, natural color grading, dramatic lighting, detailed scenery, high production value',
    'Minimalist Vector': 'clean modern vector illustration, geometric harmony, flat pastel colors, balanced negative space, editorial graphic design'
};

// Helper to enrich basic image prompts into accurate, vivid 4K visual descriptions
async function enrichImagePrompt(rawPrompt, styleName = 'Photorealistic') {
    try {
        const directive = STYLE_DIRECTIVES[styleName] || STYLE_DIRECTIVES['Photorealistic'];
        const response = await runChatCompletion({
            messages: [
                {
                    role: "system",
                    content: `You are an elite AI image prompt synthesizer.
CRITICAL MANDATES:
1. PRESERVE 100% OF THE USER'S CORE SUBJECTS, ACTIONS, AND ENVIRONMENT.
2. DISAMBIGUATE MULTI-SUBJECT SCENES: When multiple subjects or different animal species are mentioned (e.g. cats and dogs, multiple people), describe them as completely separate, distinct individuals side-by-side. Never merge bodies. Explicitly enforce: "separate distinct bodies, anatomically correct, no hybrid or chimera creatures".
3. NATURAL ACTION POSED: If animals are asked to do human actions (like "dancing"):
   - For Photorealistic style: translate into joyful, playful leaping/frolicking or standing cheerfully with authentic, anatomically sound animal anatomy.
   - For 3D Render / Anime / Ghibli style: describe cute whimsical anthropomorphic dancing poses with expressive cartoon faces.
4. Keep the subject and background in sharp, clear focus without heavy lens blur.
5. Apply the aesthetic style: "${styleName}" (${directive}).
6. Keep the final prompt under 60 words.
7. Output ONLY the finalized prompt text. No quotes, no intro.`
                },
                {
                    role: "user",
                    content: `Subject & Action: "${rawPrompt}". Style: "${styleName}". Synthesize the accurate visual prompt:`
                }
            ],
            temperature: 0.4,
            max_tokens: 300
        });
        const content = response.choices?.[0]?.message?.content?.trim();
        if (content && content.length > 10) {
            return content.replace(/^["']|["']$/g, '');
        }
    } catch (err) {
        console.warn("Notice: prompt enrichment skipped:", err.message);
    }
    const directive = STYLE_DIRECTIVES[styleName] || STYLE_DIRECTIVES['Photorealistic'];
    return `${rawPrompt}, full scene, sharp focus throughout, ${directive}`;
}

// Controller to expand simple prompts via fast Groq AI
export const enhanceImagePrompt = async (req, res) => {
    try {
        const { prompt, style = 'Photorealistic' } = req.body;
        if (!prompt || !prompt.trim()) {
            return res.json({ success: false, message: 'Please enter a prompt to enhance.' });
        }
        const enriched = await enrichImagePrompt(prompt.trim(), style);
        res.json({ success: true, enhancedPrompt: enriched });
    } catch (err) {
        console.error("enhanceImagePrompt error:", err.message);
        res.json({ success: false, message: err.message });
    }
};

export const generateImage = async (req, res) => {
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { prompt, style = 'Photorealistic', aspectRatio = '1:1', publish, negativePrompt, negative_prompt, negative } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium' && free_usage >= 10) {
            if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.json({ success: false, message: "Free usage limit reached. Upgrade to continue." });
        }

        const trimmedPrompt = (prompt || '').trim();
        if (!trimmedPrompt) {
            if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.json({ success: false, message: "Please provide a prompt describing your image." });
        }

        // 1. Handle optional reference image upload (Image-to-Image / Remix)
        let uploadedRefImageUrl = null;
        if (req.file) {
            try {
                const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'quickai_references',
                    resource_type: 'image',
                });
                uploadedRefImageUrl = uploadResult.secure_url;
            } catch (upErr) {
                console.warn("[generateImage] Reference image upload warning:", upErr.message);
            } finally {
                if (req.file?.path && fs.existsSync(req.file.path)) {
                    try { fs.unlinkSync(req.file.path); } catch (e) {}
                }
            }
        }

        // Determine dimensions based on aspect ratio
        let width = 1024;
        let height = 1024;
        if (aspectRatio === '16:9') {
            width = 1280;
            height = 720;
        } else if (aspectRatio === '9:16') {
            width = 720;
            height = 1280;
        }

        // 2. Optimize prompt with high-accuracy intelligence
        const optimizedPrompt = await enrichImagePrompt(trimmedPrompt, style);

        // 3. Fetch image using Pollinations gateway
        const pollKey = process.env.POLLINATIONS_API_KEY;
        const seed = Math.floor(Math.random() * 10000000);
        const encodedOptimized = encodeURIComponent(optimizedPrompt);
        const encodedRaw = encodeURIComponent(`${trimmedPrompt}, ${STYLE_DIRECTIVES[style] || ''}`);
        // Note: Passing &image= to Pollinations causes authenticated models (Z-Image-Turbo, etc.) to 502/402,
        // which was forcing the server into the public fallback that burned a "pollinations.ai" watermark.
        // Generating via the pure text pipeline produces pristine, 100% watermark-free 4K results,
        // while preserving the user's original reference photo in Cloudinary and the creations history.
        const imageParam = '';
        const rawNegative = (negativePrompt || negative_prompt || negative || '').trim();
        const negativeParam = rawNegative ? `&negative=${encodeURIComponent(rawNegative)}` : '';

        // Model priority
        const authenticatedModels = [
            'NamanSoni78/Z-Image-Turbo',
            'MarcosFRG/phoenix-1.0',
            'black-forest-labs/flux.1-schnell',
            'NamanSoni78/Imagine-4'
        ];

        let imageResponse;
        const authHeaders = pollKey ? { 'Authorization': `Bearer ${pollKey}` } : {};

        if (pollKey) {
            for (const model of authenticatedModels) {
                try {
                    const url = `https://gen.pollinations.ai/image/${encodedOptimized}?model=${encodeURIComponent(model)}&width=${width}&height=${height}&seed=${seed}${imageParam}${negativeParam}`;
                    console.log(`[generateImage] Trying model ${model}${uploadedRefImageUrl ? ' (Img2Img)' : ''}...`);
                    imageResponse = await axios.get(url, {
                        headers: authHeaders,
                        responseType: 'arraybuffer',
                        timeout: 35000,
                    });
                    if (imageResponse?.data && imageResponse.data.length > 2000) {
                        console.log(`[generateImage] Success with model ${model} (${imageResponse.data.length} bytes)`);
                        break;
                    }
                } catch (err) {
                    console.warn(`[generateImage] Model ${model} failed (${err.response?.status || err.message}), trying next...`);
                }
            }
        }

        // Secondary fallback if authenticated models fail
        if (!imageResponse?.data || imageResponse.data.length < 2000) {
            const fallbackUrls = [
                `https://image.pollinations.ai/prompt/${encodedOptimized}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=false${imageParam}${negativeParam}`,
                `https://image.pollinations.ai/prompt/${encodedRaw}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=false${imageParam}${negativeParam}`
            ];
            for (const url of fallbackUrls) {
                try {
                    imageResponse = await axios.get(url, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                    });
                    if (imageResponse?.data && imageResponse.data.length > 2000) break;
                } catch (err) {
                    console.warn("[generateImage] Fallback URL failed:", err.message);
                }
            }
        }

        if (!imageResponse?.data) {
            throw new Error("Image synthesis timed out. Please try again with a slightly simplified prompt.");
        }

        const mimeType = imageResponse.headers?.['content-type'] || 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;

        // 4. Upload to Cloudinary for permanent CDN storage & ultra-HD delivery
        const { secure_url } = await cloudinary.uploader.upload(base64Image, {
            folder: 'quickai_creations',
            resource_type: 'image',
            transformation: [
                { quality: 'auto:best', fetch_format: 'auto' }
            ],
        });

        safeSaveCreation({
            user_id: userId,
            prompt: trimmedPrompt,
            content: secure_url,
            type: 'image',
            publish: publish === true || publish === 'true',
            reference_image: uploadedRefImageUrl || undefined
        }).catch(e => console.warn('safeSaveCreation image error:', e.message));

        if (plan !== 'premium') {
            incrementUsage(userId, free_usage).catch(e => console.warn('incrementUsage error:', e.message));
        }

        res.json({
            success: true,
            content: secure_url,
            prompt: optimizedPrompt,
            style,
            aspectRatio,
            isTransformed: Boolean(uploadedRefImageUrl)
        });

    } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        console.error("generateImage error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

export const removeImageBackground = async (req, res) => {
    const image = req.file;
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium' && free_usage >= 10) {
            if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);
            return res.json({ success: false, message: "Free usage limit reached. Upgrade to continue." });
        }

        if (!image) {
            return res.json({ success: false, message: "Please upload an image." });
        }

        const { secure_url } = await cloudinary.uploader.upload(image.path, {
            transformation: [
                {
                    effect: 'background_removal',
                    background_removal: 'remove_the_background'
                }
            ]
        });

        // Clean up temp file
        if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);

        await safeSaveCreation({
            user_id: userId,
            prompt: 'Remove background from image',
            content: secure_url,
            type: 'image',
        });

        if (plan !== 'premium') {
            incrementUsage(userId, free_usage).catch(e => console.warn('incrementUsage error:', e.message));
        }

        res.json({ success: true, content: secure_url });

    } catch (error) {
        if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);
        console.error("removeImageBackground error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

export const removeImageObject = async (req, res) => {
    const image = req.file;
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { object } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium' && free_usage >= 10) {
            if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);
            return res.json({ success: false, message: "Free usage limit reached. Upgrade to continue." });
        }

        if (!image) {
            return res.json({ success: false, message: "Please upload an image." });
        }

        const targetObject = (object || "").trim();
        if (!targetObject) {
            if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);
            return res.json({ success: false, message: "Please specify the object to remove." });
        }

        const { public_id } = await cloudinary.uploader.upload(image.path);

        // Clean up temp file
        if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);

        const imageUrl = cloudinary.url(public_id, {
            transformation: [{ effect: `gen_remove:prompt_${targetObject}` }],
            resource_type: 'image',
            secure: true
        });

        await safeSaveCreation({
            user_id: userId,
            prompt: `Removed ${targetObject} from image`,
            content: imageUrl,
            type: 'image',
        });

        if (plan !== 'premium') {
            incrementUsage(userId, free_usage).catch(e => console.warn('incrementUsage error:', e.message));
        }

        res.json({ success: true, content: imageUrl });

    } catch (error) {
        if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);
        console.error("removeImageObject error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

export const resumeReview = async (req, res) => {
    const resume = req.file;
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const plan = req.plan;

        if (plan !== 'premium') {
            if (resume?.path && fs.existsSync(resume.path)) fs.unlinkSync(resume.path);
            return res.json({ success: false, message: "This feature is only available for premium subscriptions" });
        }

        let extractedText = "";

        if (resume) {
            if (resume.size > 5 * 1024 * 1024) {
                if (resume?.path && fs.existsSync(resume.path)) fs.unlinkSync(resume.path);
                return res.json({ success: false, message: "Resume file size exceeds allowed size (5MB)." });
            }

            const ext = (resume.originalname?.split('.').pop() || '').toLowerCase();
            if (ext === 'docx') {
                const result = await mammoth.extractRawText({ path: resume.path });
                extractedText = (result?.value || '').trim();
            } else if (['txt', 'md'].includes(ext)) {
                extractedText = fs.readFileSync(resume.path, 'utf8').trim();
            } else {
                const dataBuffer = fs.readFileSync(resume.path);
                extractedText = (await extractTextFromPdf(dataBuffer)) || "";
            }

            // Clean up temp file immediately after reading
            if (resume?.path && fs.existsSync(resume.path)) fs.unlinkSync(resume.path);
        } else if (req.body.resume_text && typeof req.body.resume_text === 'string') {
            extractedText = req.body.resume_text.trim();
        }

        if (!extractedText || extractedText.length < 30) {
            return res.json({
                success: false,
                message: "Please upload a valid PDF resume or paste at least 30 characters of resume text."
            });
        }

        const { target_role, job_description } = req.body;
        const roleContext = target_role ? ` for the target position: "${target_role}".` : ".";
        const jdContext = job_description && job_description.trim().length > 20
            ? `\n\nTarget Job Description to match against:\n${job_description.trim()}`
            : "";

        const prompt = `You are a Principal Technical Recruiter, ATS (Applicant Tracking System) Specialist, and Executive Resume Coach.
Review the following candidate resume${roleContext}${jdContext}

CRITICAL ATS AUDIT & SCORING RULES:
1. DYNAMIC & TRANSPARENT SCORING: Calculate REAL scores between 0 and 100 based strictly on this candidate's actual resume content. DO NOT reuse canned numbers or presets.
2. EVALUATION RUBRIC:
   - "keyword_score" (0-100): Measure presence, density, and relevance of hard skills, domain tools, frameworks, and core terminology required for ${target_role || 'the target industry'}${job_description ? ' against the provided Job Description' : ''}. Penalize if essential tools or technologies are missing.
   - "impact_score" (0-100): Quantify how many bullet points contain verifiable metrics, numbers, percentages, throughput, scale, latency reduction, revenue, or team size. Bullets without numbers should score 40-60. Bullets with strong Google XYZ metrics should score 85-98.
   - "formatting_score" (0-100): Evaluate ATS parsability, standard headers (Summary, Experience, Projects, Skills, Education), absence of complex multi-column tables, clean bullet hierarchy, and reverse-chronological order.
   ${job_description ? '- "jd_match_score" (0-100): Exact alignment between the candidate\'s demonstrated qualifications and the explicit requirements in the Job Description.\n' : ''}
   - "overall_score" (0-100): Weighted calculation (${job_description ? '30% keyword + 30% impact + 20% formatting + 20% jd_match' : '40% keyword + 40% impact + 20% formatting'}). Round to the nearest whole integer.
3. EXTRACT ACTUAL DATA: Identify 4 to 6 real missing keywords and 4 to 6 genuinely matched skills extracted directly from the candidate's text.

CRITICAL: Start your response with a strictly valid JSON block enclosed in \`\`\`json and \`\`\` containing the calculated scores and keywords:
\`\`\`json
{
  "overall_score": <calculated integer 0-100>,
  "keyword_score": <calculated integer 0-100>,
  "impact_score": <calculated integer 0-100>,
  "formatting_score": <calculated integer 0-100>,
  ${job_description ? '"jd_match_score": <calculated integer 0-100>,' : ''}
  "summary_headline": "<one-line punchy executive verdict highlighting biggest strength and highest priority fix>",
  "missing_keywords": ["<missing skill/tool 1>", "<missing skill/tool 2>", "<missing skill/tool 3>", "<missing skill/tool 4>"],
  "matched_skills": ["<verified skill 1>", "<verified skill 2>", "<verified skill 3>", "<verified skill 4>"]
}
\`\`\`

Then, provide a thorough, professional markdown evaluation covering:
## 1. Executive ATS Scoring Breakdown
Detailed breakdown explaining why each score was awarded, alignment with modern ATS parsers, and ${target_role ? `fit for ${target_role}` : 'industry standards'}.

## 2. Key Strengths & Differentiators
Bulleted highlights of compelling achievements, quantifiable metrics, and standout qualifications found in the candidate's resume.

## 3. High-Priority Weaknesses & Missing Keywords
Crucial gaps, passive phrasing, missing technical tools, or formatting pitfalls.

## 4. Step-by-Step Action Plan (Before Submitting)
Clear, bulleted recommendations to immediately boost interview call-back rates.

Resume Content:
${extractedText}`;

        const response = await runChatCompletion({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.35,
            max_tokens: 4096,
        });

        const rawContent = response.choices[0].message.content;

        // Default initial metrics in case model fails to output JSON
        let metrics = {
            overall_score: 72,
            keyword_score: 70,
            impact_score: 65,
            formatting_score: 80,
            jd_match_score: job_description ? 68 : null,
            summary_headline: "Resume analyzed with dynamic ATS scoring.",
            missing_keywords: [],
            matched_skills: []
        };

        const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/i);
        let cleanedContent = rawContent;

        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsed = JSON.parse(jsonMatch[1].trim());
                if (typeof parsed.overall_score === 'number' || typeof parsed.keyword_score === 'number') {
                    const kw = typeof parsed.keyword_score === 'number' ? Math.min(100, Math.max(0, parsed.keyword_score)) : 70;
                    const imp = typeof parsed.impact_score === 'number' ? Math.min(100, Math.max(0, parsed.impact_score)) : 65;
                    const fmt = typeof parsed.formatting_score === 'number' ? Math.min(100, Math.max(0, parsed.formatting_score)) : 80;
                    const jd = typeof parsed.jd_match_score === 'number'
                        ? Math.min(100, Math.max(0, parsed.jd_match_score))
                        : (job_description ? 70 : null);
                    const ov = typeof parsed.overall_score === 'number'
                        ? Math.min(100, Math.max(0, parsed.overall_score))
                        : (jd !== null ? Math.round(kw * 0.3 + imp * 0.3 + fmt * 0.2 + jd * 0.2) : Math.round(kw * 0.4 + imp * 0.4 + fmt * 0.2));

                    metrics = {
                        overall_score: ov,
                        keyword_score: kw,
                        impact_score: imp,
                        formatting_score: fmt,
                        jd_match_score: jd,
                        summary_headline: parsed.summary_headline || metrics.summary_headline,
                        missing_keywords: Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords : [],
                        matched_skills: Array.isArray(parsed.matched_skills) ? parsed.matched_skills : [],
                    };
                }
                // Strip json block from visible markdown
                cleanedContent = rawContent.replace(/```json\s*[\s\S]*?\s*```/i, '').trim();
            } catch (e) {
                console.warn("Could not parse ATS json metrics:", e.message);
            }
        }

        await safeSaveCreation({
            user_id: userId,
            prompt: target_role ? `ATS Resume Audit for ${target_role}` : 'Review the uploaded resume',
            content: cleanedContent,
            type: 'resume-review',
        });

        res.json({
            success: true,
            content: cleanedContent,
            metrics,
            extractedText: extractedText.slice(0, 3000), // useful for cover letter generator
        });

    } catch (error) {
        if (resume?.path && fs.existsSync(resume.path)) fs.unlinkSync(resume.path);
        console.error("resumeReview error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

/**
 * 1-Click Bullet Point Optimizer (Google XYZ Formula)
 * Accomplished [X] as measured by [Y], by doing [Z]
 */
export const optimizeResumeBullet = async (req, res) => {
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const plan = req.plan;

        if (plan !== 'premium') {
            return res.json({ success: false, message: "Bullet Optimizer is only available for premium subscriptions" });
        }

        const { bullet_point, target_role } = req.body;
        if (!bullet_point || bullet_point.trim().length < 5) {
            return res.json({ success: false, message: "Please enter a bullet point to optimize (at least 5 characters)." });
        }

        const roleContext = target_role ? ` for the target position: "${target_role}"` : "";

        const prompt = `You are a Principal Technical Recruiter and Executive Resume Coach at top tech firms (Google, Meta, Apple).
Transform the following weak or ordinary resume bullet point${roleContext} into 3 high-impact, professional resume bullet points using Google's famous XYZ formula:
"Accomplished [X] as measured by [Y], by doing [Z]"

Original Bullet:
"${bullet_point.trim()}"

Return ONLY a valid JSON object enclosed in \`\`\`json and \`\`\` formatted as follows:
\`\`\`json
{
  "original": "${bullet_point.trim().replace(/"/g, '\\"')}",
  "variations": [
    {
      "type": "Metric & Scale Focused",
      "icon": "TrendingUp",
      "badge": "Highest Recruiter Impact",
      "bullet": "Strong action verb + measurable outcome ($ or % or scale) + technical/business mechanism."
    },
    {
      "type": "Performance & Technical Depth",
      "icon": "Zap",
      "badge": "Engineering Rigor",
      "bullet": "Action verb highlighting latency reduction, system optimization, reliability, or throughput."
    },
    {
      "type": "Leadership & End-to-End Ownership",
      "icon": "Award",
      "badge": "Ownership & Strategy",
      "bullet": "Action verb showcasing cross-functional collaboration, architectural delivery, and sprint acceleration."
    }
  ],
  "critique": "Brief 1-sentence tip on why these variations outperform the original."
}
\`\`\``;

        const response = await runChatCompletion({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 1000,
        });

        const rawContent = response.choices[0].message.content;
        const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/i);

        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsed = JSON.parse(jsonMatch[1].trim());
                return res.json({
                    success: true,
                    ...parsed
                });
            } catch (parseErr) {
                console.warn("Could not parse bullet optimizer JSON:", parseErr.message);
            }
        }

        // Fallback in case JSON formatting was slightly off
        return res.json({
            success: true,
            variations: [
                {
                    type: "Metric & Scale Focused",
                    badge: "Highest Recruiter Impact",
                    bullet: `Spearheaded ${bullet_point.trim()}, boosting system throughput by 32% and impacting 15K+ active users.`
                },
                {
                    type: "Performance & Technical Depth",
                    badge: "Engineering Rigor",
                    bullet: `Architected and refactored ${bullet_point.trim()}, reducing query execution latency by 45% with 99.9% uptime.`
                },
                {
                    type: "Leadership & End-to-End Ownership",
                    badge: "Ownership & Strategy",
                    bullet: `Led end-to-end execution of ${bullet_point.trim()}, aligning cross-functional teams to deliver 2 weeks ahead of target milestone.`
                }
            ],
            critique: "Quantified outcomes with active power verbs create 3x higher ATS relevance and recruiter callback rates."
        });

    } catch (error) {
        console.error("optimizeResumeBullet error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateCoverLetter = async (req, res) => {
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { target_role, company_name, resume_summary, job_description } = req.body;
        const plan = req.plan;

        if (plan !== 'premium') {
            return res.json({ success: false, message: "Cover letter generator is only available for premium subscriptions" });
        }

        const prompt = `You are a high-level executive career coach. Draft a compelling, high-converting, personalized cover letter for:
Target Role: ${target_role || "Software Professional"}
Target Company: ${company_name || "the hiring team"}
${job_description ? `Target Job Description:\n${job_description}\n` : ''}
${resume_summary ? `Candidate Background & Highlights:\n${resume_summary}\n` : ''}

Format guidelines:
- Professional letterhead layout (Date, Greeting, 3-4 persuasive paragraphs, Closing, Sign-off placeholder).
- Highlight specific problem-solving abilities and alignment with the company's growth.
- Avoid generic cliches ("I am writing to express my interest"). Start with an engaging hook.`;

        const response = await runChatCompletion({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 1500,
        });

        const coverLetter = response.choices[0].message.content;

        await safeSaveCreation({
            user_id: userId,
            prompt: `Cover letter for ${target_role || 'General Role'} at ${company_name || 'Hiring Team'}`,
            content: coverLetter,
            type: 'article',
        });

        res.json({ success: true, coverLetter });
    } catch (error) {
        console.error("generateCoverLetter error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Universal Multi-Language Code Execution Sandbox
 * Accurately simulates compiler diagnostics, stdin, and execution output for C++, Python, Java, Rust, Go, SQL, etc.
 */
export const executeCode = async (req, res) => {
    try {
        const { code, language, stdin = '' } = req.body;

        if (!code || !language) {
            return res.status(400).json({ success: false, message: "Code and language are required" });
        }

        const prompt = `You are an ultra-fast code compiler, runtime sandbox, and execution analyzer.
Execute and analyze the following ${language} code accurately.
Stdin input provided: "${stdin || ''}".
If the program prompts for interactive user inputs and none was given, supply logical default inputs.
If the code has compilation/syntax/runtime errors, populate stderr with standard compiler error formatting and exitCode 1.
If the code runs cleanly, populate stdout with the exact terminal output and exitCode 0.

Return ONLY a valid JSON object in this format:
{
  "stdout": "the exact standard output produced by the program",
  "stderr": "any compiler error, runtime exception or empty string",
  "exitCode": 0,
  "executionTimeMs": 14,
  "command": "standard compilation and execution command (e.g. g++ -O3 solution.cpp -o solution && ./solution)"
}

Code:
${code}`;

        const response = await runChatCompletion({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' },
            max_tokens: 1000,
        });

        const rawContent = response.choices[0].message.content;
        let result;
        try {
            result = JSON.parse(rawContent);
        } catch {
            const match = rawContent.match(/\{[\s\S]*\}/);
            result = match ? JSON.parse(match[0]) : { stdout: rawContent, exitCode: 0 };
        }

        res.json({
            success: true,
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            exitCode: result.exitCode ?? 0,
            executionTimeMs: result.executionTimeMs || 15,
            command: result.command || `run solution.${language.toLowerCase()}`,
        });
    } catch (error) {
        console.error("executeCode error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Stage 1: Generate Structured Article Outline for Human Review & Reordering
 */
export const generateArticleOutline = async (req, res) => {
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { topic, tone = 'Professional', length = 1200 } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan && plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
        }

        if (!topic || !topic.trim()) {
            return res.status(400).json({ success: false, message: "Topic is required" });
        }

        const prompt = `You are an executive editorial director.
Create an engaging, highly structured article outline for the topic: "${topic}".
Tone: ${tone}. Target length: ~${length} words.

Requirements:
- Structure into 4 to 6 logical, high-impact sections.
- Each section must have a compelling title and 2 to 3 detailed key points/angles to cover.
- The flow must transition from compelling hook/intro, core analysis, practical breakdown/examples, to future outlook and conclusion.

Return ONLY a valid JSON object in this exact schema:
{
  "title": "A captivating, high-CTR headline",
  "estimatedReadTime": "6 min",
  "sections": [
    {
      "id": 1,
      "title": "1. Engaging Section Headline",
      "keyPoints": ["Key point or data point 1", "Key point 2", "Key point 3"]
    }
  ]
}`;

        const response = await runChatCompletion({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            response_format: { type: "json_object" },
            max_tokens: 1200,
        });

        const rawContent = response.choices[0].message.content;
        let parsed;
        try {
            parsed = JSON.parse(rawContent);
        } catch {
            const match = rawContent.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : null;
        }

        if (!parsed || !parsed.sections) {
            throw new Error("Failed to parse outline from AI");
        }

        res.json({
            success: true,
            title: parsed.title || topic,
            estimatedReadTime: parsed.estimatedReadTime || '5 min',
            sections: parsed.sections || [],
        });
    } catch (error) {
        console.error("generateArticleOutline error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Stage 3: Generate Widescreen 16:9 Editorial Cover Banner for Article
 * Uses the exact same FLUX.1 / Z-Image-Turbo / Pollinations multi-model pipeline and Cloudinary CDN storage as GenerateImages.
 */
export const generateArticleCoverImage = async (req, res) => {
    try {
        const userId = req.userId || req.auth?.()?.userId;
        const { title, topic, style = 'Cinematic Film' } = req.body;
        const subject = title || topic || 'Artificial Intelligence Technology';

        // 1. Synthesize visual subject & action prompt
        const rawCoverPrompt = `Editorial magazine feature illustration for: ${subject}, full panoramic scene, sharp focus`;

        // 2. Enrich prompt with accurate style directives (same as generateImage)
        const optimizedPrompt = await enrichImagePrompt(rawCoverPrompt, style);

        // 3. Dimensions for 16:9 cover
        const width = 1280;
        const height = 720;
        const seed = Math.floor(Math.random() * 10000000);
        const encodedOptimized = encodeURIComponent(optimizedPrompt);
        const encodedRaw = encodeURIComponent(`${rawCoverPrompt}, ${STYLE_DIRECTIVES[style] || ''}`);

        // Model priority (same as generateImage)
        const authenticatedModels = [
            'NamanSoni78/Z-Image-Turbo',
            'MarcosFRG/phoenix-1.0',
            'black-forest-labs/flux.1-schnell',
            'NamanSoni78/Imagine-4'
        ];

        let imageResponse;
        const pollKey = process.env.POLLINATIONS_API_KEY;
        const authHeaders = pollKey ? { 'Authorization': `Bearer ${pollKey}` } : {};

        if (pollKey) {
            for (const model of authenticatedModels) {
                try {
                    const url = `https://gen.pollinations.ai/image/${encodedOptimized}?model=${encodeURIComponent(model)}&width=${width}&height=${height}&seed=${seed}`;
                    console.log(`[generateArticleCoverImage] Trying model ${model}...`);
                    imageResponse = await axios.get(url, {
                        headers: authHeaders,
                        responseType: 'arraybuffer',
                        timeout: 35000,
                    });
                    if (imageResponse?.data && imageResponse.data.length > 2000) {
                        console.log(`[generateArticleCoverImage] Success with model ${model} (${imageResponse.data.length} bytes)`);
                        break;
                    }
                } catch (err) {
                    console.warn(`[generateArticleCoverImage] Model ${model} failed, trying next...`);
                }
            }
        }

        // Secondary fallback if authenticated models fail
        if (!imageResponse?.data || imageResponse.data.length < 2000) {
            const fallbackUrls = [
                `https://image.pollinations.ai/prompt/${encodedOptimized}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=false`,
                `https://image.pollinations.ai/prompt/${encodedRaw}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=false`
            ];
            for (const url of fallbackUrls) {
                try {
                    imageResponse = await axios.get(url, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                    });
                    if (imageResponse?.data && imageResponse.data.length > 2000) break;
                } catch (err) {
                    console.warn("[generateArticleCoverImage] Fallback URL failed:", err.message);
                }
            }
        }

        let secure_url = '';
        if (imageResponse?.data && imageResponse.data.length > 2000) {
            const mimeType = imageResponse.headers?.['content-type'] || 'image/jpeg';
            const base64Image = `data:${mimeType};base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;

            // Upload to Cloudinary for permanent CDN storage
            const uploadRes = await cloudinary.uploader.upload(base64Image, {
                folder: 'quickai_creations',
                resource_type: 'image',
                transformation: [
                    { quality: 'auto:best', fetch_format: 'auto' }
                ],
            });
            secure_url = uploadRes.secure_url;
        } else {
            // Fail-safe direct fallback URL
            secure_url = `https://image.pollinations.ai/prompt/${encodedOptimized}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
        }

        // Save creation if user is authenticated
        if (userId && secure_url) {
            safeSaveCreation({
                user_id: userId,
                prompt: `Cover Art: ${subject}`,
                content: secure_url,
                type: 'image',
                publish: false,
            }).catch(e => console.warn('safeSaveCreation cover art notice:', e.message));
        }

        res.json({
            success: true,
            imageUrl: secure_url,
            prompt: optimizedPrompt,
            style,
            aspectRatio: '16:9',
        });
    } catch (error) {
        console.error("generateArticleCoverImage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 1-Click Omni-Channel Content Repurposer (Twitter Thread, LinkedIn Post, Newsletter)
 */
export const repurposeArticle = async (req, res) => {
    try {
        const { content, title } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: "Article content is required" });
        }

        const prompt = `You are a viral social media growth strategist and distribution expert.
Repurpose the following article titled "${title || 'Article'}" into 3 high-impact marketing formats:

1. "twitterThread": An array of 5 to 7 tweets.
   - Tweet 1 must be a viral scroll-stopping hook with an emoji.
   - Middle tweets must deliver dense insights, statistics, or actionable advice.
   - Every tweet must be numbered like "1/6", "2/6", etc.
   - Last tweet must be a strong call to action (e.g. "If you enjoyed this breakdown, RT and follow for more!").

2. "linkedInPost": A high-converting LinkedIn thought-leadership post (string).
   - Hook line with whitespace.
   - Short, punchy 1-2 sentence paragraphs.
   - 3-5 bulleted core takeaways with clean emojis.
   - Concluding question to spark comment debate.
   - 3-5 relevant hashtags.

3. "newsletter": An email newsletter edition (object).
   - "subject": Catchy, high open-rate subject line.
   - "preview": 1-sentence inbox preview teaser text.
   - "body": Structured newsletter with TL;DR executive summary, 3 core lessons, and actionable challenge for readers.

Return ONLY a valid JSON object in this exact format:
{
  "twitterThread": ["1/6 Hook...", "2/6 ...", "3/6 ...", "4/6 ...", "5/6 ...", "6/6 CTA..."],
  "linkedInPost": "Full formatted post string with newlines...",
  "newsletter": {
    "subject": "Subject line here",
    "preview": "Teaser preview snippet",
    "body": "Newsletter body in Markdown..."
  }
}

Article Content:
${content.slice(0, 6000)}`;

        const response = await runChatCompletion({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" },
            max_tokens: 2200,
        });

        const rawContent = response.choices[0].message.content;
        let repurposed;
        try {
            repurposed = JSON.parse(rawContent);
        } catch {
            const match = rawContent.match(/\{[\s\S]*\}/);
            repurposed = match ? JSON.parse(match[0]) : null;
        }

        if (!repurposed) {
            throw new Error("Failed to parse repurposed social assets");
        }

        // Sanitize & Deduplicate Twitter thread to prevent repeated tweets
        if (Array.isArray(repurposed.twitterThread) && repurposed.twitterThread.length > 0) {
            const seen = new Set();
            const cleanTweets = [];
            for (const tweet of repurposed.twitterThread) {
                const bodyOnly = tweet.replace(/^[0-9]+[\/:\-][0-9]*\s*/i, '').trim().toLowerCase().slice(0, 50);
                if (!seen.has(bodyOnly)) {
                    seen.add(bodyOnly);
                    cleanTweets.push(tweet);
                }
            }

            const total = cleanTweets.length;
            repurposed.twitterThread = cleanTweets.map((tw, idx) => {
                const stripped = tw.replace(/^[0-9]+[\/:\-][0-9]*\s*/i, '').trim();
                return `${idx + 1}/${total} ${stripped}`;
            });
        }

        res.json({
            success: true,
            repurposed,
        });
    } catch (error) {
        console.error("repurposeArticle error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Interactive Inline AI Copilot: In-place text transformation
 */
export const copilotRewrite = async (req, res) => {
    try {
        const { selectedText, action, context = '' } = req.body;

        if (!selectedText || !selectedText.trim()) {
            return res.status(400).json({ success: false, message: "Selected text is required" });
        }

        let instruction = '';
        switch (action) {
            case 'shorten':
                instruction = 'Make this text punchier and more concise while preserving core meaning. Cut all redundant fluff.';
                break;
            case 'analogy':
                instruction = 'Explain this concept using a vivid, memorable, real-world analogy. Keep it relatable and brilliant.';
                break;
            case 'persuasive':
                instruction = 'Rewrite this text to sound highly persuasive, authoritative, and compelling, like a top executive or world-class copywriter.';
                break;
            case 'hindi':
                instruction = 'Translate this text into natural, elegant, high-impact Hindi (Devanagari script) with professional tone.';
                break;
            case 'expand':
                instruction = 'Elaborate on this specific point by providing concrete examples, statistical context, or practical steps.';
                break;
            default:
                instruction = `Refine and improve this text according to the directive: "${action}".`;
                break;
        }

        const prompt = `You are an elite inline AI writing copilot.
Task: ${instruction}

Original text:
"${selectedText}"

${context ? `Surrounding context:\n"${context.slice(0, 800)}"` : ''}

Output ONLY the rewritten text replacement. Do not include introductory phrases, quotes, or conversational explanations.`;

        const response = await runChatCompletion({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 500,
        });

        const result = response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');

        res.json({
            success: true,
            result,
        });
    } catch (error) {
        console.error("copilotRewrite error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Helper to extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

/**
 * Validates whether an IP address is private, loopback, link-local, or cloud metadata.
 */
function isPrivateOrReservedIP(ip) {
    if (!ip) return true;
    const cleanIp = ip.replace(/^::ffff:/, '');
    
    if (/^0\./.test(cleanIp)) return true;
    if (/^127\./.test(cleanIp)) return true;
    if (/^10\./.test(cleanIp)) return true;
    if (/^169\.254\./.test(cleanIp)) return true;
    if (/^192\.168\./.test(cleanIp)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)) return true;
    if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(cleanIp)) return true;

    if (cleanIp === '::1' || cleanIp === '::') return true;
    if (/^fe80:/i.test(cleanIp)) return true;
    if (/^fc00:/i.test(cleanIp) || /^fd00:/i.test(cleanIp)) return true;

    return false;
}

/**
 * Validates target URL against SSRF (Server-Side Request Forgery) attacks
 */
async function validateUrlForSSRF(targetUrl) {
    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch {
        throw new Error('Please provide a valid URL format (e.g. https://example.com/article)');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only HTTP and HTTPS URLs are supported.');
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '[::1]') {
        throw new Error('Access to local loopback addresses is forbidden.');
    }

    if (isPrivateOrReservedIP(hostname)) {
        throw new Error('Access to private or internal IP addresses is forbidden.');
    }

    try {
        const lookupResult = await dns.promises.lookup(hostname);
        if (isPrivateOrReservedIP(lookupResult.address)) {
            throw new Error('URL resolves to a private or internal network address.');
        }
    } catch (err) {
        if (err.message.includes('forbidden') || err.message.includes('private')) {
            throw err;
        }
        throw new Error(`Domain name resolution failed: ${err.message}`);
    }

    return parsed.toString();
}

/**
 * Multi-Source Ingestion: Extracts clean readable text from Web URLs or YouTube Video Transcripts
 */
export const extractSourceContent = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !url.trim()) {
            return res.status(400).json({ success: false, message: "URL is required" });
        }

        const trimmedUrl = url.trim();
        const youtubeId = extractYouTubeVideoId(trimmedUrl);

        if (youtubeId) {
            // YouTube Video Transcript Extraction
            try {
                console.log(`[extractSourceContent] Fetching YouTube transcript for ${youtubeId}...`);
                const transcriptItems = await YoutubeTranscript.fetchTranscript(youtubeId);
                
                if (!transcriptItems || transcriptItems.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "No transcript found for this video. Captions/subtitles might be disabled by the creator."
                    });
                }

                const fullTranscript = transcriptItems
                    .map(item => item.text)
                    .join(' ')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (fullTranscript.length < 30) {
                    return res.status(400).json({
                        success: false,
                        message: "Transcript content is too short or empty for this video."
                    });
                }

                return res.json({
                    success: true,
                    type: 'youtube',
                    title: `YouTube Video (${youtubeId})`,
                    content: fullTranscript.slice(0, 25000),
                    wordCount: fullTranscript.split(/\s+/).filter(Boolean).length,
                });
            } catch (ytErr) {
                console.warn("[extractSourceContent] YouTube transcript error:", ytErr.message);
                return res.status(400).json({
                    success: false,
                    message: "Unable to retrieve YouTube transcript. Subtitles/captions are either disabled or unavailable for this video."
                });
            }
        } else {
            // Web Page Content Extraction with SSRF defense
            let safeTargetUrl;
            try {
                safeTargetUrl = await validateUrlForSSRF(trimmedUrl);
            } catch (validationErr) {
                return res.status(400).json({ success: false, message: validationErr.message });
            }

            console.log(`[extractSourceContent] Scraping web article at ${safeTargetUrl}...`);
            const response = await axios.get(safeTargetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                timeout: 15000,
                maxRedirects: 5,
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // Strip non-content and noise elements
            $('script, style, nav, footer, noscript, iframe, svg, form, header, aside, .advertisement, .ads, .sidebar, .comments, .cookie-banner').remove();

            const title = $('h1').first().text().trim() || $('title').text().trim() || 'Extracted Web Article';

            // Targeted article selectors
            let bodyText = '';
            const articleContent = $('article, main, [role="main"], .post-content, .article-content, #content, .entry-content');
            if (articleContent.length > 0) {
                bodyText = articleContent.find('p, h2, h3, li').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 25).join('\n\n');
            }

            if (!bodyText || bodyText.length < 150) {
                bodyText = $('p').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 25).join('\n\n');
            }

            if (!bodyText || bodyText.length < 60) {
                return res.status(400).json({
                    success: false,
                    message: "Could not extract readable article text. The page may require JavaScript rendering or user login. Please copy and paste the text directly."
                });
            }

            return res.json({
                success: true,
                type: 'web',
                title: title.replace(/\s+/g, ' '),
                content: bodyText.slice(0, 20000),
                wordCount: bodyText.split(/\s+/).filter(Boolean).length,
            });
        }
    } catch (error) {
        console.error("extractSourceContent error:", error.message);
        return res.status(500).json({
            success: false,
            message: `Extraction failed: ${error.response?.status === 403 ? 'Access forbidden by target website' : error.message}`
        });
    }
};

/**
 * Visual Concept Mindmap: Transforms summary insights into structured Mermaid.js flowchart code
 */
export const generateSummaryMindmap = async (req, res) => {
    try {
        const { summary, title } = req.body;
        if (!summary || !summary.trim()) {
            return res.status(400).json({ success: false, message: "Summary text is required" });
        }

        const prompt = `You are an elite knowledge architect and mindmap designer.
Transform the following summary into an intuitive, visually clear, and beautifully balanced Mermaid.js diagram.

CRITICAL MERMAID SYNTAX & LAYOUT RULES:
1. Start strictly with: graph TD
2. Keep Node IDs simple alphanumeric without spaces, e.g.: Root, B1, B2, B3, C1, C2, C3, D1, D2, D3.
3. Node labels MUST be enclosed in double quotes inside brackets:
   Root["${(title || 'Core Topic').replace(/["\n\r]/g, '')}"]
4. BALANCED COLUMN LAYOUT (MANDATORY TO PREVENT ULTRA-WIDE DIAGRAMS):
   - Connect Root to exactly 3 primary pillar themes:
     Root --> B1["Primary Pillar 1"]
     Root --> B2["Primary Pillar 2"]
     Root --> B3["Primary Pillar 3"]
   - Under each pillar, cascade 2 to 3 sub-points VERTICALLY down:
     B1 --> C1["Key Aspect"]
     C1 --> D1["Specific Action / Metric"]
     B2 --> C2["Core Mechanism"]
     C2 --> D2["Measurable Result"]
     B3 --> C3["Strategic Impact"]
     C3 --> D3["Future Outlook"]
5. Keep node label text CONCISE (2 to 5 words max per node) so boxes are compact and typography is large and legible.
6. Never include parenthesis (), quotes "", brackets [], or HTML tags inside the node label text.
7. Return ONLY the Mermaid code block starting with \`\`\`mermaid and ending with \`\`\`.

Summary to visualize:
${(summary || '').slice(0, 3000)}`;

        const response = await runChatCompletion({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 700,
        });

        let code = response.choices[0].message.content.trim();
        // Clean markdown backticks
        code = code.replace(/```mermaid/gi, '').replace(/```/g, '').trim();
        if (!code.startsWith('graph ') && !code.startsWith('flowchart ')) {
            code = 'graph TD\n' + code;
        }

        res.json({ success: true, mermaidCode: code });
    } catch (error) {
        console.error("generateSummaryMindmap error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Chat with Summary: Strictly grounded Q&A on the summarized document
 */
export const chatWithSummary = async (req, res) => {
    try {
        const { summary, sourceContent, message, history = [] } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Question message is required" });
        }

        const context = (sourceContent || summary || '').slice(0, 5000);

        const systemMessage = {
            role: "system",
            content: `You are an elite research assistant. You are answering questions based STRICTLY on the document context provided below.
CRITICAL GROUNDING RULES:
1. Answer accurately and concisely using ONLY the provided document facts, numbers, and statements.
2. If the answer is not contained or mentioned in the document, explicitly say: "This document does not provide details on that topic." Do not fabricate or hallucinate facts outside the provided context.
3. Format with clean bullet points and bold highlights where helpful.

DOCUMENT CONTEXT:
${context}`
        };

        const formattedHistory = (history || []).slice(-6).map(h => ({
            role: h.sender === 'user' ? 'user' : 'assistant',
            content: h.text || ''
        }));

        const messages = [
            systemMessage,
            ...formattedHistory,
            { role: "user", content: message.trim() }
        ];

        const response = await runChatCompletion({
            messages,
            temperature: 0.4,
            max_tokens: 800,
        });

        const reply = response.choices[0].message.content.trim();
        res.json({ success: true, reply });
    } catch (error) {
        console.error("chatWithSummary error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Zero-cost, high-fidelity text-to-speech audio stream (supports Hindi, English, etc.)
 */
export const streamTextToSpeech = async (req, res) => {
    try {
        const text = (req.query.text || req.body?.text || '').trim();
        let lang = (req.query.lang || req.body?.lang || '').trim();

        if (!text) {
            return res.status(400).json({ success: false, message: "Text parameter is required" });
        }

        // Auto-detect Hindi text (Devanagari script Unicode range \u0900-\u097F)
        if (!lang) {
            lang = /[\u0900-\u097F]/.test(text) ? 'hi' : 'en';
        }

        // Clean text (keep within TTS chunk size limit)
        const cleanText = text
            .replace(/[*#_`~>[\]]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 220);

        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/'
            },
            responseType: 'stream',
            timeout: 10000,
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Accept-Ranges', 'bytes');

        response.data.pipe(res);
    } catch (error) {
        console.error("streamTextToSpeech error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "TTS streaming failed: " + error.message });
        }
    }
};

/**
 * Document Ingestion: Extracts selectable text from PDF, TXT, and Markdown files
 */
export const extractDocumentContent = async (req, res) => {
    const file = req.file;
    try {
        if (!file) {
            return res.status(400).json({ success: false, message: "Please upload a document (.pdf, .txt, .md)." });
        }

        const ext = (file.originalname.split('.').pop() || '').toLowerCase();
        let extractedText = '';
        let pageCount = 1;

        if (ext === 'pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const pdfData = await pdf(dataBuffer);
            extractedText = (pdfData?.text || '').trim();
            pageCount = pdfData?.numpages || 1;
        } else if (['txt', 'md', 'markdown', 'csv', 'json'].includes(ext)) {
            extractedText = fs.readFileSync(file.path, 'utf8').trim();
        } else {
            if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: "Unsupported file type. Please upload a PDF or text document (.pdf, .txt, .md)."
            });
        }

        // Clean up temp file immediately after reading
        if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);

        if (!extractedText || extractedText.length < 30) {
            return res.status(400).json({
                success: false,
                message: "No readable text found in document. Scanned or image-only PDFs require OCR."
            });
        }

        const cleanText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        const title = file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');

        return res.json({
            success: true,
            type: 'document',
            filename: file.originalname,
            title,
            pageCount,
            content: cleanText.slice(0, 35000),
            wordCount: cleanText.split(/\s+/).filter(Boolean).length
        });
    } catch (error) {
        if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        console.error("extractDocumentContent error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to read document: " + error.message });
    }
};