require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser"); // We still need this
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

// --- CHANGE 1: We need to import your actual handler function ---
// I am GUESSING the path here. You must update './controllers/stripeController'
// to the correct file path where your `stripeWebhookHandler` function is exported.
const { stripeWebhookHandler } = require("./controllers/stripeIntegration"); // <-- UPDATE THIS PATH

const app = express();
const PORT = process.env.PORT || 3000;

// ... (Your allowedOrigins array)
const allowedOrigins = [
  "https://tradie-bot.vercel.app",
  "http://localhost:5173",
  "https://tradiebot-admin-panel.netlify.app",
  "http://127.0.0.1:5501",
  "https://letsgomanga.com",
  "https://tradiebot.netlify.app",
  "https://admintradiebot.netlify.app"
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

// --- CHANGE 2: Define the Stripe Webhook route FIRST ---
// We use a special raw parser JUST for this one route.
// We assume the route is /api/stripe/webhook.
// **Your original `stripeRoutes.js` file must no longer contain this route.**
// --------------------------------------------------------------------------
app.post(
  "/api/stripe/webhook",
  bodyParser.raw({ type: "application/json" }), // <-- Use raw parser here
  stripeWebhookHandler // <-- Use your imported handler
);
// --------------------------------------------------------------------------

// --- CHANGE 3: Now use the JSON parser for ALL OTHER routes ---
// This middleware will apply to every route defined *below* it.
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
app.use(`/api/xero`, xeroRoutes);
app.use(`/api`, uploadPdfRoutes);
app.use(`/api`, uploadFileRoutes);
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

app.post("/status", (req, res) => {
  console.log(req.body);

  verifyJWT(req);

  console.log("Received status update");

  res.status(200).send();
});
app.get("/", (req, res) => res.send("Bot is running!"));
app.use(ErrorMiddleware);

// Health Check

// XERO_CLIENT_ID=51A32B19A81140C4AC8E625126EB961A
// XERO_CLIENT_SECRET=SeJ8LgxzBXzzJuIEDpo3JmYdL827vJCnYSWdC00OE2HAlQ0G

connectDb();
// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
