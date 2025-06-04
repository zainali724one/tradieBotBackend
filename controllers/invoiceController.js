const { catchAsyncError } = require("../middlewares/catchAsyncError");
const invoice = require("../models/invoice");
const quote = require("../models/quote");
const { ErrorHandler } = require("../utils/ErrorHandler");
const User = require("../models/User");

exports.addInvoice = catchAsyncError(async (req, res, next) => {
  const {
    userId,
    telegramId,
    customerName,
    jobDescription,
    invoiceAmount,
    customerEmail,
    includeCost,
    includeReceipt,
  } = req.body;

  const isEmpty = (value) => !value || value.trim() === "";

  if (isEmpty(userId)) return next(new ErrorHandler("User ID is required", 400));
  if (isEmpty(telegramId)) return next(new ErrorHandler("Telegram ID is required", 400));
  if (isEmpty(customerName)) return next(new ErrorHandler("Customer Name is required", 400));
  if (isEmpty(jobDescription)) return next(new ErrorHandler("Job Description is required", 400));
  if (isEmpty(invoiceAmount)) return next(new ErrorHandler("Invoice Amount is required", 400));
  if (isEmpty(customerEmail)) return next(new ErrorHandler("Customer Email is required", 400));
  if (isEmpty(includeCost)) return next(new ErrorHandler("Include Cost is required", 400));
  if (isEmpty(includeReceipt)) return next(new ErrorHandler("Include Receipt is required", 400));

  const userExists = await User.findOne({ telegramId });
  if (!userExists) {
    return next(
      new ErrorHandler("No user found with this Telegram ID", 404)
    );
  }

  
  const newInvoice = new invoice({
    userId,
    telegramId,
    customerName,
    jobDescription,
    invoiceAmount,
    customerEmail,
    includeCost,
    includeReceipt,
  });

  await newInvoice.save();

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    invoice: newInvoice,
  });
});


exports.getChasesByTelegramId = catchAsyncError(async (req, res, next) => {
  const { telegramId, type } = req.query;

  if (!telegramId || !type) {
    return next(new ErrorHandler("telegramId and type are required", 400));
  }

  let data;
  if (type.toLowerCase() === "quote") {
    data = await quote.find({ telegramId }).sort({ createdAt: -1 });
  } else if (type.toLowerCase() === "invoice") {
    data = await invoice.find({ telegramId }).sort({ createdAt: -1 });
  } else {
    return next(
      new ErrorHandler("Invalid type. Must be 'quote' or 'invoice'", 400)
    );
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});
