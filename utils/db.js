// const mongoose = require("mongoose");

// exports.connectDb = async () => {
//   try {
//     await mongoose
//       .connect(
//         "mongodb+srv://kainatshakeel724:piYDhHj4fbc4UcfW@cluster0.gnyl3yr.mongodb.net/"
//       )
//       .then(() => {
//         console.log("db is conncted");
//       })
//       .catch((error) => console.log(error, "some error in inner catch"));
//   } catch (error) {
//     console.log(error, "some error in outer catch");
//     //  "mongodb+srv://zain114567:50I3VPy4fzcsA9t9@myprojects.ztxj7e9.mongodb.net/theHive?retryWrites=true&w=majority"
//   }
// };

const mongoose = require("mongoose");

exports.connectDb = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://zleo:zain123@cluster0.yrhc29z.mongodb.net/"
      // "mongodb+srv://kainatshakeel724:piYDhHj4fbc4UcfW@cluster0.gnyl3yr.mongodb.net/"
    );
    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1); // stop the server if DB fails
  }
};
