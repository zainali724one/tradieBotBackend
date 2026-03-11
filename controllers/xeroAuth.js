const { catchAsyncError } = require("../middlewares/catchAsyncError");
const User = require("../models/User");
const xero = require("../services/XeroClient");

exports.getConsentUrl = async (req, res, next) => {
  try {
    const { userId } = req.body;
    console.log(userId, "api running");
    // const userId="6868056c5717c3a1bc283e1d"
    const url = await xero.buildConsentUrl();
    // res.send({ url });

    const modifiedUrl = `${url}&state=${userId}`;
    console.log(modifiedUrl, "modifiedUrl");
    res.send({ url: modifiedUrl });
  } catch (error) {
    console.log(error, "consent error");
    res.status(500).json({ message: "something went wrong", error });
  }
};

// 2. Handle callback
// exports.handleXeroCallback = catchAsyncError(async (req, res) => {
//   try {
//     // ⚠️ Use the full req object here, not req.url
//     const state = req.query.state;
//     console.log(state, "here is state");
//     console.log(req.url, "req.url");

//     const protocol =
//       req.headers["x-forwarded-proto"] || req.protocol || "https";
//     const host = req.get("host");

//     // req.originalUrl includes the path and query string (e.g., /callback?code=...)
//     const fullCallbackUrl = `${protocol}://${host}${req.originalUrl}`;

//     console.log(fullCallbackUrl, "Full Callback URL passed to Xero");

//     await xero.apiCallback(fullCallbackUrl);
//     console.log("before updateTenants");
//     await xero.updateTenants(); // Populates tenantIds
//     console.log("after updateTenants");
//     const tokenSet = xero.readTokenSet(); // { access_token, refresh_token, etc. }
//     const tenantId = xero.tenants[0];
//     console.log(tokenSet, tokenSet, "these are required");
//     // Save the tokenSet & tenantId in your database against the user
//     await User.findByIdAndUpdate(state, {
//       xeroToken: JSON.stringify(tokenSet),
//       tenantId: JSON.stringify(tenantId),
//     });

//     res.redirect("https://tradie-bot.vercel.app/xeroconnected");
//   } catch (error) {
//     console.error("Xero callback error", error);
//     console.log(req.query.state, "req.query.state");
//     res.status(500).json({ success: false, message: "Callback failed" });
//   } // redirect to frontend
// });



exports.handleXeroCallback = catchAsyncError(async (req, res) => {
  try {
    const state = req.query.state;
    console.log("State:", state);
    console.log("Req URL:", req.url);

    // 1. Initialize the client (CRITICAL for serverless environments like Vercel)
    await xero.initialize();

    // 2. Pass the standard req.url directly to apiCallback
    // It contains the '?code=...' needed to fetch the access token.
    await xero.apiCallback(req.url); 
    
    console.log("Token exchanged successfully, fetching tenants...");
    
    // 3. Update tenants and read tokens
    await xero.updateTenants(); 
    const tokenSet = xero.readTokenSet(); 
    const tenantId = xero.tenants[0];
    
    console.log("TokenSet acquired:", !!tokenSet.access_token);

    // 4. Save to database
    await User.findByIdAndUpdate(state, {
      xeroToken: JSON.stringify(tokenSet),
      tenantId: JSON.stringify(tenantId),
    });

    res.redirect("https://tradie-bot.vercel.app/xeroconnected");
  } catch (error) {
    console.error("Xero callback error:", error?.response?.body || error.message);
    res.status(500).json({ success: false, message: "Callback failed" });
  } 
});

