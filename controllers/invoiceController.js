const { catchAsyncError } = require("../middlewares/catchAsyncError");
const invoice = require("../models/invoice");
const quote = require("../models/quote");
const { ErrorHandler } = require("../utils/ErrorHandler");
const User = require("../models/User");
const { saveDataToSheets } = require("../utils/googleSheets");
const { uploadPdfToDrive } = require("../utils/googleDrive");
const path = require("path");
const PDFDocument = require("pdfkit");

const fs = require("fs");
// const sendWhatsAppMessage = require("../services/twillioService");
const { sendWhatsApp } = require("../services/VonageService");

// import { Invoice } from "xero-node";
const { Invoice } = require("xero-node");
// const { default: generatePDF } = require("../utils/pdfGenerator");
const { createXeroDocumentForUser } = require("../services/XerroService");
const generatePDF = require("../utils/pdfGenerator");
const mongoose = require("mongoose");

exports.addInvoice = catchAsyncError(async (req, res, next) => {
  const {
    userId,
    telegramId,
    customerName,
    jobDescription,
    invoiceAmount,
    address,
    customerEmail,
    includeCost,
    includeReceipt,
    customerPhone,
    sheetId,
  } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) {
    return next(new ErrorHandler("User not found for this telegramId", 404));
  }

  const isEmpty = (value) => !value || value.trim() === "";

  if (isEmpty(userId))
    return next(new ErrorHandler("User ID is required", 400));
  if (isEmpty(telegramId))
    return next(new ErrorHandler("Telegram ID is required", 400));
  if (isEmpty(customerName))
    return next(new ErrorHandler("Customer Name is required", 400));
  if (isEmpty(jobDescription))
    return next(new ErrorHandler("Job Description is required", 400));
  if (isEmpty(invoiceAmount))
    return next(new ErrorHandler("Invoice Amount is required", 400));
  if (isEmpty(customerEmail))
    return next(new ErrorHandler("Customer Email is required", 400));
  if (isEmpty(includeCost))
    return next(new ErrorHandler("Include Cost is required", 400));
  if (isEmpty(includeReceipt))
    return next(new ErrorHandler("Include Receipt is required", 400));

  const userExists = await User.findOne({ telegramId });
  if (!userExists) {
    return next(new ErrorHandler("No user found with this Telegram ID", 404));
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
    address,
    customerPhone,
  });

  await newInvoice.save();

  const tempDir = "/tmp";
  const pdfPath = path.join(tempDir, `quote_${newInvoice._id}.pdf`);

  const messageBody = `
You have recieved the invoice by tradie bot
Customer Name: ${customerName}
Job: ${jobDescription}
Amount: $${invoiceAmount}
Address: ${address}
Email: ${customerEmail}
`;
  // await sendWhatsApp(customerPhone, messageBody);

  // .then((res) => {
  //       console.log(res, "Whatsapp response");
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // sendWhatsAppMessage(customerPhone, messageBody)
  //   .then((res) => {
  //     console.log(res, "Whatsapp response");
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
  if (user?.googleAccessToken && user?.googleRefreshToken) {
    await saveDataToSheets(
      [
        customerName,
        jobDescription,
        invoiceAmount,
        address,
        customerEmail,
        telegramId,
        customerPhone,
        userId,
      ],
      [
        "Customer Name",
        "Job",
        "Amount",
        "Address",
        "Email",
        "Telegram ID",
        "Phone",
        "User ID",
      ],
      sheetId,
      userExists?.googleAccessToken,
      userExists?.googleRefreshToken,
      "Invoices",
      userId
    );
  }

  const invoicesPayload = {
    invoices: [
      {
        type: Invoice.TypeEnum.ACCREC,
        contact: {
          name: customerName,
          emailAddress: customerEmail,
          phones: [
            {
              phoneType: "DEFAULT",
              phoneNumber: customerPhone || "0000000000",
            },
          ],
        },
        lineItems: [
          {
            description: jobDescription || "Service Description",
            quantity: 1,
            unitAmount: parseFloat(invoiceAmount),
            accountCode: "200", // Double check this is valid in your Xero chart
            taxType: "NONE",
            lineAmount: parseFloat(invoiceAmount),
          },
        ],
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status: Invoice.StatusEnum.AUTHORISED,
      },
    ],
  };

  if (sheetId != userExists.sheetId) {
    userExists.sheetId = sheetId;
    userExists.save();
  }
  if (userExists.tenantId && userExists.xeroToken) {
    await createXeroDocumentForUser(userId, invoicesPayload, "invoice");
  }

  // Clean up file
  // fs.unlinkSync(pdfPath);

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    data: {
      userId,
      telegramId,
      customerName,
      jobDescription,
      amount: invoiceAmount,
      customerEmail,
      address,
      includeCost,
      includeReceipt,
      customerPhone,
      companyLogo: user?.companyLogo || "",
    },
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

exports.deleteChaseById = catchAsyncError(async (req, res, next) => {
  // accept id either as /:id or ?id=...
  const rawId = req.params.id || req.query.id;
  const { type } = req.query;
  const telegramId = req.query.telegramId; // optional safety scope

  const id = (rawId || "").trim();

  if (!id || !type) {
    return next(new ErrorHandler("id and type are required", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid id", 400));
  }

  // choose model by type
  let Model;
  if (type.toLowerCase() === "quote") {
    Model = quote;
  } else if (type.toLowerCase() === "invoice") {
    Model = invoice;
  } else {
    return next(
      new ErrorHandler("Invalid type. Must be 'quote' or 'invoice'", 400)
    );
  }

  // Build filter (optionally require telegramId if provided)
  const filter = telegramId ? { _id: id, telegramId } : { _id: id };

  // Try deleting from the intended collection first
  let deleted = await Model.findOneAndDelete(filter);

  // If nothing found, try the other collection in case the UI sent the wrong type
  if (!deleted) {
    try {
      const OtherModel = type.toLowerCase() === "quote" ? invoice : quote;
      const fallbackDeleted = await OtherModel.findOneAndDelete(
        telegramId ? { _id: id, telegramId } : { _id: id }
      );
      if (fallbackDeleted) {
        return res.status(200).json({
          success: true,
          message: `${
            type.toLowerCase() === "quote" ? "invoice" : "quote"
          } deleted successfully`,
          id: fallbackDeleted._id,
          note: "Type mismatch auto-corrected",
        });
      }
    } catch (e) {
      // ignore fallback errors; will return not found below
    }
  }

  if (!deleted) {
    return next(new ErrorHandler(`${type} not found`, 404));
  }

  return res.status(200).json({
    success: true,
    message: `${type} deleted successfully`,
    id: deleted._id,
  });
});
