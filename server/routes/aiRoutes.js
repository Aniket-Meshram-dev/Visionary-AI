import express from "express";
import { auth } from "../middlewares/auth.js";
import { generateArticle, generateImage, removeImageBackground,summarizeText, removeImageObject, resumeReview,generateQuickCode } from "../controllers/aiController.js";
import { upload } from "../configs/multer.js";

const aiRouter = express.Router();

aiRouter.post('/generate-article', auth, generateArticle)
aiRouter.post('/summarize-article', auth, summarizeText)
aiRouter.post('/generate-quick-code', auth, generateQuickCode)

aiRouter.post('/generate-image', auth, generateImage)

aiRouter.post('/remove-image-background', upload.single('image'), auth, removeImageBackground)

aiRouter.post('/remove-image-object', upload.single('image'), auth, removeImageObject)



aiRouter.post('/resume-review', upload.single('resume'), auth, resumeReview)

export default aiRouter