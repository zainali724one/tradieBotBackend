const express = require("express");
const { handleUpdate } = require("../controllers/botController");

const router = express.Router();

// Webhook Route for Telegram Bot
router.post("/", handleUpdate);

module.exports = router;
