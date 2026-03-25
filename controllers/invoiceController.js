const { catchAsyncError } = require("../middlewares/catchAsyncError");
const invoice = require("../models/invoice");
const quote = require("../models/quote");
const { ErrorHandler } = require("../utils/ErrorHandler");
const User = require("../models/User");
const { saveDataToSheets } = require("../utils/googleSheets");
// const { uploadPdfToDrive } = require("../utils/googleDrive");
const { uploadPdfToDrive, uploadFileToDrive } = require("../utils/googleDrive");
const path = require("path");
const PDFDocument = require("pdfkit");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const fs = require("fs");
// const sendWhatsAppMessage = require("../services/twillioService");
const { sendWhatsApp } = require("../services/VonageService");

// import { Invoice } from "xero-node";
const { Invoice } = require("xero-node");
// const { default: generatePDF } = require("../utils/pdfGenerator");
const { createXeroDocumentForUser } = require("../services/XerroService");
const generatePDF = require("../utils/pdfGenerator");
const mongoose = require("mongoose");
const job = require("../models/job");

// exports.addInvoice = catchAsyncError(async (req, res, next) => {
//   const {
//     userId,
//     telegramId,
//     customerName,
//     jobDescription,
//     invoiceAmount,
//     address,
//     customerEmail,
//     includeCost,
//     includeReceipt,
//     customerPhone,
//     sheetId,
//     jobId,
//     materialCost,
//     profit,
//     materialInvoices,
//   } = req.body;

//   // const user = await User.findOne({ telegramId });
//   // if (!user) {
//   //   return next(new ErrorHandler("User not found for this telegramId", 404));
//   // }

//   const isEmpty = (value) => !value || value.trim() === "";

//   if (isEmpty(userId))
//     return next(new ErrorHandler("User ID is required", 400));
//   if (isEmpty(telegramId))
//     return next(new ErrorHandler("Telegram ID is required", 400));
//   if (isEmpty(customerName))
//     return next(new ErrorHandler("Customer Name is required", 400));
//   if (isEmpty(jobDescription))
//     return next(new ErrorHandler("Job Description is required", 400));
//   if (isEmpty(invoiceAmount))
//     return next(new ErrorHandler("Invoice Amount is required", 400));
//   if (isEmpty(customerEmail))
//     return next(new ErrorHandler("Customer Email is required", 400));
//   if (isEmpty(includeCost))
//     return next(new ErrorHandler("Include Cost is required", 400));
//   if (isEmpty(includeReceipt))
//     return next(new ErrorHandler("Include Receipt is required", 400));
//     if (isEmpty(jobId))
//     return next(new ErrorHandler("Job ID is required", 400));

//   const userExists = await User.findOne({ telegramId });

//     const jobExists = await job.findOne({ _id: jobId });
//   if (!jobExists) {
//     return next(new ErrorHandler("No job found with this ID", 404));
//   }
//   if (!userExists) {
//     return next(new ErrorHandler("No user found with this Telegram ID", 404));
//   }

//    if (!userExists?.stripeAccountId) {
//     return next(
//       new ErrorHandler("User does not have a connected Stripe account", 404)
//     );
//   }

//   let invoiceData = {
//    userId,
//     telegramId,
//     customerName,
//     jobDescription,
//     invoiceAmount,
//     customerEmail,
//     includeCost,
//     includeReceipt,
//     address,
//     customerPhone,
//     jobId,
//   }

//   if (materialCost) {
//     invoiceData.materialCost = materialCost || 0;
//   }
//   if (profit) {
//     invoiceData.profit = profit || 0;
//   }

//   const newInvoice = new invoice(invoiceData);
//   // });



