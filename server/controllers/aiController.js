import OpenAI from "openai";
import sql from "../configs/db.js";
import { incrementUsage } from "../middlewares/auth.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import pdf from 'pdf-parse/lib/pdf-parse.js'

const AI = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY,
    baseURL: process.env.GROQ_API_KEY
        ? "https://api.groq.com/openai/v1"
        : "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const AI_MODEL = process.env.GROQ_API_KEY ? "openai/gpt-oss-120b" : "gemini-2.0-flash";


export const generateArticle = async (req, res)=>{
    try {
        const { userId } = req.auth();
        const { prompt, length } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({ success: false, message: "Limit reached. Upgrade to continue."})
        }

        const response = await AI.chat.completions.create({
            model: AI_MODEL,
            messages: [{
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: length,
        });

        const content = response.choices[0].message.content

        await sql` INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${prompt}, ${content}, 'article')`;

        if(plan !== 'premium'){
            await incrementUsage(userId, free_usage);
        }

        res.json({ success: true, content})


    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

export const summarizeText = async (req, res) => {
  try {
    const { userId } = req.auth();  // your auth middleware
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
    const prompt = `Summarize the following text and reduce its length by approximately ${reduce_percent}%. Provide a clear, concise summary:\n\n${text}`;

    const maxTokens = Math.min(1000, Math.floor(text.length / 4)); // roughly limit tokens based on input size

    const response = await AI.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes text concisely." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: maxTokens,
    });

    const summary = response.choices[0].message.content;

    // Save summary in DB
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${summary}, 'summary')`;

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
    const { userId } = req.auth(); // your auth middleware
    const { prompt, language, maxTokens = 500 } = req.body;
    const plan = req.plan;           // if you have plan info from middleware
    const free_usage = req.free_usage; // usage limits

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
        content: `You are a helpful assistant that only outputs ${language} code snippets with no explanations, comments, or extra text. Provide only the exact code requested.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await AI.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    const code = response.choices[0].message.content;

    // Save creation to DB if needed
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${code}, 'quick-code')`;

    // Update usage
    if (plan !== "premium") {
      await incrementUsage(userId, free_usage);
    }

    res.json({ success: true, code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res)=>{
    try {
        const { userId } = req.auth();
        const { prompt, publish } = req.body;
        const plan = req.plan;

        if(plan !== 'premium'){
            return res.json({ success: false, message: "This feature is only available for premium subscriptions"})
        }

        
        const formData = new FormData()
        formData.append('prompt', prompt)
        const {data} = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
            headers: {'x-api-key': process.env.CLIPDROP_API_KEY,},
            responseType: "arraybuffer",
        })

        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

        const {secure_url} = await cloudinary.uploader.upload(base64Image)
        

        await sql` INSERT INTO creations (user_id, prompt, content, type, publish) 
        VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false })`;

        res.json({ success: true, content: secure_url})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

export const removeImageBackground = async (req, res) => {
    const image = req.file;
    try {
        const { userId } = req.auth();
        const plan = req.plan;

        if (plan !== 'premium') {
            if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);
            return res.json({ success: false, message: "This feature is only available for premium subscriptions" });
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

        await sql` INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;

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
        const { userId } = req.auth();
        const { object } = req.body;
        const plan = req.plan;

        if (plan !== 'premium') {
            if (image?.path && fs.existsSync(image.path)) fs.unlinkSync(image.path);
            return res.json({ success: false, message: "This feature is only available for premium subscriptions" });
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
            transformation: [{ effect: `gen_remove:${targetObject}` }],
            resource_type: 'image'
        });

        await sql` INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${`Removed ${targetObject} from image`}, ${imageUrl}, 'image')`;

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
        const { userId } = req.auth();
        const plan = req.plan;

        if (plan !== 'premium') {
            if (resume?.path && fs.existsSync(resume.path)) fs.unlinkSync(resume.path);
            return res.json({ success: false, message: "This feature is only available for premium subscriptions" });
        }

        if (!resume) {
            return res.json({ success: false, message: "Please upload a resume in PDF format." });
        }

        if (resume.size > 5 * 1024 * 1024) {
            if (resume?.path && fs.existsSync(resume.path)) fs.unlinkSync(resume.path);
            return res.json({ success: false, message: "Resume file size exceeds allowed size (5MB)." });
        }

        const dataBuffer = fs.readFileSync(resume.path);
        const pdfData = await pdf(dataBuffer);

        // Clean up temp file immediately after reading
        if (resume?.path && fs.existsSync(resume.path)) fs.unlinkSync(resume.path);

        const extractedText = (pdfData?.text || "").trim();
        if (extractedText.length < 30) {
            return res.json({
                success: false,
                message: "No selectable text found in the PDF. Scanned image PDFs are not supported. Please upload a text-based PDF resume."
            });
        }

        const prompt = `You are an expert ATS (Applicant Tracking System) and executive career coach. Review the following resume thoroughly:\n\n1. Provide an overall ATS score out of 100 with clear justification.\n2. List Key Strengths.\n3. List Critical Weaknesses & Missing Industry Keywords.\n4. Provide 3-5 high-impact bulleted actionable recommendations for improvement.\n\nResume Content:\n\n${extractedText}`;

        const response = await AI.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 1500,
        });

        const content = response.choices[0].message.content;

        await sql` INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

        res.json({ success: true, content });

    } catch (error) {
        if (resume?.path && fs.existsSync(resume.path)) fs.unlinkSync(resume.path);
        console.error("resumeReview error:", error.message);
        res.json({ success: false, message: error.message });
    }
};