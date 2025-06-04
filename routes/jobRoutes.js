const express = require("express");
const { addJob, getHistory } = require("../controllers/jobController");

const router = express.Router();

router.post("/addJob", addJob);
router.get("/getHistory", getHistory);

module.exports = router;
