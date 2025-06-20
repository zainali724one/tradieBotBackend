const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const quote = require("../models/quote");
const User = require("../models/User");
const { ErrorHandler } = require("../utils/ErrorHandler");
const sendWhatsAppMessage = require("../services/twillioService");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const dayjs = require("dayjs");
const { saveDataToSheets } = require("../utils/googleSheets");

exports.addQuote = catchAsyncError(async (req, res, next) => {
  const {
    customerName,
    jobDescription,
    quoteAmount,
    customerEmail,
    telegramId,
    userId,
    customerPhone,
    sheetId,
  } = req.body;

  if (
    !customerName ||
    !jobDescription ||
    !quoteAmount ||
    !customerEmail ||
    !telegramId ||
    !userId ||
    !customerPhone ||
    !sheetId
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
    customerPhone,
    userId,
  });

  // Create Stripe PaymentIntent
  const paymentAmount = Math.round(Number(quoteAmount) * 100); // in cents
  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentAmount,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      quoteId: newQuote._id.toString(),
      userId: user._id.toString(),
    },
    transfer_data: {
      destination: user?.stripeAccountId,
    },
    receipt_email: customerEmail,
    description: `Quote for ${customerName}`,
  });

  // Save paymentIntent ID in quote
  newQuote.paymentIntentId = paymentIntent.id;
  await newQuote.save();

  // Use /tmp directory in Vercel
  const tempDir = "/tmp";
  const pdfPath = path.join(tempDir, `quote_${newQuote._id}.pdf`);
  const paymentLink = `https://peppy-swan-6fdd72.netlify.app/pay/quote/${newQuote._id}`;

  const messageBody = `Customer Name: ${customerName}
  Job: ${jobDescription}
Amount: $${quoteAmount}
Email: ${customerEmail}
Click here to pay: ${paymentLink}`;

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
      quoteAmount,
      customerEmail,
      telegramId,
      customerPhone,
      userId,
    ],
    sheetId,
    user?.googleAccessToken,
    user?.googleRefreshToken,
    "Quotes"
  );
  const doc = new PDFDocument();

  // Await PDF generation
  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(18).text("Quote Summary", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Customer Name: ${customerName}`);
    doc.text(`Job Description: ${jobDescription}`);
    doc.text(`Quote Amount: $${quoteAmount}`);
    doc.text(`Email: ${customerEmail}`);
    doc.moveDown();
    doc
      .fillColor("blue")
      .text("Click here to pay", { link: paymentLink, underline: true });
    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });

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
    subject: "Your Quote from UK Tradie",
    text: "Please find your quote attached.",
    attachments: [
      {
        filename: `Quote_${newQuote._id}.pdf`,
        path: pdfPath,
      },
    ],
  });

  if (sheetId != user.sheetId) {
    user.sheetId = sheetId;
    user.save();
  }

  // Clean up file
  fs.unlinkSync(pdfPath);

  res.status(201).json({
    message: "Quote submitted and emailed successfully",
    quote: newQuote,
  });
});

exports.paymentReminder = catchAsyncError(async (req, res) => {
  const threeDaysAgo = dayjs().subtract(3, "day").toDate();

  // Find unpaid quotes older than 3 days
  const unpaidQuotes = await quote.find({
    isPaid: false,
    createdAt: { $lte: threeDaysAgo },
  });

  const results = [];

  for (const quoteData of unpaidQuotes) {
    const { customerName, customerEmail, customerPhone, quoteAmount, _id } =
      quoteData;

    // Skip if no whatsapp number is provided
    if (!customerPhone) continue;
    const paymentLink = `https://peppy-swan-6fdd72.netlify.app/pay/quote/${_id}`;
    const messageBody = `Hi ${customerName}, this is a friendly reminder from UK Tradie. You have an unpaid quote of $${quoteAmount}. Please complete your payment. click here to pay ${paymentLink} `;

    sendWhatsAppMessage(customerPhone, messageBody)
      .then((res) => {
        console.log(res, "Whatsapp response");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  res.json({ message: "Reminder job executed", results });
});
