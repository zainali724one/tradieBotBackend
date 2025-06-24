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
const stripeRoutes = require("./routes/stripeRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "https://peppy-swan-6fdd72.netlify.app",
  "http://localhost:5173",
  "https://tradiebot-admin-panel.netlify.app",
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
app.use(ErrorMiddleware);

// Health Check
app.get("/", (req, res) => res.send("Bot is running!"));
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
