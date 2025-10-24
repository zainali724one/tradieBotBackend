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

  const welcomeMessage = `Hi, ${userFirstName}!👋\n\nWelcome to Tradie Bot!🥳\n\nRun your business efficiently and effortlessly. Streamline operations, save time, and boost productivity with smart tools that keep everything organized and on track.🚀`;

  try {
    await ctx.reply(welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Tradie Bot App",
              web_app: { url: "https://tradie-bot.vercel.app" },
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
