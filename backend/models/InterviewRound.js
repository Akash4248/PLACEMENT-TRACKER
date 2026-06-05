const mongoose = require("mongoose");

const interviewRoundSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    roundName: {
      type: String,
      required: true,
    },

    roundType: {
      type: String,
      enum: [
        "Aptitude",
        "Coding",
        "Technical",
        "Group Discussion",
        "HR",
        "Other",
      ],
      default: "Other",
    },

    sequence: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InterviewRound",
  interviewRoundSchema
);