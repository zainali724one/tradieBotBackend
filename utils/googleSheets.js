const { google } = require("googleapis");
const User = require("../models/User");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];


const getSheetId = (url) => {
  return url.split("/d/")[1].split("/")[0];
};

// async function saveDataToSheets(
//   data,
//   headings,
//   spreadsheetUrl,
//   accessToken,
//   refreshToken,
//   type,
//   userId
// ) {
//   try {
//     const oauth2Client = new google.auth.OAuth2(
//       process.env.CLIENT_ID,
//       process.env.CLIENT_SECRET,
//       process.env.REDIRECT_URI
//     );

//     const spreadsheetId = getSheetId(spreadsheetUrl);
//     console.log(spreadsheetId, "spreadsheetId");

//     oauth2Client.setCredentials({
//       access_token: accessToken,
//       refresh_token: refreshToken,
//     });

//     const sheets = google.sheets({ version: "v4", auth: oauth2Client });

//     const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
//     const sheetExists = sheetMeta.data.sheets.some(
//       (s) => s.properties.title === type
//     );

//     // Create "Invoices" sheet if it doesn't exist
//     if (!sheetExists) {
//       await sheets.spreadsheets.batchUpdate({
//         spreadsheetId,
//         resource: {
//           requests: [
//             {
//               addSheet: {
//                 properties: { title: type },
//               },
//             },
//           ],
//         },
//       });

//       // Optionally add headers after creation
//       await sheets.spreadsheets.values.update({
//         spreadsheetId,
//         range: `${type}!A1:G1`,
//         valueInputOption: "RAW",
//         resource: {
//           values: [headings],
//         },
//       });
//     }

//     // Append new row
//     await sheets.spreadsheets.values.append({
//       spreadsheetId,
//       range: `${type}!A:F`,
//       valueInputOption: "USER_ENTERED",
//       resource: {
//         values: [data],
//       },
//     });

//     console.log("✅ Invoice row added to sheet");
//   } catch (error) {
//     console.log("catch is working -----", error.message);

//     if (error.message === "invalid_grant") {
//       await User.findByIdAndUpdate(userId, {
//         googleAccessToken: "",
//         googleRefreshToken: "",
//       });
//     }
//   }
// }



// async function saveDataToSheets(
//   data,
//   headings,
//   spreadsheetUrl,
//   accessToken,
//   refreshToken,
//   type,
//   userId
// ) {
//   try {
//     const oauth2Client = new google.auth.OAuth2(
//       process.env.CLIENT_ID,
//       process.env.CLIENT_SECRET,
//       process.env.REDIRECT_URI
//     );

//     const spreadsheetId = getSheetId(spreadsheetUrl);
    
//     oauth2Client.setCredentials({
//       access_token: accessToken,
//       refresh_token: refreshToken,
//     });

//     const sheets = google.sheets({ version: "v4", auth: oauth2Client });

//     const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
//     const sheetExists = sheetMeta.data.sheets.some(
//       (s) => s.properties.title === type
//     );

//     // 1. Create Sheet & Headers if it doesn't exist
//     if (!sheetExists) {
//       console.log(`Creating new sheet: ${type}`);
      
//       // Create the sheet
//       await sheets.spreadsheets.batchUpdate({
//         spreadsheetId,
//         resource: {
//           requests: [
//             {
//               addSheet: {
//                 properties: { title: type },
//               },
//             },
//           ],
//         },
//       });

//       // Add Headers
//       // FIX: Use single quotes around ${type} to handle spaces in names
//       // FIX: Use range 'A1' instead of 'A1:G1' to let Sheets auto-detect width
//       await sheets.spreadsheets.values.update({
//         spreadsheetId,
//         range: `'${type}'!A1`, 
//         valueInputOption: "USER_ENTERED", 
//         resource: {
//           values: [headings],
//         },
//       });
//       console.log("✅ Headers added");
//     }

//     // 2. Append Data
//     // FIX: Use single quotes around ${type}
//     await sheets.spreadsheets.values.append({
//       spreadsheetId,
//       range: `'${type}'!A1`, // Starting at A1 lets append find the next empty row automatically
//       valueInputOption: "USER_ENTERED",
//       insertDataOption: "INSERT_ROWS", // Explicitly tell it to insert new rows
//       resource: {
//         values: [data],
//       },
//     });

//     console.log("✅ Invoice row added to sheet");
//   } catch (error) {
//     console.error("❌ Error in saveDataToSheets:", error.message);
//     // Log the full error to see details (like specific range errors)
//     if(error.response) console.error(JSON.stringify(error.response.data, null, 2));

//     if (error.message === "invalid_grant") {
//       await User.findByIdAndUpdate(userId, {
//         googleAccessToken: "",
//         googleRefreshToken: "",
//       });
//     }
//   }
// }










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

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // 1. Check if sheet exists
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = sheetMeta.data.sheets.some(
      (s) => s.properties.title === type
    );

    // 2. Prepare the payload
    // If sheet exists, we only append data. 
    // If it's new, we append Headers AND Data together.
    let valuesToAppend = [data];

    if (!sheetExists) {
      console.log(`Creating new sheet: ${type}`);
      
      // Create the sheet
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

      // Since the sheet is new, prepend headers to our data payload
      valuesToAppend = [headings, data]; 
      console.log("✅ New sheet created, preparing to add headers + data");
    }

    // 3. Append Data (and Headers if new) in ONE call
    // This prevents the data from overwriting the headers
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${type}'!A1`, 
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: valuesToAppend,
      },
    });

    console.log("✅ Data successfully saved to sheet");

  } catch (error) {
    console.error("❌ Error in saveDataToSheets:", error.message);
    if (error.response) console.error(JSON.stringify(error.response.data, null, 2));

    if (error.message === "invalid_grant") {
      await User.findByIdAndUpdate(userId, {
        googleAccessToken: "",
        googleRefreshToken: "",
      });
    }
  }
}

module.exports = { saveDataToSheets, getSheetId };
