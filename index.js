require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { bot } = require("./services/telegramService");
const botRoutes = require("./routes/botRoutes");
const { ErrorMiddleware } = require("./middlewares/errorMiddleware");
const { connectDb } = require("./utils/db");
const cors = require("cors");
const rewardsRoutes = require("./routes/rewardRoutes");
const userRoutes = require("./routes/userRoutes");
const historyRoutes = require("./routes/historyRoutes");
const quoteRoute = require("./routes/quoteRoute");
const invoiceRoutes = require("./routes/invoiceRoutes");
const jobRoutes = require("./routes/jobRoutes");
const xeroRoutes = require("./routes/xeroRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadPdfRoutes = require("./routes/uploadPdfRoutes");
const uploadFileRoutes = require("./routes/uploadFileRoutes");
const { sendWhatsApp } = require("./services/VonageService");
const { verifyJWT } = require("./controllers/VonageWebhooks");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "https://peppy-swan-6fdd72.netlify.app",
  "http://localhost:5173",
  "https://tradiebot-admin-panel.netlify.app",
  "https://uktradie.netlify.app",
  "http://127.0.0.1:5501",
  "https://letsgomanga.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

// Middleware
app.use(bodyParser.json());

// Routes
// app.use(`/bot${process.env.BOT_TOKEN}`, botRoutes);
app.use(`/api/webhook`, botRoutes);
app.use(`/api/rewards`, rewardsRoutes);
app.use(`/api/user`, userRoutes);
app.use(`/api/history`, historyRoutes);
app.use(`/api/quote`, quoteRoute);
app.use(`/api/invoice`, invoiceRoutes);
app.use(`/api/job`, jobRoutes);
app.use(`/api/stripe`, stripeRoutes);
app.use(`/api/admin`, adminRoutes);
app.use(`/api`, xeroRoutes);
app.use(`/api`, uploadPdfRoutes)
app.use(`/api`, uploadFileRoutes);
// CLIENT_ID=832861452898-icpkrq7gi151jhb4h1ktqo26jqq214ql.apps.googleusercontent.com  testing only
// CLIENT_SECRET=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
app.post("/inbound", async (req, res) => {

const { from: requesterNumber } = req.body;

console.log(`Received message from ${requesterNumber}`);

try {

// Send the "Message received" reply

await sendWhatsApp(requesterNumber);

res.status(200).send(); // Acknowledge the received message

} catch (error) {

console.error("Error handling incoming message:", error);

res.status(500).send("An error occurred while processing the message.");

}

});

app.post('/status', (req, res) => {

  console.log(req.body);

  verifyJWT(req);

  console.log('Received status update');

  res.status(200).send();

})
app.get("/", (req, res) => res.send("Bot is running!"));
app.use(ErrorMiddleware);

// Health Check

connectDb();
// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const { bot } = require("./services/telegramService");
// const botRoutes = require("./routes/botRoutes");
// const { ErrorMiddleware } = require("./middlewares/errorMiddleware");
// const { connectDb } = require("./utils/db");
// const cors = require("cors");
// const rewardsRoutes = require("./routes/rewardRoutes");
// const userRoutes = require("./routes/userRoutes");
// const historyRoutes = require("./routes/historyRoutes");
// const quoteRoute = require("./routes/quoteRoute");
// const invoiceRoutes = require("./routes/invoiceRoutes");
// const jobRoutes = require("./routes/jobRoutes");
// const adminRoutes = require("./routes/adminRoutes");

// const app = express();
// const PORT = process.env.PORT || 3000;

// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://radiant-rabanadas-d68427.netlify.app",
//   "https://radiant-raanadas-d68427.netlify.app",
//   "https://peppy-swan-6fbdd72.netlify.app",
//   "https://tradiebot-admin-panel.netlify.app",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       } else {
//         return callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.options("*", cors());

// // Middleware
// app.use(bodyParser.json());

// // Routes
// // app.use(`/bot${process.env.BOT_TOKEN}`, botRoutes);
// app.use(`/api/webhook`, botRoutes);
// app.use(`/api/rewards`, rewardsRoutes);
// app.use(`/api/user`, userRoutes);
// app.use(`/api/history`, historyRoutes);
// app.use(`/api/quote`, quoteRoute);
// app.use(`/api/invoice`, invoiceRoutes);
// app.use(`/api/job`, jobRoutes);
// app.use(`/api/admin`, adminRoutes);
// app.use(ErrorMiddleware);

// // Health Check
// app.get("/", (req, res) => res.send("Bot is running!!!"));
// connectDb();
// // Start Server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
