// import puppeteer from "puppeteer";

// export const generatePDF = async (data, selectedTemplate) => {
//   const browser = await puppeteer.launch({ headless: "new" });
//   const page = await browser.newPage();

//   const templateOne = `
//   <div style="width:430px;padding:24px;margin-top:12px;background:#fff;border-radius:8px;
//        box-shadow:0 4px 10px rgba(0,0,0,0.1);font-family:sans-serif;font-size:14px;color:#1e293b;">
//     <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
//       ${data.companyLogo ? `<img src="${data.companyLogo}" style="max-height:64px;max-width:130px;object-fit:contain;" />` : ""}
//       <div style="text-align:right;">
//         <h2 style="font-size:20px;font-weight:bold;text-transform:uppercase;color:#374151;">
//           ${data.type === "quote" ? "Quote" : "Invoice"}
//         </h2>
//         <p style="font-size:12px;color:#6b7280;">${new Date().toLocaleDateString()}</p>
//       </div>
//     </div>
//     <div style="margin-bottom:16px;">
//       <h3 style="font-size:18px;font-weight:600;color:#374151;">
//         ${data.type === "quote" ? "Quote Summary" : "Invoice Summary"}
//       </h3>
//       <p><strong>Customer Name:</strong> ${data.customerName}</p>
//       <p><strong>Job Description:</strong> ${data.jobDescription}</p>
//       <p><strong>Amount:</strong> $${data.amount}</p>
//       ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ""}
//       <p><strong>Email:</strong> ${data.customerEmail}</p>
//       <p><strong>Phone:</strong> ${data.customerPhone}</p>
//       ${data.type === "quote" && data.paymentUrl ? `
//         <p><strong>Click here to pay:</strong> 
//           <a href="${data.paymentUrl}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">
//             ${data.paymentUrl}
//           </a>
//         </p>` : ""}
//     </div>
//     <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;
//          font-size:12px;text-align:center;color:#9ca3af;">
//       Thank you for choosing our service.
//     </div>
//   </div>
//   `;

//   const templateTwo = `
//   <div style="width:430px;padding:24px;border:4px solid #3b82f6;margin-top:12px;
//        border-radius:12px;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,0.1);
//        font-family:sans-serif;font-size:14px;color:#1f2937;">
//     <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
//       ${data.companyLogo ? `<img src="${data.companyLogo}" style="max-height:64px;max-width:130px;object-fit:contain;" />` : ""}
//       <div style="text-align:right;">
//         <h2 style="font-size:22px;font-weight:bold;color:#1d4ed8;text-transform:uppercase;">
//           ${data.type === "quote" ? "Quote" : "Invoice"}
//         </h2>
//         <p style="font-size:12px;color:#6b7280;">${new Date().toLocaleDateString()}</p>
//       </div>
//     </div>
//     <div style="background:#eff6ff;padding:16px;border-radius:8px;margin-bottom:16px;border:1px solid #bfdbfe;">
//       <h3 style="font-size:18px;font-weight:600;color:#1d4ed8;">
//         ${data.type === "quote" ? "Quote Summary" : "Invoice Summary"}
//       </h3>
//       <p><strong>Customer Name:</strong> ${data.customerName}</p>
//       <p><strong>Job Description:</strong> ${data.jobDescription}</p>
//       <p><strong>Amount:</strong> $${data.amount}</p>
//       ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ""}
//       <p><strong>Email:</strong> ${data.customerEmail}</p>
//       <p><strong>Phone:</strong> ${data.customerPhone}</p>
//       ${data.type === "quote" && data.paymentUrl ? `
//         <p><strong>Click here to pay:</strong> 
//           <a href="${data.paymentUrl}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">
//             ${data.paymentUrl}
//           </a>
//         </p>` : ""}
//     </div>
//     <div style="margin-top:24px;text-align:center;font-size:12px;color:#6b7280;">
//       We appreciate your business. Let us know if you have any questions.
//     </div>
//   </div>
//   `;

//   const htmlContent = `
//     <!DOCTYPE html>
//     <html>
//     <head><meta charset="UTF-8" /></head>
//     <body>
//       ${selectedTemplate === "template1" ? templateOne : templateTwo}
//     </body>
//     </html>
//   `;

//   await page.setContent(htmlContent, { waitUntil: "networkidle0" });

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     printBackground: true
//   });

//   await browser.close();
//   return pdfBuffer;
// };


import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { uploadPdfToDrive } from "./googleDrive";
const nodemailer = require("nodemailer");
// const { uploadPdfToDrive } = require('../utils/googleDrive');

