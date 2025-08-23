const express = require("express");
const { getHistory, deleteHistory } = require("../controllers/History");

const router = express.Router();

router.get("/getHistory/:telegramId", getHistory);
router.delete("/:id", deleteHistory);


module.exports = router;
