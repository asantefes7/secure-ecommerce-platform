const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const router = express.Router();

// Score order for fraud risk
router.post('/score', protect, async (req, res) => {
  const { amount, item_count } = req.body;

  if (!amount || !item_count) {
    return res.status(400).json({ message: 'Amount and item_count required' });
  }

  try {
    // Get real user past order count from DB
    const userOrderCount = await Order.countDocuments({ user: req.user.id });

    // Build command (adjust python3 to python if needed on your system)
    const pythonPath = 'python3';
    const scriptPath = '../ml-fraud-detection/fraud_model.py';
    const command = `${pythonPath} ${scriptPath} ${amount} ${item_count} ${userOrderCount}`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Python stderr:', stderr);
      return res.status(500).json({ message: 'Fraud scoring error', details: stderr });
    }

    const result = JSON.parse(stdout.trim());
    res.json(result);
  } catch (err) {
    console.error('Fraud scoring failed:', err);
    res.status(500).json({ message: 'Server error during fraud scoring', details: err.message });
  }
});

module.exports = router;