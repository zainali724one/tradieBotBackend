const express = require("express");
const { addInvoice, getChasesByTelegramId, deleteChaseById } = require("../controllers/invoiceController");
const upload = require("../middlewares/uploadConfig");

const router = express.Router();


router.post("/addInvoice",upload.array("materialInvoices", 10),addInvoice);
router.get("/getChases", getChasesByTelegramId);
router.delete("/chases/:id", deleteChaseById);


module.exports = router;
