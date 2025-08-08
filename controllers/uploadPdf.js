//   const fs = require('fs');
// const path = require('path');
// const User = require("../models/User");
// const nodemailer = require("nodemailer");
// const { uploadPdfToDrive } = require('../utils/googleDrive');
// const { catchAsyncError } = require('../middlewares/catchAsyncError');


// exports.uploadPdf = catchAsyncError(async(req, res) => {
//   const file = req.file;
//   const {telegramId,pdfType,customerEmail,customerName}=req.body
//   if (!file) return res.status(400).send('No file uploaded');

//    const userExists = await User.findOne({ telegramId });
//     if (!userExists) {
//       return next(new ErrorHandler("No user found with this Telegram ID", 404));
//     }

// const dirPath = path.join(__dirname, `../${pdfType}`);
// if (!fs.existsSync(dirPath)) {
//   fs.mkdirSync(dirPath, { recursive: true });
// }

// const pdfPath = path.join(__dirname, `../${pdfType}`, `${pdfType}_${Date.now()}.pdf`);
// fs.writeFileSync(pdfPath, req.file.buffer);


//   await uploadPdfToDrive(
//     {
//       accessToken: userExists.googleAccessToken,
//       refreshToken: userExists.googleRefreshToken,
//     },
//     pdfPath,
//     `${pdfType}_${Date.now()}.pdf`,
//     new Date().getFullYear(),
//     new Date().toLocaleString("default", { month: "long" }),
//     new Date().getDay(),
//     customerName,
//     pdfType==="invoice"?"Invoices":"Quotes"
//   );


// //   Send Email
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER, 
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: "UK Tradie Bot",
//     to: customerEmail,
//     subject: `Your ${pdfType==="invoice"?"Invoice":"Quote"} from UK Tradie`,
//     text: `Please find your ${pdfType} attached.`,
//     attachments: [
//       {
//         filename: `${pdfType}_${Date.now()}.pdf`,
//         path: pdfPath,
//       },
//     ],
//   });

//   fs.unlinkSync(pdfPath);

//   res.status(200).json({ message: 'PDF received', size: pdfBuffer.length });
// } )




const fs = require('fs');
const path = require('path');
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { uploadPdfToDrive } = require('../utils/googleDrive');
const { catchAsyncError } = require('../middlewares/catchAsyncError');
const { ErrorHandler } = require('../utils/ErrorHandler');
// const ErrorHandler = require('../utils/errorHandler');

exports.uploadPdf = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  const { telegramId, pdfType, customerEmail, customerName,amount,customerPhone,paymentUrl } = req.body;
  
  if (!file) {
    return next(new ErrorHandler('No file uploaded', 400));
  }

  const userExists = await User.findOne({ telegramId });
  if (!userExists) {
    return next(new ErrorHandler("No user found with this Telegram ID", 404));
  }

  let pdfPath;
  try {
    // Use /tmp directory in Lambda, or local directory otherwise
    const baseDir =  '/tmp' 
    const dirPath = path.join(baseDir, pdfType);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const fileName = `${pdfType}_${Date.now()}.pdf`;
    pdfPath = path.join(dirPath, fileName);

    // Write file
    fs.writeFileSync(pdfPath, file.buffer);

    // Upload to Google Drive
    await uploadPdfToDrive(
      {
        accessToken: userExists.googleAccessToken,
        refreshToken: userExists.googleRefreshToken,
      },
      pdfPath,
      fileName,
      new Date().getFullYear(),
      new Date().toLocaleString("default", { month: "long" }),
      new Date().getDate(),
      customerName,
      pdfType === "invoice" ? "Invoices" : "Quotes"
    );

    // Send Email
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
      subject: `Your ${pdfType === "invoice" ? "Invoice" : "Quote"} from UK Tradie`,
      text: `Please find your ${pdfType} attached.
Customer Name: ${customerName}
Amount: $${amount}
Email: ${customerEmail}
${pdfType === "invoice" ? "":`Click here to pay: ${paymentLink}`}`,
      attachments: [
        {
          filename: fileName,
          path: pdfPath,
          contentType: 'application/pdf'
        },
      ],
    });

    res.status(200).json({ 
      success: true,
      message: 'PDF processed successfully' 
    });

  } catch (error) {
    return next(new ErrorHandler(`Error processing PDF: ${error.message}`, 500));
  } finally {
    // Clean up: Delete the temporary file if it exists
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        fs.unlinkSync(pdfPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
  }
});