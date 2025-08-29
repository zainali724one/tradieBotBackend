const { catchAsyncError } = require("../middlewares/catchAsyncError");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { ErrorHandler } = require("../utils/ErrorHandler");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { getAuthUrl, getTokensFromCode } = require("../services/googleAuth");

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
  const existingUsercheck2 = await User.findOne({ email });
  if (existingUser) {
    return next(
      new ErrorHandler("User with this Telegram ID already exists", 409)
    );
  }

  if (existingUsercheck2) {
    return next(new ErrorHandler("User with this Email already exists", 409));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const newUser = await User.create({
    telegramId,
    name,
    email,
    phone,
    country,
    username,
    password: hashedPassword,
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
    return next(new ErrorHandler("Incorrect password", 401));
  }

  // Check if the user's account is approved
  // if (user.isApproved !== "Complete") {
  //   return next(new ErrorHandler("Your account is not approved yet", 403));
  // }

  user.isLoggedIn = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: user,
    // You can also return a subset of user details if you prefer
    // user: {
    //   telegramId: user.telegramId,
    //   name: user.name,
    //   email: user.email,
    //   phone: user.phone,
    //   country: user.country,
    //   username: user.username,
    //   isPremium: user.isPremium,
    //   languageCode: user.languageCode,
    //   userImage: user.userImage,
    //   isLoggedIn: user.isLoggedIn,
    // },
  });
});

exports.getUser = catchAsyncError(async (req, res, next) => {
  const { telegramId } = req.params;
  const user = await User.findOne({ telegramId });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  // const rankedUsers = await User.find()
  //   .sort({ pollens: -1 })
  //   .select("telegramId pollens");

  // const rank = rankedUsers.findIndex((u) => u.telegramId === telegramId) + 1;

  res.status(200).json({
    user,
    // rank,
    // totalUsers: rankedUsers.length,
  });
});

exports.sendOTP = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new ErrorHandler("Email is required", 400));

  const user = await User.findOne({ email });
  if (!user)
    return next(new ErrorHandler("User not found with this email", 404));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // const expiry = new Date(Date.now() + 1 * 60 * 1000);
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
  // req.body.password=newPassword
  console.log("password updated");
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully 2",
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const {
    id,
    type,
    name,
    oldEmail,
    newEmail,
    newPhone,
    pdfTemplateId,
    companyLogo,
  } = req.body;

  if (!id) {
    return next(new ErrorHandler("User ID and type are required", 400));
  }
  if (!type) {
    return next(new ErrorHandler("Please specify which field to update", 400));
  }

  const user = await User.findOne({ telegramId: id });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  switch (type) {
    case "name":
      if (!name) return next(new ErrorHandler("Name is required", 400));
      user.name = name;
      break;

    case "email":
      if (!oldEmail || !newEmail) {
        return next(
          new ErrorHandler("Both old and new email are required", 400)
        );
      }
      if (user.email !== oldEmail) {
        return next(new ErrorHandler("Old email does not match", 400));
      }
      const existingEmailUser = await User.findOne({ email: newEmail });
      if (existingEmailUser) {
        return next(new ErrorHandler("New email is already in use", 400));
      }
      user.email = newEmail;
      break;

    case "phone":
      if (!newPhone) {
        return next(new ErrorHandler("phone number is required", 400));
      }
      user.phone = newPhone;

    case "template":
      if (!pdfTemplateId) {
        return next(new ErrorHandler("please select any template", 400));
      }
      user.pdfTemplateId = pdfTemplateId;
      break;

    case "logo":
      if (!companyLogo) {
        return next(new ErrorHandler("company logo is required", 400));
      }
      user.companyLogo = companyLogo;
      break;

    default:
      return next(new ErrorHandler("Invalid update type", 400));
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `${type} updated successfully`,
    data: user,
  });
});

exports.changePassword = catchAsyncError(async (req, res, next) => {
  const { telegramId, oldPassword, newPassword } = req.body;

  if (!telegramId) {
    return next(new ErrorHandler("Telegram Id is required", 400));
  }
  if (!oldPassword || !newPassword) {
    return next(
      new ErrorHandler("Old password and new password are required", 400)
    );
  }

  const user = await User.findOne({ telegramId });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

exports.deleteAccount = catchAsyncError(async (req, res, next) => {
  const { telegramId } = req.body;

  if (!telegramId) {
    return next(new ErrorHandler("Telegram ID is required", 400));
  }

  const user = await User.findOneAndDelete({ telegramId });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User account deleted successfully",
  });
});

exports.connectToGoogle = catchAsyncError(async (req, res) => {
  const authUrl = getAuthUrl(req.params.userId);
  res.redirect(authUrl);
});

// OAuth2 Callback
exports.googleOAuth2Callback = catchAsyncError(async (req, res) => {
  const { code, state: userId } = req.query;

  try {
    const tokens = await getTokensFromCode(code);

    await User.findByIdAndUpdate(userId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
    });

    res.send(
      "✅ Google connected successfully. You can now use Drive, Sheets, and Calendar."
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error connecting Google account.");
  }
});
