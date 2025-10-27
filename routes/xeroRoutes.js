const express = require("express");

const { getConsentUrl, handleXeroCallback } = require("../controllers/xeroAuth");

const router = express.Router();

router.get("/xero/consetUrl", getConsentUrl);
router.get(
  "/xero/callback",
  handleXeroCallback
);



module.exports = router;
