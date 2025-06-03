const { catchAsyncError } = require("../middlewares/catchAsyncError");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { ErrorHandler } = require("../utils/ErrorHandler");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

exports.userAuthenticator = catchAsyncError(async (req, res, next) => {
  const { telegramId, firstName, lastName, username, languageCode, isPremium } =
    req.body;

  const userTelegramData = {
    telegramId,
    firstName,
    lastName,
    username,
    languageCode,
    isPremium,
  };

  if (!userTelegramData?.telegramId) {
    next(new ErrorHandler("Invalid user data", 400));
  }
  let user = await User.findOne({ telegramId: userTelegramData?.telegramId });

  if (!user) {
    const userData = {
      telegramId: userTelegramData?.telegramId,
      firstName: userTelegramData?.firstName,
      lastName: userTelegramData?.lastName,
      username: userTelegramData?.username,
      languageCode: userTelegramData?.languageCode,
      isPremium: userTelegramData?.isPremium,
      userImage: "",
      referredBy: userTelegramData?.refCode || null,
    };

    if (userTelegramData?.refCode?.refCode) {
      const referrer = await User.findOne({
        telegramId: userTelegramData?.refCode,
      });
    }

    console.log(userData);
    user = new User(userData);
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  }
});

exports.signupUser = catchAsyncError(async (req, res, next) => {
  const {
    telegramId,
    name,
    email,
    phone,
    country,
    username,
    password,
    languageCode,
    userImage,
  } = req.body;

  // Validate required fields
  if (!telegramId || !name || !email || !phone || !country) {
    return next(new ErrorHandler("All required fields must be provided", 400));
  }

  // Check for existing user
  const existingUser = await User.findOne({ telegramId });
  if (existingUser) {
    return next(
      new ErrorHandler("User with this Telegram ID already exists", 409)
    );
  }

  // Create new user
  const newUser = await User.create({
    telegramId,
    name,
    email,
    phone,
    country,
    username,
    password,
    languageCode,
    userImage,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: newUser,
  });
});

exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    // return next(new ErrorHandler("Incorrect password", 401));
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        telegramId: user.telegramId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        username: user.username,
        isPremium: user.isPremium,
        languageCode: user.languageCode,
        userImage: user.userImage,
        isLoggedIn: user.isLoggedIn,
      },
    });
  } else {
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        telegramId: user.telegramId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        username: user.username,
        isPremium: user.isPremium,
        languageCode: user.languageCode,
        userImage: user.userImage,
        isLoggedIn: user.isLoggedIn,
      },
    });
  }

  user.isLoggedIn = true;
  await user.save();
});

exports.getUser = catchAsyncError(async (req, res, next) => {
  const { telegramId } = req.params;
  const user = await User.findOne({ telegramId });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const rankedUsers = await User.find()
    .sort({ pollens: -1 })
    .select("telegramId pollens");

  const rank = rankedUsers.findIndex((u) => u.telegramId === telegramId) + 1;

  res.status(200).json({
    user,
    rank,
    totalUsers: rankedUsers.length,
  });
});

exports.sendOTP = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new ErrorHandler("Email is required", 400));

  const user = await User.findOne({ email });
  if (!user)
    return next(new ErrorHandler("User not found with this email", 404));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 1 * 60 * 1000);

  user.resetOTP = otp;
  user.resetOTPExpires = expiry;
  await user.save();

  await sendEmail({
    to: email,
    subject: "Your OTP for Password Reset",
    html: `<p>Your OTP is: <b>${otp}</b>. It expires in 10 minutes.</p>`,
  });

  res.status(200).json({
    success: true,
    message: "OTP sent to email",
  });
});

exports.verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return next(new ErrorHandler("Email and OTP are required", 400));

  const user = await User.findOne({ email, resetOTP: otp });

  if (!user || !user.resetOTPExpires || user.resetOTPExpires < Date.now()) {
    return next(new ErrorHandler("Invalid or expired OTP", 400));
  }

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return next(
      new ErrorHandler("Email, OTP, and new password are required", 400)
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("Invalid or expired OTP", 400));
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetOTP = undefined;
  user.resetOTPExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});
