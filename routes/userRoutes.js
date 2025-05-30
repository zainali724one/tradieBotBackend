const express = require("express");
const {
  userAuthenticator,
  handleSocialFollowing,
  getUser,
  signupUser,
  loginUser,
  sendOTP,
  verifyOTP,
} = require("../controllers/userController");

const router = express.Router();

router.post("/userAuthenticator", userAuthenticator);

router.post("/signup", signupUser);
router.post("/signin", loginUser);
router.post("/sendOTP", sendOTP);
router.post("/verifyOTP", verifyOTP);
router.post("/handleSocialFollowing", handleSocialFollowing);
router.get("/getUser/:telegramId", getUser);

module.exports = router;