//     // Create Stripe PaymentIntent
//     const paymentAmount = Math.round(Number(invoiceAmount) * 100); // in cents
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: paymentAmount,
//       currency: "gbp",
//       automatic_payment_methods: { enabled: true },
//       metadata: {
//         invoiceId: newInvoice._id.toString(),
//         userId: userExists._id.toString(),
//       },
//       on_behalf_of: userExists?.stripeAccountId,
//       transfer_data: {
//         destination: userExists?.stripeAccountId,
//       },
//       receipt_email: customerEmail,
//       description: `Invoice for ${customerName}`,
//     });

//     // Save paymentIntent ID in invoice
//     newInvoice.paymentIntentId = paymentIntent.id;
//     await newInvoice.save();
//     const paymentLink = `https://tradie-bot.vercel.app/pay/quote/${newInvoice._id}`;

//   await newInvoice.save();

//   const tempDir = "/tmp";
//   const pdfPath = path.join(tempDir, `invoice_${newInvoice._id}.pdf`);

//   const messageBody = `
// You have recieved the invoice by tradie bot
// Customer Name: ${customerName}
// Job: ${jobDescription}
// Amount: $${invoiceAmount}
// Address: ${address}
// Email: ${customerEmail}
// `;
//   // await sendWhatsApp(customerPhone, messageBody);

//   // .then((res) => {
//   //       console.log(res, "Whatsapp response");
//   //     })
//   //     .catch((err) => {
//   //       console.log(err);
//   //     });
//   // sendWhatsAppMessage(customerPhone, messageBody)
//   //   .then((res) => {
//   //     console.log(res, "Whatsapp response");
//   //   })
//   //   .catch((err) => {
//   //     console.log(err);
//   //   });
//   console.log("before google sheets");
// //   if (userExists?.googleAccessToken && userExists?.googleRefreshToken) {
// //     console.log("saving to google sheets");
// //     const materialInvoicesValue = Array.isArray(materialInvoices)
// //       ? materialInvoices.join(", ")
// //       : materialInvoices || "";

// // console.log("materialInvoicesValue1:", materialInvoicesValue);
// //     await saveDataToSheets(
// //       [
// //         customerName,
// //         jobDescription,
// //         invoiceAmount,
// //         address,
// //         customerEmail,
// //         telegramId,
// //         customerPhone,
// //         userId,
// //         materialInvoicesValue,
// //       ],
// //       [
// //         "Customer Name",
// //         "Job",
// //         "Amount",
// //         "Address",
// //         "Email",
// //         "Telegram ID",
// //         "Phone",
// //         "User ID",
// //         "Material Invoices",
// //       ],
// //       sheetId,
// //       userExists?.googleAccessToken,
// //       userExists?.googleRefreshToken,
// //       "Invoices",
// //       userId
// //     );


  
// //   }


// if (userExists?.googleAccessToken && userExists?.googleRefreshToken) {
//     console.log("saving to google sheets");

//     // 1. Ensure materialInvoices is a valid array
//     const invoiceUrls = Array.isArray(materialInvoices) 
//       ? materialInvoices 
//       : (materialInvoices ? [materialInvoices] : []);

//     // 2. Prepare the base data and base headers
//     const rowData = [
//       customerName,
//       jobDescription,
//       invoiceAmount,
//       address,
//       customerEmail,
//       telegramId,
//       customerPhone,
//       userId,
//     ];

//     const headings = [
//       "Customer Name",
//       "Job",
//       "Amount",
//       "Address",
//       "Email",
//       "Telegram ID",
//       "Phone",
//       "User ID",
//     ];

//     // 3. Dynamically add a new column for EVERY image uploaded
//     // If they uploaded 3 images, it adds 3 extra columns to this specific row.
//     invoiceUrls.forEach((url, index) => {
//       headings.push(`Material Invoice ${index + 1}`);
      
//       // We use the HYPERLINK formula so the spreadsheet looks clean
//       rowData.push(`=HYPERLINK("${url}", "View Receipt ${index + 1}")`); 
//     });

//     console.log("Appending row with columns:", rowData.length);

