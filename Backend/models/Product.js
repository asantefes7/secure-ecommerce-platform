const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  countInStock: { type: Number, required: true, default: 0 },
  imageUrl: { type: String },
  category: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links to creator/admin

  // Sizes and Colors for user selection
  sizes: [{ type: String }], // e.g., ["7", "8", "9", "10", "11", "12"]
  colors: [{ type: String }], // e.g., ["Black", "White", "Red", "Blue"]

}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;