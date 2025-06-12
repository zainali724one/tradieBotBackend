// const { catchAsyncError } = require("../middlewares/catchAsyncError");
// const quote = require("../models/quote");
// const User = require("../models/User");
// const { ErrorHandler } = require("../utils/ErrorHandler");

// exports.addQuote = catchAsyncError(async (req, res, next) => {
//   const {
//     customerName,
//     jobDescription,
//     quoteAmount,
//     customerEmail,
//     telegramId,
//     userId,
//   } = req.body;

//   if (
//     !customerName ||
//     !jobDescription ||
//     !quoteAmount ||
//     !customerEmail ||
//     !telegramId ||
//     !userId
//   ) {
//     return next(new ErrorHandler("All fields are required", 400));
//   }

//   const user = await User.findOne({ telegramId });
//   if (!user) {
//     return next(new ErrorHandler("User not found for this telegramId", 404));
//   }

//   const newQuote = new quote({
//     customerName,
//     jobDescription,
//     quoteAmount,
//     customerEmail,
//     telegramId,
//     userId,
//   });

//   await newQuote.save();

//   res.status(201).json({
//     message: "Quote submitted successfully",
//     quote: newQuote,
//   });
// });

const { catchAsyncError } = require("../middlewares/catchAsyncError");
const quote = require("../models/quote");
const User = require("../models/User");
const { ErrorHandler } = require("../utils/ErrorHandler");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

exports.addQuote = catchAsyncError(async (req, res, next) => {
  const {
    customerName,
    jobDescription,
    quoteAmount,
    customerEmail,
    telegramId,
    userId,
  } = req.body;

  if (
    !customerName ||
    !jobDescription ||
    !quoteAmount ||
    !customerEmail ||
    !telegramId ||
    !userId
  ) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const user = await User.findOne({ telegramId });
  if (!user) {
    return next(new ErrorHandler("User not found for this telegramId", 404));
  }

  // 1. Generate HTML content for the PDF
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; }
          p { font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>Quote</h1>
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Job Description:</strong> ${jobDescription}</p>
        <p><strong>Quote Amount:</strong> £${quoteAmount}</p>
      </body>
    </html>
  `;

  const pdfPath = path.join(__dirname, "../temp/quote.pdf");

  // 2. Generate PDF using Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  await page.pdf({ path: pdfPath, format: "A4" });
  await browser.close();

  // 3. Send email with PDF attachment
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your app password
    },
  });

  await transporter.sendMail({
    from: `"UK Tradie Quotes" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: "Your Quote",
    text: "Attached is your quote.",
    attachments: [
      {
        filename: "quote.pdf",
        path: pdfPath,
      },
    ],
  });

  // Optional: delete PDF after sending
  fs.unlinkSync(pdfPath);

  // 4. Save quote in DB
  const newQuote = new quote({
    customerName,
    jobDescription,
    quoteAmount,
    customerEmail,
    telegramId,
    userId,
  });

  await newQuote.save();

  res.status(201).json({
    message: "Quote submitted and emailed successfully",
    quote: newQuote,
  });
});
