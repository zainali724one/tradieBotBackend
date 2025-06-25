const { catchAsyncError } = require("../middlewares/catchAsyncError");
const bcrypt = require("bcryptjs");
const { ErrorHandler } = require("../utils/ErrorHandler");
const Admin = require("../models/admin");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");
const welcomeMessage = require("../models/welcomeMessage");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // better: use env vars
    pass: process.env.EMAIL_PASS,
  },
});

// exports.adminLogin = catchAsyncError(async (req, res, next) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return next(new ErrorHandler("Email and password are required", 400));
//   }

//   const user = await Admin.findOne({ email });

//   if (!user) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   const isPasswordMatch = await bcrypt.compare(password, user.password);
//   if (!isPasswordMatch) {
//     return next(new ErrorHandler("Incorrect password", 401));
//   } else {
//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       data: user,
//     });
//   }

//   await user.save();
// });


exports.adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }

  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  // 3. Compare Passwords
  const isPasswordMatched = await bcrypt.compare(password, admin.password);

  if (!isPasswordMatched) {
    // Use a generic message for security
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '72h' }
  );

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  admin.password = undefined;

  // 7. Send Success Response
  res.status(200).json({
    success: true,
    message: "Admin login successful",
    token,
    admin,
  });
});

// exports.getAllUsers = catchAsyncError(async (req, res, next) => {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;

//   const filter = { isApproved: "Accepted" };

//   const totalUsers = await User.countDocuments(filter);
//   const users = await User.find(filter)
//     .sort({ createdAt: -1 })
//     .skip((page - 1) * pageSize)
//     .limit(pageSize);

//   res.status(200).json({
//     success: true,
//     page,
//     pageSize,
//     totalUsers,
//     totalPages: Math.ceil(totalUsers / pageSize),
//     users,
//   });
// });

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const searchTerm = req.query.searchTerm;

  let filter = { isApproved: "Accepted" };

  if (searchTerm) {
    const searchRegex = new RegExp(searchTerm, 'i');

    // Use $or to search across multiple fields
    filter.$or = [
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } },
      { username: { $regex: searchRegex } },
      { telegramId: { $regex: searchRegex } },
      { phone: { $regex: searchRegex } },
      { country: { $regex: searchRegex } },
      { isApproved: { $regex: searchRegex } },
    ];
  }

  const totalUsers = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    page,
    pageSize,
    totalUsers,
    totalPages: Math.ceil(totalUsers / pageSize),
    users,
  });
});

// exports.getAllUsers = catchAsyncError(async (req, res, next) => {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;

//   const totalUsers = await User.countDocuments();
//   const users = await User.find()
//     .sort({ createdAt: -1 })
//     .skip((page - 1) * pageSize)
//     .limit(pageSize);

//   res.status(200).json({
//     success: true,
//     page,
//     pageSize,
//     totalUsers,
//     totalPages: Math.ceil(totalUsers / pageSize),
//     users,
//   });
// });

exports.getAllUsersPending = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const searchTerm = req.query.searchTerm;

  let filter = { isApproved: "Pending" };

  if (searchTerm) {
    const searchRegex = new RegExp(searchTerm, 'i');

    filter.$or = [
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } },
      { username: { $regex: searchRegex } },
      { telegramId: { $regex: searchRegex } },
      { phone: { $regex: searchRegex } },
      { country: { $regex: searchRegex } },
    ];
  }

  const totalUsers = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    page,
    pageSize,
    totalUsers,
    totalPages: Math.ceil(totalUsers / pageSize),
    users,
  });
});


exports.getSingleUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return next(new ErrorHandler("User ID is required", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Please provide a valid user ID", 400));
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});



