const express = require("express");

const router = express.Router();

const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  importStudents,
} = require("../controllers/studentController");
const upload = require("../middleware/uploadMiddleware");

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

router.get("/", getStudents);

router.get("/:id", getStudent);

router.put("/:id", updateStudent);

router.delete("/:id", deleteStudent);

module.exports = router;
