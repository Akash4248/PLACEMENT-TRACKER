const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    usn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
    },

    department: {
      type: String,
      required: true,
    },

    cgpa: {
      type: Number,
      required: true,
    },

    graduationYear: {
      type: Number,
    },

    skills: [String],

    resumeUrl: {
      type: String,
    },

    resumePublicId: {
      type: String,
    },

    resumeFileName: {
      type: String,
    },

    resumeUploadedAt: {
      type: Date,
    },

    resumeStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Student",
  studentSchema
);
