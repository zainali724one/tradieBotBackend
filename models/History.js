const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  type: { type: String },
  reward: { type: Number },
  userId: {
    type: String,
    ref: "User",
  },
  refererId: {
    type: String,
    ref: "User",
  },
  message: { type: String },
});

module.exports = mongoose.model("History", historySchema);
