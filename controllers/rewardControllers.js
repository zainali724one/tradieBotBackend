const { catchAsyncError } = require("../middlewares/catchAsyncError");
const History = require("../models/History");
const User = require("../models/User");
const { hasDayPassed } = require("../utils/dateHelper");
const { ErrorHandler } = require("../utils/ErrorHandler");
const { getPercentage } = require("../utils/returnPercentage");

const rewards = [500, 550, 550, 600, 650, 650, 1000];

exports.claimPollens = catchAsyncError(async (req, res, next) => {
  const { telegramId } = req.body;
  if (!telegramId) return next(new ErrorHandler("User ID is required.", 400));

  let user = await User.findOne({ telegramId });
  if (!user) {
    return next(
      new ErrorHandler(
        "User not found. Please start the bot to claim pollens.",
        404
      )
    );
  }

  // Ensure 24 hours have passed before claiming again
  if (!hasDayPassed(user.lastClaimed)){
    return next(
      new ErrorHandler("You can only claim pollens once every 24 hours.", 400)
    );
  }

  const now = new Date();

  // Calculate today's reward
  const reward = rewards[(user.day - 1) % 7];

  // Check and update Queen status
  let becomeQueen = false;
  if (user.pollens < 100000 && user.pollens + reward >= 100000) {
    user.isQueen = true;
    becomeQueen = true;
  }

  // Add pollens and update user state
  user.pollens += reward;
  // user.day = (user.day % 7) + 1;
  user.lastClaimed = now;

  // Grant nectar on day 7
  if (user.day === 7) {
    user.nectar += 5;
    await new History({
      type: "nectar",
      reward: 5,
      userId: telegramId,
      refererId: "",
      message: "You gained NECTAR",
    }).save();
  }

  await user.save();

  // Handle referral rewards
  if (user.referredBy) {
    const refererUser = await User.findOne({ telegramId: user.referredBy });

    if (refererUser) {
      const refererReward = user.isPremium
        ? getPercentage(reward, 20)
        : getPercentage(reward, 10);

      // Check and update Queen status for referer
      if (
        refererUser.pollens < 100000 &&
        refererUser.pollens + refererReward >= 100000
      ) {
        refererUser.isQueen = true;
      }

      refererUser.pollens += refererReward;
      await refererUser.save();

      await new History({
        type: "pollens",
        reward: refererReward,
        userId: telegramId,
        refererId: user.referredBy,
        message: "did some actions on The Hive",
      }).save();
    }
  }

  res.status(200).json({
    message: `You have claimed ${reward} POLLEN!`,
    queenMessage: becomeQueen
      ? "Congratulations! You are now a Queen!"
      : user?.isQueen
      ? "You are a Queen!"
      : `${100000 - user.pollens} POLLEN untill you become a queen`,
    pollens: user.pollens,
    claimedPollens: reward,
    success: true,
  });
});

exports.getProgress = async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found.", success: false });
    }

    res.json({
      day: user.day,
      pollens: user.pollens,
      lastClaimed: user.lastClaimed,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching progress." });
  }
};

exports.resetProgress = async (req, res) => {
  const { telegramId } = req.body;

  try {
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.day = 1;
    user.pollens = rewards[0];
    user.lastClaimed = new Date();
    await user.save();

    res.json({ message: "Progress has been reset.", pollens: user.pollens });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while resetting progress." });
  }
};

exports.checkAndResetIfDayMissed = async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId)
    return res.status(400).json({ message: "User ID is required." });

  try {
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const now = new Date();

    if (
      hasDayPassed(user.lastClaimed) &&
      now - user.lastClaimed >= 2 * 86400000
    ) {
      user.day = 1;
      user.lastClaimed = null;
      await user.save();
      return res.json({
        message: "A day was missed. Progress has been reset to Day 1.",
      });
    }

    res.json({
      message: "No reset was required.",
      day: user.day,
      pollens: user.pollens,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while checking and resetting progress.",
    });
  }
};

