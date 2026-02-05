const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

router.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  console.log('Received amount:', amount);  // Log incoming amount
  console.log('Stripe key loaded:', process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No');  // Check key

  if (!amount || typeof amount !== 'number' || amount < 50) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    console.log('Payment intent created:', paymentIntent.id);  // Success log
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);  // Detailed error
    res.status(500).json({ message: 'Payment intent creation failed', error: err.message });
  }
});

module.exports = router;