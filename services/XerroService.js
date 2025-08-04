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
  xero.setTokenSet(user.xeroToken);
  xero.setTenantId(user.tenantId);

  // 🔁 Refresh token if expired
  if (xero.isTokenExpired()) {
    const newTokenSet = await xero.refreshToken();
    xero.setTokenSet(newTokenSet);
    user.xeroToken = newTokenSet.toJSON();
    await user.save();
  }

  try {
    let response;

    if (type === "invoice") {
      response = await xero.accountingApi.createInvoices(user.tenantId, { invoices: [data] });
    } else if (type === "quote") {
      response = await xero.accountingApi.createQuote(user.tenantId, { quotes: [data] });
    } else {
      throw new Error("Unsupported document type");
    }

    return response.body;
  } catch (err) {
    console.error(`[Xero] Failed to create ${type}:`, err?.response?.body || err.message);
    throw err;
  }
}
