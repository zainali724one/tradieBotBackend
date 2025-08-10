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
const { Invoice } = require('xero-node');
// const { default: generatePDF } = require("../utils/pdfGenerator");
const { createXeroDocumentForUser } = require("../services/XerroService");
const generatePDF = require("../utils/pdfGenerator");

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
await sendWhatsApp(customerPhone, messageBody)

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
    "Invoices"
  );

  // const doc = new PDFDocument();


  // await new Promise((resolve, reject) => {
  //   const stream = fs.createWriteStream(pdfPath);
  //   doc.pipe(stream);

  //   doc.fontSize(18).text("Invoice Summary", { underline: true });
  //   doc.moveDown();
  //   doc.fontSize(12).text(`Customer Name: ${customerName}`);
  //   doc.text(`Job Description: ${jobDescription}`);
  //   doc.text(`Amount: $${invoiceAmount}`);
  //   doc.text(`Email: ${customerEmail}`);
  //   doc.moveDown();
  //   doc.end();

  //   stream.on("finish", resolve);
  //   stream.on("error", reject);
  // });
await generatePDF({
    userId,
    telegramId,
    customerName,
    jobDescription,
    amount:invoiceAmount,
    customerEmail,
    address,
    includeCost,
    includeReceipt,
    customerPhone,
    companyLogo:user?.companyLogo ||"",
    type:"invoice"
  }, userExists?.pdfTemplateId,"invoice",userExists)


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
            phoneNumber: customerPhone || "0000000000"
          }
        ]
      },
      lineItems: [
        {
          description: jobDescription || "Service Description",
          quantity: 1,
          unitAmount: parseFloat(invoiceAmount),
          accountCode: "200", // Double check this is valid in your Xero chart
          taxType: "NONE",
          lineAmount: parseFloat(invoiceAmount)
        }
      ],
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: Invoice.StatusEnum.AUTHORISED
    }
  ]
};





  if (sheetId != userExists.sheetId) {
    userExists.sheetId = sheetId;
    userExists.save();
  }
  await createXeroDocumentForUser(userId,invoicesPayload , "invoice")
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
    ammount:invoiceAmount,
    customerEmail,
    address,
    includeCost,
    includeReceipt,
    customerPhone,
    companyLogo:user?.companyLogo ||""
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
