const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (protected, admin only)
router.post('/', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

  const { name, description, price, countInStock, imageUrl } = req.body;
  try {
    const product = new Product({ name, description, price, countInStock, imageUrl, user: req.user.id });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;