const { catchAsyncError } = require("../middlewares/catchAsyncError");
const User = require("../models/User");
const xero = require("../services/XeroClient");

exports.getConsentUrl = catchAsyncError(async (req, res, next) => {
  // const { userId } = req.query;
  // const userId="6868056c5717c3a1bc283e1d"
  const url = await xero.buildConsentUrl();
  // res.send({ url });

  const modifiedUrl = `${url}&state=6868056c5717c3a1bc283e1d`;
  res.send({ url: modifiedUrl });
})




// 2. Handle callback
// exports.handleXeroCallback = catchAsyncError(async (req, res) => {
//   await xero.apiCallback(req.url);
//   await xero.updateTenants();

//   const tokenSet = xero.readTokenSet();
//   const tenantId = xero.tenantIds[0];


// // const userId = req.query.userId; 

//  const userId = req.query.state;
//   await User.findByIdAndUpdate(userId, {
//     xeroTokenSet: tokenSet,
//     xeroTenantId: tenantId,
//   });

//   res.redirect("https://peppy-swan-6fdd72.netlify.app/xeroconnected"); // redirect to frontend
// })



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








exports.handleXeroCallback = catchAsyncError(async (req, res) => {
  try {
    // 1. Verify required parameters exist
    if (!req.query.code || !req.query.state) {
      throw new Error("Missing required OAuth parameters");
    }

    console.log('Received Xero callback with state:', req.query.state);

    // 2. Construct proper callback URL (Vercel/Serverless compatible)
    const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    // 3. Exchange authorization code for tokens
    await xero.apiCallback(callbackUrl);
    
    // 4. Update tenant information (requires accounting.settings scope)
    await xero.updateTenants();
    
    // 5. Get the token set and verify
    const tokenSet = xero.readTokenSet();
    if (!tokenSet || !tokenSet.access_token) {
      throw new Error("Failed to obtain access token");
    }

    // 6. Get the first authorized tenant
    const [tenantId] = xero.tenantIds;
    if (!tenantId) {
      throw new Error("No authorized tenants found");
    }

    // 7. Save tokens to user in database
    const userId = req.query.state;
    await User.findByIdAndUpdate(userId, {
      xeroToken: tokenSet,
      tenantId: tenantId,
      xeroRefreshToken: tokenSet.refresh_token, // Store separately for easy access
    });

    // 8. Redirect to success page
    res.redirect("https://peppy-swan-6fdd72.netlify.app/xeroconnected");

  } catch (error) {
    console.error("Xero callback error:", error);
  }
});

// Helper to refresh tokens (for later use)
exports.refreshXeroToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user.xeroRefreshToken) {
    throw new Error("No refresh token available");
  }

  const newXero = new XeroClient({
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
  });

  const newTokenSet = await newXero.refreshWithRefreshToken(
    process.env.XERO_CLIENT_ID,
    process.env.XERO_CLIENT_SECRET,
    user.xeroRefreshToken
  );

  // Update user with new tokens
  await User.findByIdAndUpdate(userId, {
    xeroTokenSet: newTokenSet,
    xeroRefreshToken: newTokenSet.refresh_token,
  });

  return newTokenSet;
};