import express from "express";
import { auth, optionalAuth } from "../middlewares/auth.js";
import { 
    generateArticle, 
    generateImage, 
    removeImageBackground,
    summarizeText, 
    removeImageObject, 
    resumeReview,
    generateQuickCode,
    streamArticle,
    streamSummary,
    streamQuickCode,
    generateCoverLetter,
    executeCode,
    generateArticleOutline,
    generateArticleCoverImage,
    repurposeArticle,
    copilotRewrite,
    extractSourceContent,
    generateSummaryMindmap,
    chatWithSummary,
    streamTextToSpeech,
    extractDocumentContent,
    enhanceImagePrompt,
    optimizeResumeBullet
} from "../controllers/aiController.js";
import {
    parseUploadedResume,
    analyzeJobDescription,
    generateSmartFollowUp,
    synthesizeResume,
    improveResumeSection,
    getUserResumes,
    getResumeDetails,
    saveResumeVersion,
    deleteResume
} from "../controllers/resumeBuilderController.js";
import { upload } from "../configs/multer.js";
import { aiRateLimiter } from "../middlewares/rateLimiter.js";

const aiRouter = express.Router();

// Apply AI rate limiter across all AI generation and processing endpoints
aiRouter.use(aiRateLimiter);

// High-fidelity natural TTS audio streaming (Hindi, English, etc.)
aiRouter.get('/tts-stream', optionalAuth, streamTextToSpeech);
aiRouter.post('/tts-stream', optionalAuth, streamTextToSpeech);

// Document Ingestion (PDF, TXT, MD)
aiRouter.post('/extract-document-content', upload.single('file'), optionalAuth, extractDocumentContent);

// Synchronous endpoints
aiRouter.post('/generate-article', auth, generateArticle)
aiRouter.post('/generate-outline', optionalAuth, generateArticleOutline)
aiRouter.post('/generate-article-cover', optionalAuth, generateArticleCoverImage)
aiRouter.post('/repurpose-article', optionalAuth, repurposeArticle)
aiRouter.post('/copilot-rewrite', optionalAuth, copilotRewrite)
aiRouter.post('/extract-source-content', optionalAuth, extractSourceContent)
aiRouter.post('/generate-summary-mindmap', optionalAuth, generateSummaryMindmap)
aiRouter.post('/chat-summary', optionalAuth, chatWithSummary)
aiRouter.post('/summarize-article', auth, summarizeText)
aiRouter.post('/generate-quick-code', auth, generateQuickCode)

// Real-Time SSE Streaming endpoints
aiRouter.post('/stream-article', auth, streamArticle)
aiRouter.post('/stream-summary', auth, streamSummary)
aiRouter.post('/stream-quick-code', auth, streamQuickCode)

aiRouter.post('/generate-image', upload.single('image'), auth, generateImage)
aiRouter.post('/enhance-image-prompt', auth, enhanceImagePrompt)

aiRouter.post('/remove-image-background', upload.single('image'), auth, removeImageBackground)

aiRouter.post('/remove-image-object', upload.single('image'), auth, removeImageObject)

aiRouter.post('/resume-review', upload.single('resume'), auth, resumeReview)
aiRouter.post('/generate-cover-letter', auth, generateCoverLetter)
aiRouter.post('/optimize-resume-bullet', auth, optimizeResumeBullet)
aiRouter.post('/execute-code', auth, executeCode)

// AI-Powered ATS Resume Builder Studio
aiRouter.post('/resume-builder/parse', upload.single('resume'), optionalAuth, parseUploadedResume)
aiRouter.post('/resume-builder/analyze-jd', optionalAuth, analyzeJobDescription)
aiRouter.post('/resume-builder/smart-followup', optionalAuth, generateSmartFollowUp)
aiRouter.post('/resume-builder/synthesize', optionalAuth, synthesizeResume)
aiRouter.post('/resume-builder/improve-section', optionalAuth, improveResumeSection)
aiRouter.get('/resume-builder/list', auth, getUserResumes)
aiRouter.get('/resume-builder/:id', auth, getResumeDetails)
aiRouter.post('/resume-builder/save', auth, saveResumeVersion)
aiRouter.delete('/resume-builder/:id', auth, deleteResume)

export default aiRouter