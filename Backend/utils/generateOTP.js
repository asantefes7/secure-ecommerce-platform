// Generate OTP for Verification
const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-digit hex code
};

module.exports = generateOTP;