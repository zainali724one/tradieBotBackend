const { verifySignature } = require("@vonage/jwt");

const verifyJWT = (req) => {
  // Verify if the incoming message came from Vonage
  const jwtToken = req.headers.authorization.split(" ")[1];
  if(!verifySignature(jwtToken, process.env.VONAGE_API_SECRET)) {
    console.error("Unauthorized request");
    throw new Error('Not a messages API request');
  }

  console.log('JWT verified');

}

module.exports = { verifyJWT };
