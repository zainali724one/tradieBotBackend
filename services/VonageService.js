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
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0Q1bUiSSrOpuo
+rwX2hszQA7tL5Rp5k1KlSAqL0yRUp5FZ0x7qVAR1LxujivzDOIeOa43WtBgZiJT
NfgncwN/rkzsGCxu1ZjqNf8cNpgt66oW0f2RMekAoUHqTERuXl9pP++SuXGMfliS
b/c6fBB6+YhEb67Crc71pwGXQi5MBCWHmHeNfjV/0vpAhWST2h1DWAQ6BIRoRfm2
DxrZL7YFH0/vv6rzk7AHG9CzFDHKIphReWmJehXbadUlG7Zj80MTzJ5znV4ui6ws
S0jtJcCXEg9KjgpYhQ51KQq6OpFOBdync7hMk2aJSqrDnRbmKfzN+PRgK+dhqY7K
CdCxXCCvAgMBAAECggEAHs/LzbRLYkE4Th/deq47K/1tD7msQpWs7Gyk/NDs44Id
r3tCpXiBSSr1smf2tyqik8wELU4GhBOxFkwJSKTuGiru1wQixCcaZh4opufmByNb
BV+LWgAP9Z2aqLO0lrDm2hSlnIy6DeuitBUTSxndr0drtVbppjkTQQX0zafwRem9
6cdri27o8YbDYe59rBWuA1XawK5iDEn0Hfi4UaA1M5Esj8shFRgcDcS64wTe1bRu
xvVOFmrc/H6EpQDgKdACbMH6goqxh09nTlIAn9q4/MJfTAtJP2+0dSc7kDhXMPpL
/1eFscEz3kj3G1VND99qljKsf3dexBXmrajWDiFfMQKBgQDmfq4WdpDS+cWl3Y7z
l81K1Z3z/iBaWTZ2wE7qNrOOmrBlshmApOgepldEqmRo0vF57GkNV4cbYjh5XDgf
kSq7clTcb6fgBxAIVck//SRHv+EELjn2F4evaaADp/50hv51v4rvAPA/aCYdIUJc
U307Lqc4A9JrlePmhJUrXIq7mwKBgQDINbkIN6R5mGMNtYLEqMnQiA57CXOSzUoY
+Bu7ksu1nNaqOunta/DJUziIv7MURrEKBhWvERCQW8T2mjA2L1WSz6rfwh1Yz+83
eZprns0HIrZ1UnoTvA33C0Sih79ZIAfKgf7iZ5bGbVDbPIMIVoO/WImSoLqakZKt
cjaJqDLyfQKBgArUMsudYGp5D58eTKQHIr78UEJxUwXLoTJtEIgSb9coT1dHycjw
dnNSL1Fri/IczvmCcOEOlqtjrvGMsppREKfj1DbTDBkLW+Z4WU8nTngMfL7ciR6V
tms4VCs3zk2dNgFEMXvPGHpyIzBFKr/5sC2CoJqSG2Wwkhd3bSavX1k3AoGAS5y2
f9r73AxoRHIrq/gPGBl6Vo9QPb4YYOu7FZEwLCvKisnrNQaSDobGkCbODDdSf3Wi
1NY+CjcOYRAEa0JfMC4L26vlB3ioYKwlXMXBqxM6E38NqcxY/dccmcFoy9EkACAu
UfVLZS893T6yQgDiiu52LpFTSDL4UVcUL9L9QsUCgYEAxVbJ4CfYQwCZMUnTHYHJ
wnykIJXMM0UZ//gU+V71nJwCABgkbLuLCZhnh16goNmkQWIZnHRyD5CtnxGIt3Au
zhiCoxmVuDN1ven+vn0Urh9PHnCSZX3I9bkg6+gvsWh61JXJsfY8yjjfG7O1jCzP
pmBOjFw8bDteA5sjWYuHntc=
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
        from: 447515968653,
        to: toNumber,
        text: 'Hello from Vonage!',
      })
    );
    console.log(`Message sent with UUID: ${messageUUID}`);
  } catch (error) {
    console.error('Error:', error.response?.body || error.message);
  }
};


