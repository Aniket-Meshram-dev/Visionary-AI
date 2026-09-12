import multer from "multer";

const storage = multer.diskStorage({});

// Strict file filter to block unauthorized/dangerous executable file types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(pdf|txt|md|markdown|csv|json|jpg|jpeg|png|webp|gif)$/i;
  const isExtensionValid = allowedExtensions.test(file.originalname);

  if (isExtensionValid) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only PDF documents, text files, and images are permitted."), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size limit
    files: 1, // Single file upload limit per request
  },
  fileFilter,
});