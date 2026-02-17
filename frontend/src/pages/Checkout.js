import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [fraudScore, setFraudScore] = useState(null); // Store ML score

  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const total = Math.round(cartItems.reduce((acc, item) => acc + item.price * item.qty, 0) * 100); // Integer cents

  useEffect(() => {
    if (total > 0) {
      // Step 1: Get Stripe payment intent
      axios.post('http://localhost:5001/api/checkout/create-payment-intent', { amount: total })
        .then(res => setClientSecret(res.data.clientSecret))
        .catch(err => toast.error('Failed to initialize payment'));
    }
  }, [total]);

  const getFraudScore = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:5001/api/fraud/score', {
        amount: total / 100,
        item_count: cartItems.length,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFraudScore(res.data);
      return res.data;
    } catch (err) {
      console.error('Fraud scoring failed:', err);
      toast.error('Unable to check fraud risk');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Step 2: Get ML fraud score before payment
    const fraud = await getFraudScore();
    if (!fraud) {
      setLoading(false);
      return;
    }

    if (fraud.is_fraud) {
      const confirm = window.confirm(
        `High fraud risk detected (score: ${fraud.score}%). Proceed with payment?`
      );
      if (!confirm) {
        setLoading(false);
        return;
      }
    }

    if (!stripe || !elements || !clientSecret) {
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
    } else if (paymentIntent.status === 'succeeded') {
      const isSuspicious = total / 100 > 100 || cartItems.length > 5;

      // Save order
      try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5001/api/orders', {
          items: cartItems.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.price,
          })),
          total: total / 100,
          isFlagged: isSuspicious || fraud.is_fraud,
          paymentIntentId: paymentIntent.id,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Order save failed', err);
        // Still continue - optional toast
      }

      toast.success('Payment successful! Order placed.');
      localStorage.removeItem('cartItems');
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Checkout</h2>
      <p><strong>Total:</strong> ${(total / 100).toFixed(2)}</p>

      {/* Show fraud score if available */}
      {fraudScore && (
        <div style={{ margin: '10px 0', padding: '10px', background: fraudScore.is_fraud ? '#ffebee' : '#e8f5e9', borderRadius: '4px' }}>
          <strong>Fraud Risk Score:</strong> {fraudScore.score}%  
          {fraudScore.is_fraud ? ' (High Risk)' : ' (Low Risk)'}  
          <br />
          Reason: {fraudScore.reason}
        </div>
      )}

      <div style={{ border: '1px solid #ddd', padding: '15px', margin: '20px 0' }}>
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      <button type="submit" disabled={!stripe || loading || !clientSecret} style={{ padding: '10px 20px', background: 'green', color: 'white' }}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const Checkout = () => {
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

  if (cartItems.length === 0) {
    return <p style={{ padding: '20px' }}>Cart is empty—add items first.</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
};

export default Checkout;