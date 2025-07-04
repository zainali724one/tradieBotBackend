// const { bot } = require("../services/telegramService");
// const User = require("../models/User");
// const History = require("../models/History");

// exports.handleUpdate = async (req, res) => {
//   try {
//     await bot.processUpdate(req.body);
//     res.status(200).send("OK");
//   } catch (error) {
//     console.error("Error in botController:", error);
//     res.status(500).send("Error processing update");
//   }
// };

// // /start command handler
// bot.onText(/\/start(.*)/, async (msg, match) => {
//   console.log(msg.from.first_name);

//   const userId = msg.from.id.toString();
//   const userFirstName = msg.from.first_name || "User";
//   const userLastName = msg.from.last_name || "";
//   const userUsername = msg.from.username || "";
//   const userLanguageCode = msg.from.language_code || "en";
//   const isPremium = msg.from.is_premium || false;
//   const refCode = match[1]?.trim().startsWith("ref_")
//     ? match[1].trim().substring(4)
//     : null;

//   const welcomeMessage = `Hi, ${userFirstName}!👋\n\nWelcome to The hive!🥳\n\nHere you can earn pollens by mining them! Invite friends to earn more coins together, and level up faster!🚀`;

//   try {
//     let user = await User.findOne({ telegramId: userId });

//     if (!user) {
//       const userData = {
//         telegramId: userId,
//         firstName: userFirstName,
//         lastName: userLastName,
//         username: userUsername,
//         languageCode: userLanguageCode,
//         isPremium,
//         userImage: "",
//         referredBy: refCode || null,
//       };

//       if (refCode) {
//         const referrer = await User.findOne({ telegramId: refCode });
//         if (referrer) {
//           const refererUser = await User.findOne({ telegramId: refCode });

//           if (refererUser) {
//             const refererReward = isPremium ? 5000 : 500;

//             if (
//               refererUser.pollens < 100000 &&
//               refererUser.pollens + refererReward >= 100000
//             ) {
//               refererUser.isQueen = true;
//             }

//             refererUser.pollens += refererReward;
//             await refererUser.save();

//             const historyData = {
//               type: "pollens",
//               reward: refererReward,
//               userId: userId,
//               refererId: refCode,
//               message: "accepted your invite",
//             };

//             const history = new History(historyData);
//             await history.save();
//           }
//         } else {
//           userData.referredBy = null;
//         }
//       }
//       user = new User(userData);
//       await user.save();
//     }

//     await bot.sendMessage(msg.chat.id, welcomeMessage, {
//       reply_markup: {
//         inline_keyboard: [
//           [
//             {
//               text: "Open hive App",
//               web_app: { url: "https://radiant-rabanadas-d68427.netlify.app" },
//             },
//           ],
//         ],
//       },
//     });
//   } catch (error) {
//     console.error("Error processing /start command:", error);
//     await bot.sendMessage(msg.chat.id, "Error. Please try again!");
//   }
// });

const { bot } = require("../services/telegramService");
const User = require("../models/User");
const { connectDb } = require("../utils/db");
const History = require("../models/History");

connectDb(); // Ensure MongoDB is connected

// Handle Telegram webhook updates
exports.handleUpdate = async (req, res) => {
  try {
    await bot.handleUpdate(req.body); // Telegraf webhook handling
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error in botController:", error);
    res.status(500).send("Error processing update");
  }
};

// /start command handler
bot.start(async (ctx) => {
  const msg = ctx.message;
  console.log(msg.from.first_name);

  const userId = msg.from.id.toString();
  const userFirstName = msg.from.first_name || "User";
  // const userLastName = msg.from.last_name || "";
  // const userUsername = msg.from.username || "";
  // const userLanguageCode = msg.from.language_code || "en";
  // const isPremium = msg.from.is_premium || false;
  // const refCode = msg.text.split(" ")[1]?.startsWith("ref_")
  //   ? msg.text.split(" ")[1].substring(4)
  //   : null;

  const welcomeMessage = `Hi, ${userFirstName}!👋\n\nWelcome to Tradir Bot!🥳\n\nRun your business efficiently and effortlessly. Streamline operations, save time, and boost productivity with smart tools that keep everything organized and on track.🚀`;

  try {
    // let user = await User.findOne({ telegramId: userId });

    // if (!user) {
    //   const userData = {
    //     telegramId: userId,
    //     firstName: userFirstName,
    //     lastName: userLastName,
    //     username: userUsername,
    //     languageCode: userLanguageCode,
    //     isPremium,
    //     referredBy: refCode || null,
    //     pollens: 0,
    //   };

    //   if (refCode) {
    //     const refererUser = await User.findOne({ telegramId: refCode });
    //     if (refererUser) {
    //       const refererReward = isPremium ? 5000 : 500;
    //       if (
    //         refererUser.pollens < 100000 &&
    //         refererUser.pollens + refererReward >= 100000
    //       ) {
    //         refererUser.isQueen = true;
    //       }

    //       refererUser.pollens += refererReward;
    //       await refererUser.save();

    //       const historyData = {
    //         type: "pollens",
    //         reward: refererReward,
    //         userId: userId,
    //         refererId: refCode,
    //         message: "accepted your invite",
    //       };

    //       const history = new History(historyData);
    //       await history.save();
    //     } else {
    //       userData.referredBy = null;
    //     }
    //   }

    //   user = new User(userData);
    //   await user.save();
    // }

    await ctx.reply(welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Tradie Bot App",
              web_app: { url: "https://peppy-swan-6fdd72.netlify.app" },
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error("Error processing /start command:", error);
    await ctx.reply("Error. Please try again!");
  }
});
