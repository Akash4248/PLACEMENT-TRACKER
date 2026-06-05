const fs = require("fs");
const path = require("path");
const multer = require("multer");

const resumeDir = path.join(__dirname, "..", "uploads", "resumes");

if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumeDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${req.params.id}-${Date.now()}-${safeName}`);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const resumeUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const validExtension = /\.(pdf|doc|docx)$/i.test(file.originalname);

    if (allowedMimeTypes.includes(file.mimetype) || validExtension) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF, DOC, and DOCX resumes are supported"));
  },
});

module.exports = resumeUpload;
