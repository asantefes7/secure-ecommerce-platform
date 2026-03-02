const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

// Helper: Calculate distance between two lat/lng points (km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

router.post('/score', protect, async (req, res) => {
  const { amount, item_count, location } = req.body;

  if (!amount || !item_count) {
    return res.status(400).json({ message: 'Amount and item_count required' });
  }

  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      console.log('User not found in /score');
      return res.status(404).json({ message: 'User not found' });
    }

    const userOrderCount = await Order.countDocuments({ user: userId });

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrders = await Order.countDocuments({
      user: userId,
      createdAt: { $gte: fiveMinAgo },
    });
    const velocityFlag = recentOrders >= 3;

    let geoDistance = null;
    let geoFlag = false;

    if (location && currentUser.lastLocation) {
      geoDistance = getDistance(
        currentUser.lastLocation.lat,
        currentUser.lastLocation.lng,
        location.lat,
        location.lng
      );
      geoFlag = geoDistance > 500;
    }

    const pythonPath = 'python3';
    const scriptPath = '../ml-fraud-detection/fraud_model.py';
    const command = `${pythonPath} ${scriptPath} ${amount} ${item_count} ${userOrderCount}`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Python error:', stderr);
      return res.status(500).json({ message: 'Fraud scoring error', details: stderr });
    }

    const mlResult = JSON.parse(stdout.trim());

    let finalScore = mlResult.score || 0;
    let reasons = [mlResult.reason || 'No ML reason provided'];

    if (velocityFlag) {
      finalScore += 40;
      reasons.push(`High velocity (${recentOrders} orders in last 5 min)`);
    }

    if (geoFlag) {
      finalScore += 30;
      reasons.push(`Location mismatch (${Math.round(geoDistance)}km from last)`);
    }

    const isFraud = finalScore > 70 || velocityFlag || geoFlag;

    let otp = null;
    let otpSent = false;

    if (isFraud) {
      otp = generateOTP();
      const otpText = `Your verification code for high-risk checkout is: ${otp}\n\nThis code expires in 5 minutes. Do not share it.`;
      await sendEmail(currentUser.email, 'Secure E-Commerce Verification Code', otpText);
      otpSent = true;

      try {
        const newOtp = await Otp.create({
          email: currentUser.email,
          otp,
          type: 'checkout',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
        console.log('CHECKOUT OTP saved to DB successfully:', {
          id: newOtp._id.toString(),
          email: newOtp.email,
          otp: newOtp.otp,
          type: newOtp.type,
          expiresAt: newOtp.expiresAt.toISOString()
        });

        // Short delay to ensure DB write is visible to next query
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (otpErr) {
        console.error('OTP save error in /score:', otpErr.message, otpErr.stack);
      }
    }

    const result = {
      score: Math.min(100, Math.round(finalScore)),
      is_fraud: isFraud,
      reason: reasons.join(', ') || 'No specific reason',
      velocity_flag: velocityFlag,
      recent_orders: recentOrders,
      geo_distance_km: geoDistance ? Math.round(geoDistance) : null,
      geo_flag: geoFlag,
      otp_sent: otpSent,
    };

    if (location) {
      await User.findByIdAndUpdate(userId, {
        lastLocation: { lat: location.lat, lng: location.lng },
        lastLocationUpdated: new Date(),
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Fraud scoring failed:', err.message, err.stack);
    res.status(500).json({ message: 'Server error during fraud scoring', details: err.message });
  }
});

// Verify OTP for high-risk checkout
router.post('/verify-otp', protect, async (req, res) => {
  let { otp } = req.body;

  // Trim and clean the entered OTP
  otp = (otp || '').trim().replace(/\s+/g, ''); // Remove all whitespace

  console.log('VERIFY OTP - Cleaned entered OTP:', otp);
  console.log('VERIFY OTP - Entered OTP length:', otp.length);

  try {
    const userId = req.user.id; // From JWT (this works, like in /score)
    const currentUser = await User.findById(userId); // NEW: Fetch user to get email (missing before)

    if (!currentUser) {
      console.log('User not found in /verify-otp');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('VERIFY OTP - Searching for:', {
      email: currentUser.email, // NEW: Use fetched email
      otp,
      type: 'checkout'
    });

    const otpRecord = await Otp.findOne({
      email: currentUser.email, // NEW: Use fetched email
      otp,  // Already trimmed
      type: 'checkout'
    });

    if (!otpRecord) {
      console.log('No matching OTP record found for checkout');
      return res.status(400).json({ message: 'Invalid code' });
    }

    console.log('Found OTP record:', {
      id: otpRecord._id.toString(),
      email: otpRecord.email,
      savedOtp: otpRecord.otp,
      expiresAt: otpRecord.expiresAt.toISOString()
    });

    if (otpRecord.expiresAt < new Date()) {
      console.log('OTP expired for checkout');
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    await Otp.deleteOne({ _id: otpRecord._id });
    console.log('OTP validated and deleted for checkout');

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP verification failed:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;