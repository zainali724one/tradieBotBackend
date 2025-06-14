// /api/quote-payment/:quoteId

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const quote = require("../models/quote");

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
    const quoteId = paymentIntent.metadata.quote_id;

    try {
      await quote.findByIdAndUpdate(quoteId, { isPaid: true });
      console.log(`Quote ${quoteId} marked as paid.`);
    } catch (err) {
      console.error("Failed to update quote:", err);
    }
  }

  res.status(200).json({ received: true });
};
