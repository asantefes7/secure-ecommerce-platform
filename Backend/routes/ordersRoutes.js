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

// Get all orders for the logged-in user
router.get('/my-orders', protect, async (req, res) => {
  try {
    const userOrders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 }); // Newest first
    res.json(userOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: Update order status (admin only)
router.patch('/:id/status', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

  const { status } = req.body;
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json(order); // Return updated order
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;