// services/xeroService.ts

const User = require("../models/User");
const xero = require("./XeroClient");

export async function createXeroDocumentForUser(userId, data, type){
  if (!userId || !data || !type) {
    throw new Error("Missing required parameters");
  }

  const user = await User.findById(userId);
  if (!user || !user.xeroToken || !user.tenantId) {
    throw new Error("User not connected to Xero");
  }

  // Set user token and tenant in xero instance


   await xero.initialize();







  const tokenSet = JSON.parse(user.xeroToken);
  const parsedTenantObj = JSON.parse(user.tenantId);
const parsedTenantId = parsedTenantObj.tenantId || parsedTenantObj.id;
  xero.setTokenSet(tokenSet);
//   xero.setTenantId(parsedTenantId);
// console.log(tokenSet,"here is token set")
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




;


  try {
    let response;

    if (type === "invoice") {
      response = await xero.accountingApi.createInvoices(parsedTenantId, data);
    } else if (type === "quote") {
      const contact = {
  name: data?.customerName,
  emailAddress: data?.customerEmail,
  phones: [
    {
      phoneType: 'MOBILE',
      phoneNumber: data?.customerPhone,
    }
  ],
  addresses: [
    {
      addressType: 'STREET',
      addressLine1: data?.address
    }
  ]
};


const lineItem = {
  description: data?.jobDescription,
  quantity: 1,
  unitAmount: data?.quoteAmount,
  accountCode: '200' // Replace with correct revenue account code from your Xero chart of accounts
};
const accounts = await xero.accountingApi.getAccounts(parsedTenantId);
// console.log(accounts.body.accounts);


const quote = {
  contact,
  lineItems: [lineItem],
  date: new Date().toISOString().split('T')[0], // e.g., "2025-08-05"
  reference: `Telegram ID: ${user?.telegramId}`,
  status: 'DRAFT', // or 'SENT' or 'ACCEPTED' etc.
  quoteNumber: `Q-${Date.now()}`, // Optional
};


const quotes = {
  quotes: [quote]
}
      response = await xero.accountingApi.createQuotes(parsedTenantId, quotes,true,`quote-${Date.now()}`);
    } else {
      throw new Error("Unsupported document type");
    }

    return response.body;
  } catch (err) {
    console.error(`[Xero] Failed to create ${type}:`, err?.response?.body || err.message);
    throw err;
  }
}
