const crypto = require('crypto');

// Store these in your .env file!
// ENCRYPTION_KEY must be 32 characters long
// IV_LENGTH is usually 16
const ENGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return null;
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv(ENGORITHM, KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // Return format: iv:encryptedData
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return null;
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv(ENGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };