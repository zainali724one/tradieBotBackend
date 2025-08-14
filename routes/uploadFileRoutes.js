const express = require("express");

const {downloadAndUpload} = require("../controllers/uploadFile")


const router = express.Router();


router.post("/downloadAndUpload", downloadAndUpload);

module.exports = router;
