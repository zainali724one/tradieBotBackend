const express = require("express");
const {
  getProgress,
  resetProgress,
  checkAndResetIfDayMissed,
  claimPollens,
  // checkRewardClaimedToday,
  checkAndUpdateRewardStatus,
} = require("../controllers/rewardControllers");

const router = express.Router();

router.post("/claim", claimPollens);
router.get("/progress/:telegramId", getProgress);
router.post("/reset", resetProgress);
router.post("/check-and-reset", checkAndResetIfDayMissed);
router.get("/checkRewardClaimedToday/:telegramId", checkAndUpdateRewardStatus);

module.exports = router;
