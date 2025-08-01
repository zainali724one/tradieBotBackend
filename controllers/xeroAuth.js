const { catchAsyncError } = require("../middlewares/catchAsyncError");
const User = require("../models/User");
const xero = require("../services/XeroClient");

exports.getConsentUrl = catchAsyncError(async (req, res, next) => {
  const { userId } = req.query;
  const url = await xero.buildConsentUrl();
  // res.send({ url });

  const modifiedUrl = `${url}&state=${userId}`;
  res.send({ url: modifiedUrl });
})




// 2. Handle callback
exports.handleXeroCallback = catchAsyncError(async (req, res) => {
  await xero.apiCallback(req.url);
  await xero.updateTenants();

  const tokenSet = xero.readTokenSet();
  const tenantId = xero.tenantIds[0];


// const userId = req.query.userId; 

 const userId = req.query.state;
  await User.findByIdAndUpdate(userId, {
    xeroTokenSet: tokenSet,
    xeroTenantId: tenantId,
  });

  res.redirect("https://peppy-swan-6fdd72.netlify.app/xeroconnected"); // redirect to frontend
})
