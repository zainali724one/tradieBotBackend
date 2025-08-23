const express = require("express");
const { addInvoice, getChasesByTelegramId, deleteChaseById } = require("../controllers/invoiceController");


const router = express.Router();


router.post("/addInvoice", addInvoice);
router.get("/getChases", getChasesByTelegramId);
router.delete("/chases/:id", deleteChaseById);


module.exports = router;
