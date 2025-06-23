const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// async function saveDataToSheets(
//   data,
//   spreadsheetId,
//   accessToken,
//   refreshToken
// ) {

//   const oauth2Client = new google.auth.OAuth2(
//     process.env.CLIENT_ID,
//     process.env.CLIENT_SECRET,
//     process.env.REDIRECT_URI
//   );

//   oauth2Client.setCredentials({
//     access_token: accessToken,
//     refresh_token: refreshToken,
//   });

//   const sheets = google.sheets({ version: "v4", auth: oauth2Client });

//   const values = [data];

//   await sheets.spreadsheets.values.append({
//     spreadsheetId,
//     range: "Invoices!A:F",
//     valueInputOption: "USER_ENTERED",
//     resource: {
//       values,
//     },
//   });

//   console.log("✅ Invoice row added to sheet");
// }

async function saveDataToSheets(
  data,
  headings,
  spreadsheetId,
  accessToken,
  refreshToken,
  type
) {
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

  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetExists = sheetMeta.data.sheets.some(
    (s) => s.properties.title === type
  );

  // Create "Invoices" sheet if it doesn't exist
  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: { title: type },
            },
          },
        ],
      },
    });

    // Optionally add headers after creation
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${type}!A1:G1`,
      valueInputOption: "RAW",
      resource: {
        values: [headings],
      },
    });
  }

  // Append new row
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${type}!A:F`,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [data],
    },
  });

  console.log("✅ Invoice row added to sheet");
}

module.exports = { saveDataToSheets };
