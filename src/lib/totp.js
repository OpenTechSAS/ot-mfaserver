const { authenticator } = require('otplib');

authenticator.options = {
  window: parseInt(process.env.TOTP_WINDOW || '1', 10),
  step: 30,
  digits: 6,
};

function generateSecret() {
  return authenticator.generateSecret();
}

function generateKeyUri(userId, secret) {
  const issuer = process.env.TOTP_ISSUER || 'Protheus-SAI';
  return authenticator.keyuri(userId, issuer, secret);
}

function verify(token, secret) {
  return authenticator.check(token, secret);
}

module.exports = { generateSecret, generateKeyUri, verify };
