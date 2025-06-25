const mongoose = require("mongoose");

const welcomeMessageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("welcomeMessage", welcomeMessageSchema);