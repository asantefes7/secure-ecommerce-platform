const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const sendEmail = require('../utils/sendEmail'); // Added for emails

const router = express.Router();

// Save order after payment (called from frontend)
router.post('/', protect, async (req, res) => {
  const { items, total, isFlagged, flaggedReason, paymentIntentId } = req.body;

  try {
    console.log('Received order data:', { isFlagged, flaggedReason });

    const order = new Order({
      user: req.user.id,
      items,
      total,
      isFlagged,
      flaggedReason: flaggedReason || [], 
      paymentIntentId,
    });

    await order.save();
    console.log('Order saved with ID:', order._id, 'Reasons saved:', order.flaggedReason);

    res.status(201).json(order);
  } catch (err) {
    console.error('Order save error:', err);
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
      .sort({ createdAt: -1 }); 
    res.json(userOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (admin only)
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

//Send order confirmation email (called after purchase)
router.post('/:id/send-confirmation-email', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order || order.user._id.toString() !== req.user.id) return res.status(404).json({ message: 'Order not found' });

    const itemsList = order.items.map(item => `${item.name} x ${item.qty} ($${item.price.toFixed(2)})`).join('\n');
    const emailText = `Dear ${order.user.name},\n\nThank you for your purchase! Your order ID: ${order._id}\n\nItems:\n${itemsList}\n\nTotal: $${order.total.toFixed(2)}\nStatus: Pending\n\nWe'll update you when it ships!`;

    await sendEmail(order.user.email, 'Order Confirmation', emailText);

    console.log('Confirmation email sent to:', order.user.email, 'for order:', order._id);

    res.json({ message: 'Confirmation email sent' });
  } catch (err) {
    console.error('Confirmation email error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

//Send status update email (admin-only)
router.post('/:id/send-status-email', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

  const { newStatus } = req.body;
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const emailText = `Dear ${order.user.name},\n\nYour order ID: ${order._id} status has been updated to ${newStatus}.\n\nThank you!`;

    await sendEmail(order.user.email, 'Order Status Update', emailText);

    console.log('Status email sent to:', order.user.email, 'for order:', order._id);

    res.json({ message: 'Status email sent' });
  } catch (err) {
    console.error('Status email error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;