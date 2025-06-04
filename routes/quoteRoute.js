const express = require("express");
const { addQuote } = require("../controllers/quoteController");


const router = express.Router();


router.post("/addQuote", addQuote);


module.exports = router;
