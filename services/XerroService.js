// services/xeroService.ts

const User = require("../models/User");
const xero = require("./XeroClient");

export async function createXeroDocumentForUser(userId, data, type) {
  if (!userId || !data || !type) {
    throw new Error("Missing required parameters");
  }

  const user = await User.findById(userId);
  if (!user || !user.xeroToken || !user.tenantId) {
    throw new Error("User not connected to Xero");
  }

  // Set user token and tenant in xero instance

  const tokenSet = JSON.parse(user.xeroToken);
  const parsedTenantObj = JSON.parse(user.tenantId);
const parsedTenantId = parsedTenantObj.tenantId || parsedTenantObj.id;
  xero.setTokenSet(tokenSet);
//   xero.setTenantId(parsedTenantId);
console.log(tokenSet)
if (!tokenSet?.refresh_token) {
  throw new Error('Refresh token is missing');
}
  // 🔁 Refresh token if expired
//   if (xero.isTokenExpired()) {
    const newTokenSet = await xero.refreshToken();
    xero.setTokenSet(newTokenSet);
    user.xeroToken =JSON.stringify(newTokenSet)
    await user.save();
//   }

  try {
    let response;

    if (type === "invoice") {
      response = await xero.accountingApi.createInvoices(parsedTenantId, { invoices: [data] });
    } else if (type === "quote") {
      response = await xero.accountingApi.createQuotes(parsedTenantId, { quotes: [data] });
    } else {
      throw new Error("Unsupported document type");
    }

    return response.body;
  } catch (err) {
    console.error(`[Xero] Failed to create ${type}:`, err?.response?.body || err.message);
    throw err;
  }
}
