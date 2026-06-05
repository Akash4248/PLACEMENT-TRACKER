const express = require("express");

const router = express.Router();

const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  uploadResume,
  getResume,
  verifyResume,
  rejectResume,
} = require("../controllers/studentController");
const upload = require("../middleware/uploadMiddleware");
const resumeUpload = require("../middleware/resumeUploadMiddleware");

const {
  protect,
} = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createStudent);

router.post(
  "/import",
  upload.single("file"),
  importStudents
);

router.post(
  "/:id/resume",
  resumeUpload.single("resume"),
  uploadResume
);

router.get("/:id/resume", getResume);

router.put("/:id/verify-resume", verifyResume);

router.put("/:id/reject-resume", rejectResume);

router.get("/", getStudents);

router.get("/:id", getStudent);

router.put("/:id", updateStudent);

router.delete("/:id", deleteStudent);

module.exports = router;
