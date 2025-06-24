const { catchAsyncError } = require("../middlewares/catchAsyncError");
const invoice = require("../models/invoice");
const quote = require("../models/quote");
const { ErrorHandler } = require("../utils/ErrorHandler");
const User = require("../models/User");
const { saveDataToSheets } = require("../utils/googleSheets");
const { uploadPdfToDrive } = require("../utils/googleDrive");

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
    customerPhone,
    sheetId,
  } = req.body;

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
Email: ${customerEmail}
`;
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
      customerEmail,
      telegramId,
      customerPhone,
      userId,
    ],
    [
      "Customer Name",
      "Job",
      "Amount",
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

  const doc = new PDFDocument();

  // Await PDF generation
  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(18).text("Invoice Summary", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Customer Name: ${customerName}`);
    doc.text(`Job Description: ${jobDescription}`);
    doc.text(`Amount: $${invoiceAmount}`);
    doc.text(`Email: ${customerEmail}`);
    doc.moveDown();
    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  await uploadPdfToDrive(
    {
      accessToken: userExists.googleAccessToken,
      refreshToken: userExists.googleRefreshToken,
    },
    pdfPath,
    `Invoice_${newInvoice._id}.pdf`,
    new Date().getFullYear(),
    new Date().toLocaleString("default", { month: "long" }),
    "Invoices"
  );

  // Send Email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // better: use env vars
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: "UK Tradie Bot",
    to: customerEmail,
    subject: "Your Invoice from UK Tradie",
    text: "Please find your quote attached.",
    attachments: [
      {
        filename: `Invoice_${newInvoice._id}.pdf`,
        path: pdfPath,
      },
    ],
  });

  if (sheetId != userExists.sheetId) {
    userExists.sheetId = sheetId;
    userExists.save();
  }

  // Clean up file
  fs.unlinkSync(pdfPath);

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
