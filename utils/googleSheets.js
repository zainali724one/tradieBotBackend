const { google } = require("googleapis");
const User = require("../models/User");

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

const getSheetId = (url) => {
  return url.split("/d/")[1].split("/")[0];
};

async function saveDataToSheets(
  data,
  headings,
  spreadsheetUrl,
  accessToken,
  refreshToken,
  type,
  userId
) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const spreadsheetId = getSheetId(spreadsheetUrl);
    console.log(spreadsheetId, "spreadsheetId");

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
  } catch (error) {
    console.log("catch is working -----", error.message);

    if (error.message === "invalid_grant") {
      await User.findByIdAndUpdate(userId, {
        googleAccessToken: "",
        googleRefreshToken: "",
      });
    }
  }
}

module.exports = { saveDataToSheets, getSheetId };
