const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const router = express.Router();

// Score order for fraud risk (called from frontend during checkout)
router.post('/score', protect, async (req, res) => {
  const { amount, item_count } = req.body;

  try {
    // Get user's past order count (real feature)
    const userOrderCount = await Order.countDocuments({ user: req.user.id });

    // Call Python model (adjust path if needed)
    const pythonPath = 'python3'; 
    const scriptPath = '../ml-fraud-detection/fraud_model.py';
    const command = `${pythonPath} ${scriptPath} ${amount} ${item_count} ${userOrderCount}`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Python error:', stderr);
      return res.status(500).json({ message: 'Fraud scoring error' });
    }

    const result = JSON.parse(stdout.trim());
    res.json(result);
  } catch (err) {
    console.error('Fraud scoring failed:', err);
    res.status(500).json({ message: 'Server error during fraud scoring' });
  }
});

module.exports = router;