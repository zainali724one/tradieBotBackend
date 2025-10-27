const express = require("express");

const { getConsentUrl, handleXeroCallback } = require("../controllers/xeroAuth");

const router = express.Router();

router.post("/consentUrl", getConsentUrl);
router.get(
  "/callback",
  handleXeroCallback
);



module.exports = router;
