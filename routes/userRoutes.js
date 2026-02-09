const express = require("express");
const {
  userAuthenticator,
  handleSocialFollowing,
  getUser,
  signupUser,
  loginUser,
  sendOTP,
  verifyOTP,
  updatePassword,
  updateProfile,
  changePassword,
  deleteAccount,
  connectToGoogle,
  googleOAuth2Callback,
  emailSettings,
} = require("../controllers/userController");

const router = express.Router();

router.post("/userAuthenticator", userAuthenticator);

router.post("/signup", signupUser);
router.post("/signin", loginUser);
router.post("/sendOTP", sendOTP);
router.post("/verifyOTP", verifyOTP);
router.post("/updatePassword", updatePassword);
router.put("/updateProfile", updateProfile);
router.put("/emailSettings", emailSettings);
router.put("/changePassword", changePassword);
router.delete("/deleteAccount", deleteAccount);
router.get("/getUser/:telegramId", getUser);
router.get("/connect/:userId", connectToGoogle); // /api/user/connect/:userId
router.get("/google/oauth2callback", googleOAuth2Callback); // /api/user/google/oauth2callback

module.exports = router;
