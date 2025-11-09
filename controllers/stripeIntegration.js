// /api/quote-payment/:quoteId

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const job = require("../models/job");
const quote = require("../models/quote");
const User = require("../models/User");

exports.getStripeData = catchAsyncError(async (req, res) => {
  const { quoteId } = req.params;

  const singlequote = await quote.findById(quoteId);
  if (!singlequote) return res.status(404).json({ error: "Quote not found" });

  if (!singlequote.paymentIntentId) {
    return res.status(400).json({ error: "No payment intent for this quote" });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(
    singlequote.paymentIntentId
  );
  res.json({
    clientSecret: paymentIntent.client_secret,
    quoteAmount: singlequote.quoteAmount,
    customerName: singlequote.customerName,
  });
});

exports.stripeWebhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const quoteId = paymentIntent.metadata.quoteId;

    try {
      await quote.findByIdAndUpdate(quoteId, { isPaid: true });
      await job.findOneAndUpdate({ quoteId: quoteId }, { status: "Completed" });
      console.log(`Quote ${quoteId} marked as paid.`);
    } catch (err) {
      console.error("Failed to update quote:", err);
    }
  }

  res.status(200).json({ received: true });
};

exports.stripeCallback = async (req, res) => {
  const { code, state: userId } = req.query;

  try {
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const stripeAccountId = response.stripe_user_id;

    await User.findByIdAndUpdate(userId, { stripeAccountId });

    res.send("Stripe account connected successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Stripe connection failed.");
  }
};
