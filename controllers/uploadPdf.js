  const fs = require('fs');
const path = require('path');
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { uploadPdfToDrive } = require('../utils/googleDrive');


exports.uploadPdf = catchAsyncError(async(req, res) => {
  const file = req.file;
  const {telegramId,pdfType,customerEmail,customerName}=req.body
  if (!file) return res.status(400).send('No file uploaded');

   const userExists = await User.findOne({ telegramId });
    if (!userExists) {
      return next(new ErrorHandler("No user found with this Telegram ID", 404));
    }

const pdfPath = path.join(__dirname, `../${pdfType}`, `${pdfType}_${Date.now()}.pdf`);
fs.writeFileSync(pdfPath, req.file.buffer);


  await uploadPdfToDrive(
    {
      accessToken: userExists.googleAccessToken,
      refreshToken: userExists.googleRefreshToken,
    },
    pdfPath,
    `${pdfType}_${Date.now()}.pdf`,
    new Date().getFullYear(),
    new Date().toLocaleString("default", { month: "long" }),
    new Date().getDay(),
    customerName,
    pdfType==="invoice"?"Invoices":"Quotes"
  );


//   Send Email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: "UK Tradie Bot",
    to: customerEmail,
    subject: `Your ${pdfType==="invoice"?"Invoice":"Quote"} from UK Tradie`,
    text: `Please find your ${pdfType} attached.`,
    attachments: [
      {
        filename: `${pdfType}_${Date.now()}.pdf`,
        path: pdfPath,
      },
    ],
  });

  res.status(200).json({ message: 'PDF received', size: pdfBuffer.length });
} )