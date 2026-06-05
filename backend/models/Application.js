const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    currentRound: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "In Process",
        "Selected",
        "Rejected",
        "Offer Received",
      ],
      default: "Applied",
    },

    rounds: [
      {
        roundId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InterviewRound",
        },

        attended: {
          type: Boolean,
          default: false,
        },

        result: {
          type: String,
          enum: ["PASS", "FAIL", "PENDING"],
          default: "PENDING",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

applicationSchema.index(
  {
    studentId: 1,
    companyId: 1,
  },
  {
    unique: true,
  }
);


module.exports = mongoose.model(
  "Application",
  applicationSchema
);