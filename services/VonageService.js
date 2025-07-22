const  {Vonage} = require('@vonage/server-sdk')
const { WhatsAppText } = require('@vonage/messages');
const fs = require('fs');
// const privatekey from ""
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

const privateKeyStrinng=`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJBNMfYIrMVMkW
Z5LrMx5/vpaP0CTaeK49v76Jlqlk0tKuoyCaKfm7+zA61jNmCuRZ6VAEN4gs8UHb
KuJ12XXnM0ChF3Of0pcATJ1NklOw2HkSXSLdJMbk45fF79eWnyyigd+Kjl/rsDmz
WhNtdg5vmk7R0ZYrodbFQg8XOt6CEoaiNYvEetjR6DguqJrqsJMLr3AeX9QMBQvl
NdNo92CYILSx/LOtU+AUiydFLf3Z2I6dqnprXEPQfDK/ZJGOA5XiskWQKlqbJiG5
Y/JmrCqxtMCWIkWkTbh9ho8nbMQ7TWL90nqouCP3i8DJdf1HU9/uHMaiXwFPK8WA
irGsNp0tAgMBAAECggEAJVy9NObHxYS4v25O02Jz98Bf0akZQHYPxLBf5MjZAUFi
IU12oNDOdw8P/s+TTBMYMFH6Kl579AZ/fBHzd34MuQVArPBj8D+/CzIyRpm87nC9
yBkBguL0CNT4f7S9eGRrcmT7PJCL6Y2em+RRGhZIRpwCrGLtK3zwI0fM8D9j3f7o
xLDk98PR6FCMKr6j98LEuNS8ZxoS1NDoUQci4kACYikNDJvfcRDVHJAoN90tM8vq
L99aRjcVPsTK3+zFUhMIr/yXOV7yIjZrbOfPBBIdp5EalQpNSiWRoNtz5KoSvJQ+
vaS486PYFQntAxuEv3JPTdy/0lC6piNqnLw7M377rQKBgQD6TnuagMR0RF5XtPO6
l0U5E2/Qa2jaA7rd/U9B5X9B2xJtCIFssKYHqMWYRjYhHNfPS3al8tt0l+dL9MIp
zIUDUa7bMmr0fJ/BoiUfjFHJCOFPEgl2MS8LFcMywOgjsmFIbvLsxHFaDIWyTDil
ebMqoBrmMtLhVZSUx7c2jnSJxwKBgQDNl1fNpiLtk5pNL9Ew+mZRgjCtIcYdd974
4gxxE8UGzB2Ii+8pCj/338a4FRxzR2SeCSNpwkNTtgxjC8rgqoQgN1SuZZqsOfXq
qmr7CekGbymF8NvghstKDVlhe+R0Ai/ai3AXlUfIR//wlQ+dThQSd23tp1WL1WYq
GUCZXU7BawKBgQD3ySvJJkHUSz4Nmx9QDqHDP7+H1lyEvf6F9VY5iKPyoJjcAPiG
jVS+7k81UAQTwYbOOgkpfIHNKPcalSCE2maug3USnxWME7beq9IOKg1ocvcAHH3r
WAMW+SM0Ig1sEREG8HZg9pKzrwPHHndRMGmx/67BRXzG/r5IjnCLfHhXTwKBgHJh
CcNq87GzVbwtpzeVh8k/Ii+gQ6VvZEiZEozyj8IZWzD1kUgG4NHZ2KffbuWfyZW2
xdH39xciiD+udt+JXlrCDcW811GMKYm16DDkMZWX0MUo3FtNAtqfFKQMlmwIL3Fp
9CHatoXxsK27cGV24+nmMe1vFEPopJ81T2BDriYjAoGBAJ6RKe2JDmoJ+pyPhYCZ
pFgtzNH7+QxIUE9Ym5EhS1xrkcKTv8wXkMjv6BhlAyjZLpqp792HIcDd/aPxAKi/
Lrst6ZA/2gAfxHj5Gt53wVIod+18qGa9TH5rEDx7X9CcdEL7pDVkFsx/NiXQQ2pI
r+WsRiXqXSO3hcLd7Zpw4QR3
-----END PRIVATE KEY-----`

const vonage = new Vonage(
  {
    applicationId: "8bbd8401-5ada-4118-8ccd-9679364e149f",
    privateKey: privateKeyStrinng.trim(),
  },
  { apiHost: 'https://messages-sandbox.nexmo.com' } // Sandbox URL
);


export const sendWhatsApp = async (toNumber) => {
  try {
    const { messageUUID } = await vonage.messages.send(
      new WhatsAppText({
        from: 14157386102,
        to: toNumber,
        text: 'Hello from Vonage!',
      })
    );
    console.log(`Message sent with UUID: ${messageUUID}`);
  } catch (error) {
    console.error('Error:', error.response?.body || error.message);
  }
};


