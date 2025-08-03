const { XeroClient } = require("xero-node");
// require("dotenv").config();

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: [
   "openid",
    "profile",
    "email",
    "offline_access",
    "accounting.transactions",
    "accounting.contacts",
    "accounting.settings",
  ],
});

module.exports = xero;
