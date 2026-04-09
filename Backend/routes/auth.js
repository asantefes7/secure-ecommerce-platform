const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Otp = require('../models/Otp'); 
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const { protect } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

dotenv.config();

const router = express.Router();

// Register user (with strong password validation in frontend)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: user._id, name, email, isAdmin: user.isAdmin } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user - Step 1: Check credentials -> always send OTP
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Use matchPassword (which now handles lockout)
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // matchPassword already incremented failed attempts and set lock if needed
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Successful match → proceed with OTP
    const otp = generateOTP();
    const otpText = `Your login verification code is: ${otp}\n\n` +
                    `This code expires in 5 minutes. Do not share it.`;

    await sendEmail(user.email, 'Secure E-Commerce Login Verification Code', otpText);

    await Otp.create({
      email: user.email,
      otp,
      type: 'login',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    console.log('LOGIN OTP sent to:', user.email, 'Code:', otp);

    res.json({ otpRequired: true, message: 'Verification code sent to your email' });
  } catch (err) {
    console.error('Login error:', err);

    // Catch lockout error and return specific message
    if (err.message.includes('Account locked')) {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify OTP - Step 2: Validate code from DB -> return token & user
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  console.log('VERIFY - Entered OTP:', otp);
  console.log('VERIFY - For email:', email);

  try {
    const otpRecord = await Otp.findOne({ email, otp, type: 'login' });

    if (!otpRecord) {
      console.log('VERIFY - No matching OTP record found');
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (otpRecord.expiresAt < new Date()) {
      console.log('VERIFY - OTP expired');
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    await Otp.deleteOne({ _id: otpRecord._id });
    console.log('VERIFY - OTP validated and deleted');

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({ token, user: { id: user._id, name: user.name, email, isAdmin: user.isAdmin } });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Create new admin (admin-only)
router.post('/create-admin', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    user = new User({ name, email, password, isAdmin: true });
    await user.save();
    res.status(201).json({ message: 'Admin created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password - Send reset OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const otp = generateOTP();
    const otpText = `Your password reset code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it.`;

    await sendEmail(user.email, 'Secure E-Commerce Password Reset Code', otpText);

    await Otp.create({
      email: user.email,
      otp,
      type: 'reset',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log('RESET OTP sent to:', user.email, 'Code:', otp);

    res.json({ message: 'Reset code sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpRecord = await Otp.findOne({ email, otp, type: 'reset' });

    if (!otpRecord) return res.status(400).json({ message: 'Invalid code' });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    res.json({ message: 'OTP verified' });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password (after OTP verify)
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const otpRecord = await Otp.findOne({ email, otp, type: 'reset' });

    if (!otpRecord) return res.status(400).json({ message: 'Invalid code' });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Favorite (add/remove product from user's favorites)
router.post('/favorites/:productId', protect, async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const isFavorited = user.favorites.includes(productId);

    if (isFavorited) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id.toString() !== productId);
      await user.save();
      return res.json({ message: 'Removed from favorites', favorited: false });
    } else {
      // Add to favorites
      user.favorites.push(productId);
      await user.save();
      return res.json({ message: 'Added to favorites', favorited: true });
    }
  } catch (err) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User's Favorites (populated with product details)
router.get('/favorites', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favorites', 'name description price imageUrl category'); // Populate product details

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.favorites);
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;