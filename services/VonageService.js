import { Vonage } from '@vonage/server-sdk'
const { WhatsAppText } = require('@vonage/messages');
// const vonage = new Vonage({
//   apiKey: process.env.VONAGE_API_KEY,
//   apiSecret: process.env.VONAGE_API_SECRET
// })

// const from = "14157386102"  
// const to = "RECIPIENT_PHONE_NUMBER"  
// const text = "Hello from Vonage over WhatsApp using Node.js!"

// export const sendWhatsApp=async(recipentNumber, message)=> {
//   try {
//     await vonage.messages.send({
//       to: {
//         type: 'whatsapp',
//         number: recipentNumber
//       },
//       from: {
//         type: 'whatsapp',
//         number: from
//       },
//       message: {
//         content: {
//           type: 'text',
//           text: message
//         }
//       }
//     })
//     console.log('Message sent successfully.')
//   } catch (err) {
//     console.error('Message failed with error:', err)
//   }
// }



const vonage = new Vonage(
  {
    applicationId: process.env.VONAGE_API_KEY,
    privateKey: process.env.VONAGE_API_SECRET,
  },
  { apiHost: 'https://messages-sandbox.nexmo.com' } // Sandbox URL
);


export const sendWhatsApp = async (toNumber) => {
  try {
    const { messageUUID } = await vonage.messages.send(
      new WhatsAppText({
        from: process.env.VONAGE_WHATSAPP_NUMBER,
        to: toNumber,
        text: 'Hello from Vonage!',
      })
    );
    console.log(`Message sent with UUID: ${messageUUID}`);
  } catch (error) {
    console.error('Error:', error.response?.body || error.message);
  }
};


