const mongoose = require("mongoose");

exports.connectDb = async () => {
  try {
    await mongoose.connect(
      // "mongodb+srv://zleo:zain123@cluster0.yrhc29z.mongodb.net/"
      "mongodb+srv://kainatshakeel724:piYDhHj4fbc4UcfW@cluster0.gnyl3yr.mongodb.net/"
    );
    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1); // stop the server if DB fails
  }
};
