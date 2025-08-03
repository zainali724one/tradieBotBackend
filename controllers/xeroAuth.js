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



exports.handleXeroCallback = catchAsyncError(async (req, res) => {
  const { state } = req.query;

  // Ensure state is passed into checks object
  await xero.apiCallback(req.url, {
    state,
  });

  await xero.updateTenants();

  const tokenSet = xero.readTokenSet();
  const tenantId = xero.tenantIds[0];

  // Use state as the userId, since you passed it when generating the consent URL
  const userId = state;

  await User.findByIdAndUpdate(userId, {
    xeroTokenSet: tokenSet,
    xeroTenantId: tenantId,
  });

  // Redirect to frontend
  res.redirect("https://peppy-swan-6fdd72.netlify.app/xeroconnected");
});


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

