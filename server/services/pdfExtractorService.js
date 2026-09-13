import pdf from 'pdf-parse/lib/pdf-parse.js';
import axios from 'axios';

const GEMINI_PDF_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

/**
 * Robust, resilient PDF text extractor.
 * 1. Attempts standard in-memory pdf-parse extraction.
 * 2. If text is empty or < 30 chars (common in vector-path PDFs printed from browsers, Canva, Figma, or scanned docs),
 *    falls back to Google Gemini Multimodal Document Extraction to preserve 100% of candidate qualifications,
 *    contact info, and bullets faithfully.
 *
 * @param {Buffer} dataBuffer - Binary buffer of the uploaded PDF file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPdf(dataBuffer) {
  if (!dataBuffer || dataBuffer.length === 0) {
    return '';
  }

  let extractedText = '';

  // 1. First attempt: Standard in-memory pdf-parse (near-instant for native text PDFs)
  try {
    const pdfData = await pdf(dataBuffer);
    const candidateText = (pdfData?.text || '').trim();
    if (candidateText && candidateText.length >= 30) {
      console.log(`[PDF-Extractor] Successfully parsed ${candidateText.length} characters using standard pdf-parse.`);
      return candidateText;
    }
    extractedText = candidateText;
  } catch (err) {
    console.warn('[PDF-Extractor] Standard pdf-parse failed:', err.message);
  }

  // 2. Second attempt: Gemini Multimodal PDF OCR / Document parser
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    console.log('[PDF-Extractor] PDF text was minimal or vector-rendered. Invoking Gemini Multimodal Document Extractor...');
    const base64Pdf = dataBuffer.toString('base64');

    for (const model of GEMINI_PDF_MODELS) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: base64Pdf,
                    },
                  },
                  {
                    text: 'Extract all readable text from this resume document faithfully, completely, and accurately into plain text format. Maintain all candidate contact information, section headers, bullet points, skills, metrics, and dates exactly as written. Do not summarize, rephrase, or invent any information.',
                  },
                ],
              },
            ],
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 35000,
          }
        );

        const geminiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (geminiText && geminiText.length >= 30) {
          console.log(`[PDF-Extractor] Gemini (${model}) extracted ${geminiText.length} characters successfully.`);
          return geminiText;
        }
      } catch (gemErr) {
        console.warn(`[PDF-Extractor] Gemini (${model}) extraction attempt failed:`, gemErr.response?.data?.error?.message || gemErr.message);
      }
    }
  }

  return extractedText || '';
}
