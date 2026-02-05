const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    qty: Number,
    price: Number,
  }],
  total: { type: Number, required: true },
  isFlagged: { type: Boolean, default: false },  // Fraud flag
  paymentIntentId: String,  // From Stripe
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;