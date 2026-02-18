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
    const userId = req.user.id;

    // 1. Lifetime order count
    const userOrderCount = await Order.countDocuments({ user: userId });

    // 2. Velocity: orders in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrders = await Order.countDocuments({
      user: userId,
      createdAt: { $gte: fiveMinAgo },
    });
    const velocityFlag = recentOrders >= 3; // Flag if 3+ orders in 5 min

    // 3. Geo distance (if previous location exists)
    const currentUser = await User.findById(userId);
    let geoDistance = null;
    let geoFlag = false;

    if (location && currentUser.lastLocation) {
      geoDistance = getDistance(
        currentUser.lastLocation.lat,
        currentUser.lastLocation.lng,
        location.lat,
        location.lng
      );
      geoFlag = geoDistance > 500; // >500km = suspicious
    }

    // 4. Call Python ML model
    const pythonPath = 'python3';
    const scriptPath = '../ml-fraud-detection/fraud_model.py';
    const command = `${pythonPath} ${scriptPath} ${amount} ${item_count} ${userOrderCount}`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Python error:', stderr);
      return res.status(500).json({ message: 'Fraud scoring error', details: stderr });
    }

    const mlResult = JSON.parse(stdout.trim());

    // 5. Combine all signals into final score
    let finalScore = mlResult.score;
    let reasons = [mlResult.reason];

    if (velocityFlag) {
      finalScore += 40; // Big boost for rapid orders
      reasons.push(`High velocity (${recentOrders} orders in last 5 min)`);
    }

    if (geoFlag) {
      finalScore += 30;
      reasons.push(`Location mismatch (${Math.round(geoDistance)}km from last)`);
    }

    const isFraud = finalScore > 70 || velocityFlag || geoFlag;

    const result = {
      score: Math.min(100, finalScore),
      is_fraud: isFraud,
      reason: reasons.join(', '),
      velocity_flag: velocityFlag,
      recent_orders: recentOrders,
      geo_distance_km: geoDistance ? Math.round(geoDistance) : null,
      geo_flag: geoFlag,
    };

    // Update user's last location if provided
    if (location) {
      await User.findByIdAndUpdate(userId, {
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