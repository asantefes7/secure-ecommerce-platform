const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');

const router = express.Router();

// Save order after payment (called from frontend)
router.post('/', protect, async (req, res) => {
  const { items, total, isFlagged, paymentIntentId } = req.body;

  try {
    const order = new Order({
      user: req.user.id,
      items,
      total,
      isFlagged,
      paymentIntentId,
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Order save failed' });
  }
});

// Get flagged orders (admin only)
router.get('/flagged', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

  try {
    const flaggedOrders = await Order.find({ isFlagged: true }).populate('user', 'name email').populate('items.product', 'name');
    res.json(flaggedOrders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;