exports.getSingleUserPending = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return next(new ErrorHandler("User ID is required", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Please provide a valid user ID", 400));
  }

  const user = await User.findOne({ _id: id, isApproved: "Pending" });

  if (!user) {
    return next(new ErrorHandler("User not found or user is not approved", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});



exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return next(new ErrorHandler("User ID is required", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Please provide a valid user ID", 400));
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});


exports.deletePendingUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return next(new ErrorHandler("User ID is required", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Please provide a valid user ID", 400));
  }

  // Find and delete only the user with isApproved: "Pending"
  const user = await User.findOneAndDelete({ _id: id, isApproved: "Pending" });

  if (!user) {
    return next(new ErrorHandler("User not found or user is not approved", 404));
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

exports.addAdmin = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(
      new ErrorHandler("Name, Email, and Password are required", 400)
    );
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return next(new ErrorHandler("Admin already exists with this email", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = new Admin({
    name,
    email,
    password: hashedPassword,
  });

  await newAdmin.save();

  res.status(201).json({
    success: true,
    message: "Admin created successfully",
    admin: {
      id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
    },
  });
});


exports.updateAdmin = catchAsyncError(async (req, res, next) => {
  const id = req.params.id || req.query.id;

  if (!id) {
    return next(new ErrorHandler("Admin ID is required", 400));
  }

  const { name, email, password } = req.body;

  const existingAdmin = await Admin.findById(id).select('+password');
  if (!existingAdmin) {
    return next(new ErrorHandler(`Admin not found with ID: ${id}`, 404));
  }
  const updateFields = {};

  if (name) {
    updateFields.name = name;
  }

  if (email && email !== existingAdmin.email) {
    const emailExists = await Admin.findOne({ email, _id: { $ne: id } });
    if (emailExists) {
      return next(new ErrorHandler("Email already in use by another admin", 400));
    }
    updateFields.email = email;
  }

  if (password) {
    if (password.length < 8) {
      return next(new ErrorHandler("Password must be at least 8 characters", 400));
    }
    updateFields.password = await bcrypt.hash(password, 10);
  }

  // 3. Update if there are fields to update
  if (Object.keys(updateFields).length === 0) {
    return next(new ErrorHandler("No valid fields provided for update", 400));
  }

  const updatedAdmin = await Admin.findByIdAndUpdate(
    id,
    updateFields,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: "Admin updated successfully",
    admin: updatedAdmin,
  });
});

exports.updateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, isApproved, country, phone } = req.body;

  // 1. Validate input
  if (!name || !email || !isApproved || !country || !phone) {
    return next(new ErrorHandler("Name, email, isApproved, country, and phone are required.", 400));
  }

  // Optional: Validate the `isApproved` status if you have a predefined list
  const validStatuses = ["Pending", "Approved", "Rejected", "Accepted"];
  if (!validStatuses.includes(isApproved)) {
    return next(new ErrorHandler("Invalid status value provided for isApproved.", 400));
  }

  // 2. Find the user BEFORE updating to check their current status
  const existingUser = await User.findById(id);
  if (!existingUser) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // 3. Update the user
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { name, email, isApproved, country, phone },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return next(new ErrorHandler("User not found after update attempt.", 404));
  }

  // 4. Check if the status changed to "Approved" and send email
  if (existingUser.isApproved !== "Accepted" && updatedUser.isApproved === "Accepted") {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: updatedUser.email,
      subject: "Your Account Has Been Accepted!",
      html: `
                <p>Dear ${updatedUser.name || updatedUser.username || 'User'},</p>
                <p>Good news! Your account on TradieBot has been officially **Accepted**.</p>
                <p>You can now log in and access all features.</p>
                <p>Thank you for joining our community!</p>
                <br>
                <p>Best regards,</p>
                <p>The TradieBot Team</p>
            `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`Error sending approval email to ${updatedUser.email}:`, error);
    }
  }

  // 5. Send success response
  res.status(200).json({
    success: true,
    message: "User updated successfully.",
    user: updatedUser,
  });
});


exports.getWelcomeMessage = catchAsyncError(async (req, res, next) => {
  // 1. Fetch the welcome message from the database
  const welcomeMsg = await welcomeMessage.findOne({});
  if (!welcomeMsg) {
    return next(new ErrorHandler("Welcome message not found", 404));
  }

  // 2. Send success response
  res.status(200).json({
    success: true,
    message: "Welcome message fetched successfully!",
    data: welcomeMsg,
  });
});

exports.setOrUpdateWelcomeMessage = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;

  // 1. Validate input
  if (!message) {
    return next(new ErrorHandler("Message is required", 400));
  }
  const welcomeMsg = await welcomeMessage.findOneAndUpdate(
    {},
    { message: message },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );

  // 3. Send success response
  res.status(200).json({
    success: true,
    message: "Welcome message set/updated successfully!",
    data: welcomeMsg,
  });
});

exports.updateUserApprovalStatus = catchAsyncError(async (req, res, next) => {
  const { userId, status } = req.body;

  // 1. Validate input
  if (!userId || !status) {
    return next(new ErrorHandler("User ID and Status are required", 400));
  }

  const validStatuses = ["Pending", "Approved", "Rejected"];
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid status value provided", 400));
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isApproved: status },
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedUser) {
    return next(new ErrorHandler("User not found with the provided ID", 404));
  }

  // 4. Send success response
  res.status(200).json({
    success: true,
    message: `User approval status updated to '${status}' successfully!`,
    data: updatedUser,
  });
});

exports.getUserStats = catchAsyncError(async (req, res, next) => {
  // 1. Calculate Total Users
  const totalUsers = await User.countDocuments();

  // 2. Calculate Users Created This Week
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // Set date to 7 days in the past

  const usersThisWeek = await User.countDocuments({
    createdAt: { $gte: sevenDaysAgo } // Query for users created on or after 'sevenDaysAgo'
  });

  // 3. Calculate Total Pending Requests
  const totalPendingRequests = await User.countDocuments({
    isApproved: 'Pending' // Query for users with 'isApproved' status as 'Pending'
  });

  // 4. Send success response with the aggregated data
  res.status(200).json({
    success: true,
    message: 'User statistics fetched successfully!',
    data: {
      totalUsers,
      usersThisWeek,
      totalPendingRequests
    }
  });
});