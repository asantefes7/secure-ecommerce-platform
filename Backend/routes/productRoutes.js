const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');

const router = express.Router();

// Get all products (public) with optional filters: ?category= & ?limit=
router.get('/', async (req, res) => {
  try {
    const { category, limit } = req.query;
    let query = {};

    // Filter by category if provided in URL (?category=Sneakers)
    if (category) {
      query.category = category;
    }

    // Build query
    let productsQuery = Product.find(query);

    // Apply limit if provided (?limit=6 for featured)
    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }

    const products = await productsQuery.exec();
    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (protected, admin only)
router.post('/', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

  const { name, description, price, countInStock, imageUrl, category } = req.body;
  try {
    const product = new Product({
      name,
      description,
      price,
      countInStock,
      imageUrl,
      category, // NEW: Added category field
      user: req.user.id
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE product by ID (admin only)
//router.delete('/delete-all', protect, async (req, res) => {
  //if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  //await Product.deleteMany({});
  //res.json({ message: 'All products deleted' });
//});

module.exports = router;