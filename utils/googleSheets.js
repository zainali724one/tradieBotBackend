const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

async function saveDataToSheets(
  data,
  spreadsheetId,
  accessToken,
  refreshToken
) {
  // Set up OAuth2 client with your app credentials
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const values = [data];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Invoices!A:F",
    valueInputOption: "USER_ENTERED",
    resource: {
      values,
    },
  });

  console.log("✅ Invoice row added to sheet");
}

module.exports = { saveDataToSheets };
