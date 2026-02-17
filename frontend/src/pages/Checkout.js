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

  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const total = Math.round(cartItems.reduce((acc, item) => acc + item.price * item.qty, 0) * 100);  // Integer cents

  useEffect(() => {
    if (total > 0) {
      axios.post('http://localhost:5001/api/checkout/create-payment-intent', { amount: total })
        .then(res => setClientSecret(res.data.clientSecret))
        .catch(err => toast.error('Failed to initialize payment'));
    }
  }, [total]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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

      // Save order to backend - updated items structure
      try {
        const token = localStorage.getItem('token');
        const orderPayload = {
          items: cartItems.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.price,
          })),
          total: total / 100,
          isFlagged: isSuspicious,
          paymentIntentId: paymentIntent.id,
        };

        console.log('Sending order payload:', orderPayload); // ← Debug log

        await axios.post('http://localhost:5001/api/orders', orderPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Order saved successfully');
      } catch (err) {
        console.error('Order save failed:', err.response?.data || err.message);
        toast.error('Order save failed');
      }

      if (isSuspicious) {
        toast.warning('Potential fraud detected: High-value order flagged for review.');
      } else {
        toast.success('Payment successful! Order placed.');
      }

      localStorage.removeItem('cartItems');
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Checkout</h2>
      <p><strong>Total:</strong> ${(total / 100).toFixed(2)}</p>
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