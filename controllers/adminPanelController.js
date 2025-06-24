const { catchAsyncError } = require("../middlewares/catchAsyncError");
const bcrypt = require("bcryptjs");
const { ErrorHandler } = require("../utils/ErrorHandler");
const Admin = require("../models/admin");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");

exports.adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }

  const user = await Admin.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Incorrect password", 401));
  } else {
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
    });
  }

  await user.save();
});

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const filter = { isApproved: "Accepted" };

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

  const totalUsers = await User.countDocuments({ isApproved: "Pending" });
  const users = await User.find({ isApproved: "Pending" })
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




exports.updateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params; // ✅ Correct now
  const { name, email, isApproved, country, phone } = req.body;

  if (!name || !email || !isApproved || !country || !phone) {
    return res.status(400).json({
      success: false,
      message: "name, email, isApproved, country, and phone are required.",
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { name, email, isApproved, country, phone },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully.",
    user: updatedUser,
  });
});



// exports.updateUser = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   const { name, email, isApproved, country, phone } = req.body;

//   // Validate required fields (optional: remove this if all fields are optional)
//   if (!name || !email || !isApproved || !country || !phone) {
//     return res.status(400).json({
//       success: false,
//       message: "name, email, isApproved, country, and phone are required.",
//     });
//   }

//   const updatedUser = await User.findByIdAndUpdate(
//     id,
//     { name, email, isApproved, country, phone },
//     { new: true, runValidators: true }
//   );

//   if (!updatedUser) {
//     return res.status(404).json({
//       success: false,
//       message: "User not found.",
//     });
//   }

//   res.status(200).json({
//     success: true,
//     message: "User updated successfully.",
//     user: updatedUser,
//   });
// });



