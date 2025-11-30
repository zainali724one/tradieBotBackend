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
    res.send({ url: modifiedUrl });
  } catch (error) {
    console.log(error, "consent error");
    res.status(500).json({ message: "something went wrong", error });
  }
};

// 2. Handle callback
exports.handleXeroCallback = catchAsyncError(async (req, res) => {
  try {
    // ⚠️ Use the full req object here, not req.url
    const state = req.query.state;
    console.log(state, "here is state---------");
    console.log(req.url, "req.url");

    const protocol =
      req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.get("host");

    // req.originalUrl includes the path and query string (e.g., /callback?code=...)
    const fullCallbackUrl = `${protocol}://${host}${req.originalUrl}`;

    console.log(fullCallbackUrl, "Full Callback URL passed to Xero");

    await xero.apiCallback(fullCallbackUrl);
    console.log("before updateTenants");
    await xero.updateTenants(); // Populates tenantIds
    console.log("after updateTenants");
    const tokenSet = xero.readTokenSet(); // { access_token, refresh_token, etc. }
    const tenantId = xero.tenants[0];
    console.log(tokenSet, tokenSet, "these are required");
    // Save the tokenSet & tenantId in your database against the user
    await User.findByIdAndUpdate(state, {
      xeroToken: JSON.stringify(tokenSet),
      tenantId: JSON.stringify(tenantId),
    });

    res.redirect("https://tradie-bot.vercel.app/xeroconnected");
  } catch (error) {
    console.error("Xero callback error", error);
    console.log(req.query.state, "req.query.state");
    res.status(500).json({ success: false, message: "Callback failed" });
  } // redirect to frontend
});

// exports.handleXeroCallback = catchAsyncError(async (req, res) => {
//   const { state } = req.query;

//   // Ensure state is passed into checks object
//   await xero.apiCallback(req.url, {
//     state,
//   });

//   await xero.updateTenants();

//   const tokenSet = xero.readTokenSet();
//   const tenantId = xero.tenantIds[0];

//   // Use state as the userId, since you passed it when generating the consent URL
//   const userId = state;

//   await User.findByIdAndUpdate(userId, {
//     xeroTokenSet: tokenSet,
//     xeroTenantId: tenantId,
//   });

//   // Redirect to frontend
//   res.redirect("https://peppy-swan-6fdd72.netlify.app/xeroconnected");
// });

// exports.handleXeroCallback = catchAsyncError(async (req, res) => {
//   try {
//     // Verify state parameter exists
//     if (!req.query.state) {
//       throw new Error("State parameter missing");
//     }

//     await xero.apiCallback(req.url);
//     await xero.updateTenants();

//     const tokenSet = xero.readTokenSet();
//     const tenantId = xero.tenantIds[0];
//     const userId = req.query.state;

//     await User.findByIdAndUpdate(userId, {
//       xeroTokenSet: tokenSet,
//       xeroTenantId: tenantId,
//     });

//     res.redirect("https://peppy-swan-6fdd72.netlify.app/xeroconnected");
//   } catch (error) {
//     console.error("Xero callback error:", error);
//     // Redirect to an error page or handle appropriately
//     // res.redirect("https://peppy-swan-6fdd72.netlify.app/xero-error");
//   }
// });
