const twilio = require("twilio");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Send WhatsApp message with quote and Stripe link
 * @param {string} phoneNumber - Recipient's phone number (e.g., +12345678900)
 */
const sendWhatsAppMessage = async (phoneNumber, messageBody) => {
  return client.messages
    .create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: messageBody,
    })
    .then((res) => {
      console.log(res, "res");
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = sendWhatsAppMessage;