export default async function generatePDF(data, selectedTemplate,pdfType,userExists) {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();



     const templateOne = `
  <div style="width:430px;padding:24px;margin-top:12px;background:#fff;border-radius:8px;
       box-shadow:0 4px 10px rgba(0,0,0,0.1);font-family:sans-serif;font-size:14px;color:#1e293b;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      ${data.companyLogo ? `<img src="${data.companyLogo}" style="max-height:64px;max-width:130px;object-fit:contain;" />` : ""}
      <div style="text-align:right;">
        <h2 style="font-size:20px;font-weight:bold;text-transform:uppercase;color:#374151;">
          ${data.type === "quote" ? "Quote" : "Invoice"}
        </h2>
        <p style="font-size:12px;color:#6b7280;">${new Date().toLocaleDateString()}</p>
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <h3 style="font-size:18px;font-weight:600;color:#374151;">
        ${data.type === "quote" ? "Quote Summary" : "Invoice Summary"}
      </h3>
      <p><strong>Customer Name:</strong> ${data.customerName}</p>
      <p><strong>Job Description:</strong> ${data.jobDescription}</p>
      <p><strong>Amount:</strong> $${data.amount}</p>
      ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ""}
      <p><strong>Email:</strong> ${data.customerEmail}</p>
      <p><strong>Phone:</strong> ${data.customerPhone}</p>
      ${data.type === "quote" && data.paymentUrl ? `
        <p><strong>Click here to pay:</strong> 
          <a href="${data.paymentUrl}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">
            ${data.paymentUrl}
          </a>
        </p>` : ""}
    </div>
    <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;
         font-size:12px;text-align:center;color:#9ca3af;">
      Thank you for choosing our service.
    </div>
  </div>
  `;

  const templateTwo = `
  <div style="width:430px;padding:24px;border:4px solid #3b82f6;margin-top:12px;
       border-radius:12px;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,0.1);
       font-family:sans-serif;font-size:14px;color:#1f2937;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      ${data.companyLogo ? `<img src="${data.companyLogo}" style="max-height:64px;max-width:130px;object-fit:contain;" />` : ""}
      <div style="text-align:right;">
        <h2 style="font-size:22px;font-weight:bold;color:#1d4ed8;text-transform:uppercase;">
          ${data.type === "quote" ? "Quote" : "Invoice"}
        </h2>
        <p style="font-size:12px;color:#6b7280;">${new Date().toLocaleDateString()}</p>
      </div>
    </div>
    <div style="background:#eff6ff;padding:16px;border-radius:8px;margin-bottom:16px;border:1px solid #bfdbfe;">
      <h3 style="font-size:18px;font-weight:600;color:#1d4ed8;">
        ${data.type === "quote" ? "Quote Summary" : "Invoice Summary"}
      </h3>
      <p><strong>Customer Name:</strong> ${data.customerName}</p>
      <p><strong>Job Description:</strong> ${data.jobDescription}</p>
      <p><strong>Amount:</strong> $${data.amount}</p>
      ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ""}
      <p><strong>Email:</strong> ${data.customerEmail}</p>
      <p><strong>Phone:</strong> ${data.customerPhone}</p>
      ${data.type === "quote" && data.paymentUrl ? `
        <p><strong>Click here to pay:</strong> 
          <a href="${data.paymentUrl}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">
            ${data.paymentUrl}
          </a>
        </p>` : ""}
    </div>
    <div style="margin-top:24px;text-align:center;font-size:12px;color:#6b7280;">
      We appreciate your business. Let us know if you have any questions.
    </div>
  </div>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" /></head>
    <body>
      ${selectedTemplate === "1" ? templateOne : templateTwo}
    </body>
    </html>
  `;





    await page.setContent(htmlContent);

       // Generate PDF with Puppeteer
const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true
});

    await browser.close();






// Save to /tmp (needed for Drive upload API that takes file path)
const baseDir = '/tmp';
const dirPath = path.join(baseDir, pdfType);

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const fileName = `${pdfType}_${Date.now()}.pdf`;
const pdfPath = path.join(dirPath, fileName);

fs.writeFileSync(pdfPath, pdfBuffer);

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
  to: data?.customerEmail,
  subject: `Your ${pdfType === "invoice" ? "Invoice" : "Quote"} from UK Tradie`,
  text: `Please find your ${pdfType} attached.`,
  attachments: [
    {
      filename: fileName,
      content: pdfBuffer, // directly attach from buffer
      contentType: 'application/pdf'
    },
  ],
});


    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader("Content-Disposition", "inline; filename=example.pdf");
    // res.send(pdf);

  } catch (error) {
    console.error(error,"error");
    // res.status(500).send("Error generating PDF");
  }
}

