
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { uploadPdfToDrive } = require("../utils/googleDrive");
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const { ErrorHandler } = require("../utils/ErrorHandler");
const { saveDataToSheets } = require("../utils/googleSheets");
const { decrypt } = require("../utils/crypto");
const { google } = require("googleapis");

exports.uploadPdf = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  const {
    telegramId,
    pdfType,
    customerEmail,
    customerName,
    _id,
    jobDescription,
    profit,
    materialCost,
    amount,
    customerPhone,
    paymentUrl,
  } = req.body;

  if (!file) {
    return next(new ErrorHandler("No file uploaded", 400));
  }

  const userExists = await User.findOne({ telegramId });
  if (!userExists) {
    return next(new ErrorHandler("No user found with this Telegram ID", 404));
  }

  let pdfPath;
  try {
    // Use /tmp directory in Lambda, or local directory otherwise
    const baseDir = "/tmp";
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
    if (userExists.googleAccessToken && userExists.googleRefreshToken){
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
        pdfType === "invoice" ? "Invoices" : pdfType === "receipt" ? "Receipts" : "Quotes"
      );
    }

    // Send Email
  //   if(pdfType != "receipt") {
  //   const transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: process.env.EMAIL_USER,
  //       pass: process.env.EMAIL_PASS,
  //     },
  //   });

  //   const quoteHtml = `
  //   <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
  //     <p>Dear Customer,</p>
  //     <p>Please find your ${pdfType} attached.</p>
  //     <p>Thank you for choosing us for your service.</p>
  //   </div>
  // `;

  //   const invoiceHtml = `
  //   <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
  //     <p>Dear Customer,</p>
  //     <p>Please find your ${pdfType} attached.</p>
  //     <p>Here is the link to pay via Stripe:</p>
  //     <p>
  //       <a href="${paymentUrl}" 
  //          style="display: inline-block; padding: 10px 20px; 
  //                 font-size: 16px; color: #fff; background-color: #28a745; 
  //                 text-decoration: none; border-radius: 5px;">
  //         Pay Now
  //       </a>
  //     </p>
  //   </div>
  // `;

  //   await transporter.sendMail({
  //     from: "UK Tradie Bot", // Better to include email in from
  //     to: customerEmail,
  //     subject: `Your ${
  //       pdfType === "invoice" ? "Invoice" : "Quote"
  //     } from UK Tradie`,
  //     html: pdfType === "invoice" ? invoiceHtml : quoteHtml,
  //     attachments: [
  //       {
  //         filename: fileName,
  //         path: pdfPath,
  //         contentType: "application/pdf",
  //       },
  //     ],
  //   });

  // }



  // You need to pass the 'user' object to this function now
if (pdfType !== "receipt") {
  
  let transporter;

  // 1. DYNAMIC TRANSPORTER CREATION
  // Check if the user is using Gmail (via OAuth) or a Custom SMTP provider
  if (userExists.emailProvider === 'gmail' || userExists.googleAccessToken) {
    
    // Option A: Gmail OAuth (Best for your current Google users)
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: userExists.googleRefreshToken,
      access_token: userExists.googleAccessToken // Optional if you want to rely on refresh
    });

    // Auto-refresh the token if needed
    const accessToken = await oauth2Client.getAccessToken();

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: userExists.email, // The user's Gmail address
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: userExists.googleRefreshToken,
        accessToken: accessToken.token, // The fresh token
      },
    });

  } else {
    // Option B: Custom SMTP (Outlook, Yahoo, Zoho, etc.)
    transporter = nodemailer.createTransport({
      host: userExists.smtpHost, // e.g., 'smtp.office365.com'
      port: userExists.smtpPort || 587,
      secure: userExists.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: userExists.smtpUser, // e.g., 'info@mybusiness.com'
        pass: decrypt(userExists.smtpPass), // The App Password
      },
    });
  }

  // 2. PREPARE HTML CONTENT
  const quoteHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
      <p>Dear Customer,</p>
      <p>Please find your ${pdfType} attached.</p>
      <p>Thank you for choosing <strong>${userExists.businessName || "us"}</strong> for your service.</p>
    </div>
  `;

  const invoiceHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
      <p>Dear Customer,</p>
      <p>Please find your ${pdfType} attached.</p>
      <p>Here is the link to pay via Stripe:</p>
      <p>
        <a href="${paymentUrl}" 
           style="display: inline-block; padding: 10px 20px; 
                  font-size: 16px; color: #fff; background-color: #28a745; 
                  text-decoration: none; border-radius: 5px;">
          Pay Now
        </a>
      </p>
      <p>Regards,<br>${userExists.businessName || userExists.name}</p>
    </div>
  `;

  // 3. SEND MAIL WITH DYNAMIC "FROM"
  // Format: "Business Name" <email@address.com>
  const senderIdentity = `"${userExists.businessName || userExists.name}" <${userExists.email || userExists.smtpUser}>`;

  await transporter.sendMail({
    from: senderIdentity, 
    to: customerEmail,
    subject: `Your ${
      pdfType === "invoice" ? "Invoice" : "Quote"
    } from ${userExists.businessName || "UK Tradie"}`,
    html: pdfType === "invoice" ? invoiceHtml : quoteHtml,
    attachments: [
      {
        filename: fileName,
        path: pdfPath,
        contentType: "application/pdf",
      },
    ],
  });

  console.log(`✅ Email sent from ${senderIdentity}`);
}

  if (pdfType === "receipt" && userExists.googleAccessToken && userExists.googleRefreshToken && userExists.sheetId) {
      await saveDataToSheets(
          [
            _id,
            customerName,
            jobDescription,

            customerEmail,
            customerPhone,
                        amount,
            materialCost,
            profit
          ],
          [
            "Receipt ID",
            "Customer Name",
            "Job",
            "Email",
            "Phone",
            "Amount",
            "Material Cost",
            "Profit"
          ],
          userExists?.sheetId,
          userExists?.googleAccessToken,
          userExists?.googleRefreshToken,
          "Receipts",
          userExists?._id.toString()
        );
  }
    res.status(200).json({
      success: true,
      message: "PDF processed successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error processing PDF: ${error.message}`, 500)
    );
  } finally {
    // Clean up: Delete the temporary file if it exists
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        fs.unlinkSync(pdfPath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }
    }
  }
});
