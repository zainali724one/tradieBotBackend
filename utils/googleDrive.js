const { google } = require("googleapis");
const fs = require("fs");

// Upload PDF to Drive under /Invoices/2025/April
async function uploadPdfToDrive(
  oauthTokens,
  pdfPath,
  fileName,
  year,
  month,
  folderName
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: oauthTokens.accessToken,
    refresh_token: oauthTokens.refreshToken,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Helper to create/get folder by name and parent
  async function getOrCreateFolder(name, parentId = null) {
    const q = `'${
      parentId || "root"
    }' in parents and name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const res = await drive.files.list({ q, fields: "files(id, name)" });

    if (res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    const folder = await drive.files.create({
      resource: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentId ? [parentId] : undefined,
      },
      fields: "id",
    });

    return folder.data.id;
  }

  // Step 1: Create folder hierarchy
  const invoicesFolderId = await getOrCreateFolder(folderName);
  const yearFolderId = await getOrCreateFolder(
    year.toString(),
    invoicesFolderId
  );
  const monthFolderId = await getOrCreateFolder(month, yearFolderId);

  // Step 2: Upload file
  const fileMetadata = {
    name: fileName,
    parents: [monthFolderId],
  };
  const media = {
    mimeType: "application/pdf",
    body: fs.createReadStream(pdfPath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id, webViewLink",
  });

  console.log("✅ PDF uploaded to Google Drive:", file.data.webViewLink);
  return file.data;
}

module.exports = { uploadPdfToDrive };
