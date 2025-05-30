const express = require("express");
const { getHistory } = require("../controllers/History");

const router = express.Router();

router.get("/getHistory/:telegramId", getHistory);

module.exports = router;
