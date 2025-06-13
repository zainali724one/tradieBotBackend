const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    quoteAmount: {
      type: Number,
      required: true,
    },
    customerEmail: {
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
    paymentIntentId: {
      type: String,
    },
    isPaid: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);
