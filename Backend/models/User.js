const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },

  // New fields for geo-fencing / location-based fraud detection
  lastLocation: {
    type: {
      lat: { type: Number },
      lng: { type: Number },
    },
    default: null,
  },
  lastLocationUpdated: {
    type: Date,
    default: null,
  },

  // NEW: Login rate limiting and lockout fields
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  loginAttemptsLastReset: { type: Date, default: Date.now },

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Match password for login + rate limiting logic
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Check if account is locked
  if (this.lockUntil && this.lockUntil > Date.now()) {
    const remaining = Math.ceil((this.lockUntil - Date.now()) / 60000);
    throw new Error(`Account locked due to too many failed attempts. Try again in ${remaining} minutes.`);
  }

  const isMatch = await bcrypt.compare(enteredPassword, this.password);

  if (isMatch) {
    // Successful login → reset counter
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    this.loginAttemptsLastReset = Date.now();
  } else {
    // Failed login → increment counter
    this.failedLoginAttempts += 1;

    // Reset counter if more than 10 minutes since last reset
    if (this.loginAttemptsLastReset && (Date.now() - this.loginAttemptsLastReset) > 10 * 60 * 1000) {
      this.failedLoginAttempts = 1;
      this.loginAttemptsLastReset = Date.now();
    }

    // Lock account after 3 failed attempts within 10 minutes
    if (this.failedLoginAttempts >= 3) {
      this.lockUntil = new Date(Date.now() + 60 * 60 * 1000); // Lock for 60 minutes
    }
  }

  await this.save(); // Save changes (attempts, lockUntil)

  return isMatch;
};

const User = mongoose.model('User', userSchema);

module.exports = User;