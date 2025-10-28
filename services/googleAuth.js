const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file", // Upload files to user's Drive
  "https://www.googleapis.com/auth/spreadsheets", // Write to user's Sheets
  "https://www.googleapis.com/auth/calendar.events", // Create calendar events
];

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

function getAuthUrl(userId) {
  console.log(process.env.CLIENT_ID, "process.env.CLIENT_ID")
  console.log(process.env.CLIENT_SECRET, "process.env.CLIENT_SECRET")
  console.log(process.env.REDIRECT_URI, "process.env.REDIRECT_URI")
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: userId,
  });
}

async function getTokensFromCode(code) {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

function getGoogleClient(tokens) {
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
}

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  getGoogleClient,
};