//     // 4. Send to Google Sheets
//     await saveDataToSheets(
//       rowData,       // Dynamic row data
//       headings,      // Dynamic headings
//       sheetId,
//       userExists?.googleAccessToken,
//       userExists?.googleRefreshToken,
//       "Invoices",
//       userId
//     );
//   }

//   const invoicesPayload = {
//     invoices: [
//       {
//         type: Invoice.TypeEnum.ACCREC,
//         contact: {
//           name: customerName,
//           emailAddress: customerEmail,
//           phones: [
//             {
//               phoneType: "DEFAULT",
//               phoneNumber: customerPhone || "0000000000",
//             },
//           ],
//         },
//         lineItems: [
//           {
//             description: jobDescription || "Service Description",
//             quantity: 1,
//             unitAmount: parseFloat(invoiceAmount),
//             accountCode: "200", // Double check this is valid in your Xero chart
//             taxType: "NONE",
//             lineAmount: parseFloat(invoiceAmount),
//           },
//         ],
//         date: new Date().toISOString().split("T")[0],
//         dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//           .toISOString()
//           .split("T")[0],
//         status: Invoice.StatusEnum.AUTHORISED,
//       },
//     ],
//   };

//   if (sheetId != userExists.sheetId) {
//     userExists.sheetId = sheetId;
//     userExists.save();
//   }
//   // if (userExists.tenantId && userExists.xeroToken) {
//   //   await createXeroDocumentForUser(userId, invoicesPayload, "invoice");
//   // }

//   // Clean up file
//   // fs.unlinkSync(pdfPath);

