const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const router = express.Router();

// Helper: Calculate distance between two lat/lng points (km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

router.post('/score', protect, async (req, res) => {
  const { amount, item_count, location } = req.body; // location = { lat, lng }

  if (!amount || !item_count) {
    return res.status(400).json({ message: 'Amount and item_count required' });
  }

  try {
    // Get user's past order count
    const userOrderCount = await Order.countDocuments({ user: req.user.id });

    // Get user's last known location
    const currentUser = await User.findById(req.user.id);
    let geoFlag = false;
    let geoDistance = null;

    if (location && currentUser.lastLocation) {
      geoDistance = getDistance(
        currentUser.lastLocation.lat,
        currentUser.lastLocation.lng,
        location.lat,
        location.lng
      );
      geoFlag = geoDistance > 500; // Flag if > 500 km from last location
    }

    // Call Python model with 3 args (we'll add geo later)
    const pythonPath = 'python3';
    const scriptPath = '../ml-fraud-detection/fraud_model.py';
    const command = `${pythonPath} ${scriptPath} ${amount} ${item_count} ${userOrderCount}`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Python error:', stderr);
      return res.status(500).json({ message: 'Fraud scoring error', details: stderr });
    }

    const mlResult = JSON.parse(stdout.trim());

    // Combine ML + geo signals
    const finalScore = mlResult.score + (geoFlag ? 30 : 0); // Boost score if geo mismatch
    const isFraud = finalScore > 70 || geoFlag;

    const result = {
      score: Math.min(100, finalScore),
      is_fraud: isFraud,
      reason: mlResult.reason,
      geo_distance_km: geoDistance ? Math.round(geoDistance) : null,
      geo_flag: geoFlag,
    };

    // Update user's last location if provided
    if (location) {
      await User.findByIdAndUpdate(req.user.id, {
        lastLocation: { lat: location.lat, lng: location.lng },
        lastLocationUpdated: new Date(),
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Fraud scoring failed:', err);
    res.status(500).json({ message: 'Server error during fraud scoring', details: err.message });
  }
});

module.exports = router;