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

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Match password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log('Entered pass for match:', enteredPassword); // NEW: Debug entered
  console.log('Stored hashed pass:', this.password); // NEW: Debug stored
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;