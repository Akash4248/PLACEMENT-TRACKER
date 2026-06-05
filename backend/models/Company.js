const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    package: {
      type: Number,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    eligibilityCGPA: {
      type: Number,
      default: 0,
    },

    minimumCGPA: {
      type: Number,
      default: 0,
    },

    allowedDepartments: [
      {
        type: String,
        trim: true,
      },
    ],

    driveDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed"],
      default: "Upcoming",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Company",
  companySchema
);
