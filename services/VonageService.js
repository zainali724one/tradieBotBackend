import { Vonage } from '@vonage/server-sdk'

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
})

const from = "+14157386102"  // Must be WhatsApp-enabled
const to = "RECIPIENT_PHONE_NUMBER"  // Include country code, e.g., "923001234567"
const text = "Hello from Vonage over WhatsApp using Node.js!"

export const sendWhatsApp=async(recipentNumber, message)=> {
  try {
    await vonage.messages.send({
      to: {
        type: 'whatsapp',
        number: recipentNumber
      },
      from: {
        type: 'whatsapp',
        number: from
      },
      message: {
        content: {
          type: 'text',
          text: message
        }
      }
    })
    console.log('Message sent successfully.')
  } catch (err) {
    console.error('Message failed with error:', err)
  }
}