exports.checkRewardClaimedToday = async (req, res) => {
  const { telegramId } = req.params;

  try {
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const now = new Date();
    const lastClaimed = new Date(user.lastClaimed);

    if (
      now.getDate() === lastClaimed.getDate() &&
      now.getMonth() === lastClaimed.getMonth() &&
      now.getFullYear() === lastClaimed.getFullYear()
    ) {
      return res.json({
        claimedToday: true,
        message: "You have already claimed today's reward.",
        day: user.day,
        pollens: user.pollens,
        lastClaimed: user.lastClaimed,
      });
    }

    res.json({
      claimedToday: false,
      message: "You have not claimed today's reward yet.",
      day: user.day,
      pollens: user.pollens,
      lastClaimed: user.lastClaimed,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while checking today's reward." });
  }
};

exports.checkAndUpdateDay = async (req, res) => {
  const { telegramId } = req.params;

  try {
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const now = new Date();
    const lastClaimed = new Date(user.lastClaimed);

    if (now.getDate() !== lastClaimed.getDate()) {
      // If user missed a day, reset to day 1
      if (now - lastClaimed >= 2 * 86400000) {
        user.day = 1;
        user.lastClaimed = null;
      } else {
        user.day = user.day === 7 ? 1 : (user.day % 7) + 1; // Move to the next day, reset if day 7
        // user.lastClaimed = now;
      }

      await user.save();
    }

    res.json({ message: "Day updated successfully.", day: user.day });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the day." });
  }
};

exports.checkAndUpdateRewardStatus = catchAsyncError(async (req, res) => {
  const { telegramId } = req.params;
  const user = await User.findOne({ telegramId });

  if (!user) {
    next(new ErrorHandler("User not found.", 404));
  }

  const now = new Date();
  const lastClaimed = new Date(user.lastClaimed);
  const dayUpdatedAt = new Date(user.dayUpdatedAt);
  let claimedToday = false;
  if (
    now.getDate() === lastClaimed.getDate() &&
    now.getMonth() === lastClaimed.getMonth() &&
    now.getFullYear() === lastClaimed.getFullYear()
  ) {
    claimedToday = true;
  } else {
    if (now - lastClaimed >= 2 * 86400000) {
      user.day = 1;
      user.dayUpdatedAt = null;
      user.lastClaimed = null;
    } else {
      if (
        now.getDate() != dayUpdatedAt.getDate() ||
        now.getMonth() != dayUpdatedAt.getMonth() ||
        now.getFullYear() != dayUpdatedAt.getFullYear()
      ) {
        user.day = user.day === 7 ? 1 : (user.day % 7) + 1;
        user.dayUpdatedAt = now;
      }
    }
    await user.save();
  }

  res.json({
    claimedToday,
    message: claimedToday
      ? "You have already claimed today's reward."
      : "You have not claimed today's reward yet.",
    day: user.day,
    pollens: user.pollens,
    lastClaimed: user.lastClaimed,
  });
});

// exports.checkAndUpdateRewardStatus = async (req, res) => {
//   const { telegramId } = req.params;

//   try {
//     const user = await User.findOne({ telegramId });

//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     const now = new Date();
//     const lastClaimed = new Date(user.lastClaimed);

//     // Normalize both dates to midnight (ignore time portion)
//     const todayMidnight = new Date(now).setHours(0, 0, 0, 0);
//     const lastClaimedMidnight = new Date(lastClaimed).setHours(0, 0, 0, 0);

//     let claimedToday = todayMidnight === lastClaimedMidnight;

//     // Only update if a new day has started
//     if (!claimedToday) {
//       if (todayMidnight - lastClaimedMidnight >= 2 * 86400000) {
//         user.day = 1; // Missed a day, reset to day 1
//       } else {
//         user.day = user.day === 7 ? 1 : user.day + 1; // Move to the next day, reset if day 7
//       }
//       user.lastClaimed = now;
//       await user.save();
//     }

//     res.json({
//       claimedToday,
//       message: claimedToday
//         ? "You have already claimed today's reward."
//         : "You have not claimed today's reward yet.",
//       day: user.day,
//       pollens: user.pollens,
//       lastClaimed: user.lastClaimed,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message:
//         "An error occurred while checking and updating the reward status.",
//     });
//   }
// };
