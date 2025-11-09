const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "scheduled",
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    telegramId: {
      type: String,
      required: true,
      ref: "User",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
