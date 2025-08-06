const express = require("express");
const { uploadPdf } = require("../controllers/uploadPdf");
const multer = require('multer');

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post('/uploadpdf', upload.single('file'), uploadPdf);



module.exports = router;