//   res.status(201).json({
//     success: true,
//     message: "Invoice created successfully",
//     data: {
//       userId,
//       telegramId,
//       _id: newInvoice._id.toString(),
//       customerName,
//       jobDescription,
//       amount: invoiceAmount,
//       customerEmail,
//       address,
//       includeCost,
//       includeReceipt,
//       customerPhone,
//       materialCost: invoiceData.materialCost || 0,
//       profit: invoiceData.profit || 0,
//       paymentUrl: paymentLink,
//       companyLogo: userExists?.companyLogo || "",
//       businessEmail: userExists?.email || "",
//       businessName: userExists?.businessName || "",
//       businessPhone: userExists?.phone || "",
//     },
//   });
// });



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
    jobId,
    materialCost,
    profit,
  } = req.body;

  // Assuming you are using Multer (e.g., upload.array('materialImages'))
  const files = req.files || []; 

  const isEmpty = (value) => !value || value.trim() === "";

  if (isEmpty(userId)) return next(new ErrorHandler("User ID is required", 400));
  if (isEmpty(telegramId)) return next(new ErrorHandler("Telegram ID is required", 400));
  if (isEmpty(customerName)) return next(new ErrorHandler("Customer Name is required", 400));
  if (isEmpty(jobDescription)) return next(new ErrorHandler("Job Description is required", 400));
  if (isEmpty(invoiceAmount)) return next(new ErrorHandler("Invoice Amount is required", 400));
  if (isEmpty(customerEmail)) return next(new ErrorHandler("Customer Email is required", 400));
  if (isEmpty(includeCost)) return next(new ErrorHandler("Include Cost is required", 400));
  if (isEmpty(includeReceipt)) return next(new ErrorHandler("Include Receipt is required", 400));
  if (isEmpty(jobId)) return next(new ErrorHandler("Job ID is required", 400));

  const userExists = await User.findOne({ telegramId });
  const jobExists = await job.findOne({ _id: jobId });

  if (!jobExists) return next(new ErrorHandler("No job found with this ID", 404));
  if (!userExists) return next(new ErrorHandler("No user found with this Telegram ID", 404));
  if (!userExists?.stripeAccountId) return next(new ErrorHandler("User does not have a connected Stripe account", 404));

  let invoiceData = {
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
    jobId,
  };

  if (materialCost) invoiceData.materialCost = materialCost || 0;
  if (profit) invoiceData.profit = profit || 0;

  const newInvoice = new invoice(invoiceData);

  // --- 1. Stripe Payment Setup ---
  const paymentAmount = Math.round(Number(invoiceAmount) * 100); 
  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentAmount,
    currency: "gbp",
    automatic_payment_methods: { enabled: true },
    metadata: {
      invoiceId: newInvoice._id.toString(),
      userId: userExists._id.toString(),
    },
    on_behalf_of: userExists?.stripeAccountId,
    transfer_data: { destination: userExists?.stripeAccountId },
    receipt_email: customerEmail,
    description: `Invoice for ${customerName}`,
  });

  newInvoice.paymentIntentId = paymentIntent.id;
  await newInvoice.save();
  const paymentLink = `https://tradie-bot.vercel.app/pay/quote/${newInvoice._id}`;

  // --- 2. Upload Images to Google Drive ---
  let uploadedDriveUrls = [];
  
  if (files.length > 0 && userExists?.googleAccessToken && userExists?.googleRefreshToken) {
    console.log("Uploading files to Google Drive...");
    
    const oauthTokens = {
      accessToken: userExists.googleAccessToken,
      refreshToken: userExists.googleRefreshToken,
    };

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    for (const file of files) {
      const driveFile = await uploadFileToDrive(
        oauthTokens,
        file.path, // The local path where multer saved the image temporarily
        file.originalname,
        file.mimetype, // e.g., 'image/jpeg' or 'image/png'
        year,
        month,
        day,
        customerName,
        "Invoices" // Root Folder
      );
      uploadedDriveUrls.push(driveFile.webViewLink);
      
      // Clean up the local temp file after upload to save server space
      fs.unlinkSync(file.path);
    }
  }

  // --- 3. Save to Google Sheets ---
  if (userExists?.googleAccessToken && userExists?.googleRefreshToken) {
    console.log("Saving to google sheets");

    const rowData = [
      customerName,
      jobDescription,
      invoiceAmount,
      address,
      customerEmail,
      telegramId,
      customerPhone,
      userId,
    ];

    const headings = [
      "Customer Name",
      "Job",
      "Amount",
      "Address",
      "Email",
      "Telegram ID",
      "Phone",
      "User ID",
    ];

    // Use the URLs we just got back from Google Drive
    uploadedDriveUrls.forEach((url, index) => {
      headings.push(`Material Invoice ${index + 1}`);
      rowData.push(`=HYPERLINK("${url}", "View Receipt ${index + 1}")`);
    });

    await saveDataToSheets(
      rowData,
      headings,
      sheetId,
      userExists?.googleAccessToken,
      userExists?.googleRefreshToken,
      "Invoices",
      userId
    );
  }

  // ... (Your existing Xero payload and sheetId saving logic remains exactly the same below this point) ...
  if (sheetId != userExists.sheetId) {
    userExists.sheetId = sheetId;
    userExists.save();
  }
    // if (userExists.tenantId && userExists.xeroToken) {
  //   await createXeroDocumentForUser(userId, invoicesPayload, "invoice");
  // }

//   // Clean up file
  // fs.unlinkSync(pdfPath);

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    data: {
      userId,
      telegramId,
      _id: newInvoice._id.toString(),
      customerName,
      jobDescription,
      amount: invoiceAmount,
      customerEmail,
      address,
      includeCost,
      includeReceipt,
      customerPhone,
      materialCost: invoiceData.materialCost || 0,
      profit: invoiceData.profit || 0,
      paymentUrl: paymentLink,
      invoicesUploaded: uploadedDriveUrls.length, // Let the frontend know how many uploaded
      companyLogo: userExists?.companyLogo || "",
      businessEmail: userExists?.email || "",
      businessName: userExists?.businessName || "",
      businessPhone: userExists?.phone || "",
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
