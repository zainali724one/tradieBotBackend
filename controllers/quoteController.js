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

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const quote = require("../models/quote");
const User = require("../models/User");
const { ErrorHandler } = require("../utils/ErrorHandler");

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

  const newQuote = new quote({
    customerName,
    jobDescription,
    quoteAmount,
    customerEmail,
    telegramId,
    userId,
  });

  await newQuote.save();

  // Ensure temp directory exists
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const pdfPath = path.join(tempDir, `quote_${newQuote._id}.pdf`);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(pdfPath));

  doc.fontSize(18).text("Quote Summary", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Customer Name: ${customerName}`);
  doc.text(`Job Description: ${jobDescription}`);
  doc.text(`Quote Amount: $${quoteAmount}`);
  doc.text(`Email: ${customerEmail}`);
  doc.end();

  // Email the PDF
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Replace with env var
      pass: process.env.EMAIL_PASS, // Replace with env var
    },
  });

  // Wait for PDF to finish writing before emailing
  await new Promise((resolve, reject) => {
    doc.on("finish", async () => {
      try {
        await transporter.sendMail({
          from: '"UK Tradie Bot" <your-email@gmail.com>',
          to: customerEmail,
          subject: "Your Quote from UK Tradie",
          text: "Please find your quote attached.",
          attachments: [
            {
              filename: `Quote_${newQuote._id}.pdf`,
              path: pdfPath,
            },
          ],
        });

        // Clean up temp PDF file
        fs.unlinkSync(pdfPath);

        res.status(201).json({
          message: "Quote submitted and emailed successfully",
          quote: newQuote,
        });

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
});
