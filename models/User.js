const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  country: { type: String },
  username: { type: String },
  password: { type: String },
  languageCode: { type: String },
  isPremium: { type: Boolean, default: false },
  isLoggedin: { type: Boolean, default: false },
  userImage: { type: String, default: null },
  resetOTP: { type: String },
  resetOTPExpires: { type: Date },
  stripeAccountId: { type: String },
  googleAccessToken: { type: String },
  googleRefreshToken: { type: String },
  xeroToken: { type: String },
  tenantId:{ type: String },
  xeroRefreshToken:{ type: String },
  sheetId: { type: String },
  pdfTemplateId: { type: String,default: "1" },
  isApproved: { type: String, default: "Pending" }, // New field added
}, { timestamps: true });

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password") || !this.password) return next();

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

module.exports = mongoose.model("User", userSchema);
