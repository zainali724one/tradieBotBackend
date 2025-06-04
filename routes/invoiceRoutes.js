const express = require("express");
const { addInvoice, getChasesByTelegramId } = require("../controllers/invoiceController");


const router = express.Router();


router.post("/addInvoice", addInvoice);
router.get("/getChases", getChasesByTelegramId);


module.exports = router;
