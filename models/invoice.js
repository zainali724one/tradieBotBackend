const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    telegramId: {
      type: String,
      required: true,
    },
      address: { type: String },
    customerName: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    invoiceAmount: {
      type: Number,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    includeCost: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },
    includeReceipt: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
