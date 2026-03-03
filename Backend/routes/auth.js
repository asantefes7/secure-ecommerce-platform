const express = require('express');
const User = require('../models/User');
const Otp = require('../models/otp'); 
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const { protect } = require('../middleware/authMiddleware');

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

// Login user - Step 1: Check credentials → always send OTP
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Always require OTP for login
    const otp = generateOTP();
    const otpText = `Your login verification code is: ${otp}\n\n` +
                    `This code expires in 5 minutes. Do not share it.`;

    await sendEmail(user.email, 'Secure E-Commerce Login Verification Code', otpText);

    // Store OTP in DB with expiry
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
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify OTP - Step 2: Validate code from DB → return token & user
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

    // OTP valid → delete it
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log('VERIFY - OTP validated and deleted');

    // Generate token
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

module.exports = router;