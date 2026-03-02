const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['login', 'checkout'], required: true },
  expiresAt: { type: Date, required: true, expires: 300 }, // Auto-expire in 5 min
}, { timestamps: true });

// Prevent overwrite error when nodemon restarts
const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

module.exports = Otp;