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
const { sendWhatsApp } = require("../services/VonageService");
const { createXeroDocumentForUser } = require("../services/XerroService");
// const { default: generatePDF } = require("../utils/pdfGenerator");

exports.addQuote = catchAsyncError(async (req, res, next) => {
  const {
    customerName,
    jobDescription,
    quoteAmount,
    customerEmail,
    address,
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
    !address ||
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
    address,
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
    on_behalf_of: user?.stripeAccountId,
    transfer_data: {
      destination: user?.stripeAccountId,
    },
    receipt_email: customerEmail,
    description: `Quote for ${customerName}`,
  });

  // const account = await stripe.accounts.retrieve(user?.stripeAccountId);

  // const currency = account.default_currency || "usd";

  // const paymentIntent = await stripe.paymentIntents.create(
  //   {
  //     amount: paymentAmount,
  //     currency,
  //     automatic_payment_methods: { enabled: true },
  //     metadata: {
  //       quoteId: newQuote._id.toString(),
  //       userId: user._id.toString(),
  //     },
  //     receipt_email: customerEmail,
  //     description: `Quote for ${customerName}`,
  //   },
  //   {
  //     stripeAccount: user?.stripeAccountId,
  //   }
  // );

  // Save paymentIntent ID in quote
  newQuote.paymentIntentId = paymentIntent.id;
  await newQuote.save();

  // Use /tmp directory in Vercel
  const tempDir = "/tmp";
  const pdfPath = path.join(tempDir, `quote_${newQuote._id}.pdf`);
  const paymentLink = `https://tradie-bot.vercel.app/pay/quote/${newQuote._id}`;

  const messageBody = `
You have received a quote from UK Tradie Bot
Customer Name: ${customerName}
Address: ${address}
Job: ${jobDescription}
Amount: $${quoteAmount}
Email: ${customerEmail}
Click here to pay: ${paymentLink}`;

  // await sendWhatsApp(customerPhone, messageBody)

  await saveDataToSheets(
    [
      customerName,
      jobDescription,
      quoteAmount,
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
    user?.googleAccessToken,
    user?.googleRefreshToken,
    "Quotes",
    userId
  );

  const doc = new PDFDocument();

  // Await PDF generation
  //   await new Promise((resolve, reject) => {
  //     const stream = fs.createWriteStream(pdfPath);
  //     doc.pipe(stream);

  //     doc.fontSize(18).text("Quote Summary", { underline: true });
  //     doc.moveDown();
  //     doc.fontSize(12).text(`Customer Name: ${customerName}`);
  //     doc.text(`Job Description: ${jobDescription}`);
  //     doc.text(`Quote Amount: $${quoteAmount}`);
  //     doc.text(`Email: ${customerEmail}`);
  //     doc.moveDown();
  //     doc.end();

  //     stream.on("finish", resolve);
  //     stream.on("error", reject);
  //   });

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
  //     subject: "Your Quote from UK Tradie",
  //     text: "Please find your quote attached.",
  //     attachments: [
  //       {
  //         filename: `Quote_${newQuote._id}.pdf`,
  //         path: pdfPath,
  //       },
  //     ],
  //   }).then(()=>{
  //     console.log("send data to mail in quote")
  //   }).catch((err)=>{
  // console.log("err in mail",err)
  //   });

  // await generatePDF({
  //     customerName,
  //     jobDescription,
  //     amount:quoteAmount,
  //     customerEmail,
  //     address,
  //     telegramId,
  //     customerPhone,
  //     userId,
  //     paymentUrl:paymentLink,
  //     companyLogo:user?.companyLogo || "",
  //     type:"quote"
  //   }, user?.pdfTemplateId,"quote",user)

  if (sheetId != user.sheetId) {
    user.sheetId = sheetId;
    user.save();
  }

  // Clean up file
  // fs.unlinkSync(pdfPath);

  await createXeroDocumentForUser(
    userId,
    {
      customerName,
      jobDescription,
      quoteAmount,
      customerEmail,
      telegramId,
      customerPhone,
      userId,
      adress: address,
    },
    "quote"
  );

  res.status(201).json({
    message: "Quote submitted and emailed successfully",
    data: {
      customerName,
      jobDescription,
      amount: quoteAmount,
      customerEmail,
      address,
      telegramId,
      customerPhone,
      userId,
      paymentUrl: paymentLink,
      companyLogo: user?.companyLogo || "",
    },
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
    const paymentLink = `https://tradie-bot.vercel.app/pay/quote/${_id}`;
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
