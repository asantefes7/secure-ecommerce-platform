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
  const [fraudScore, setFraudScore] = useState(null);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [location, setLocation] = useState(null); // { lat, lng }

  const token = localStorage.getItem('token'); // NEW: Check for token
  const isLoggedIn = !!token; // NEW: Simple logged-in flag

  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const total = Math.round(cartItems.reduce((acc, item) => acc + item.price * item.qty, 0) * 100);

  useEffect(() => {
    if (total > 0 && isLoggedIn) { // NEW: Only init if logged in
      axios.post('http://localhost:5001/api/checkout/create-payment-intent', { amount: total })
        .then(res => setClientSecret(res.data.clientSecret))
        .catch(err => toast.error('Failed to initialize payment'));
    }

    // Get browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.info('Location captured for fraud check');
        },
        (err) => {
          toast.warning('Location access denied — fraud check limited');
          console.error('Geolocation error:', err);
        }
      );
    }
  }, [total, isLoggedIn]); // NEW: Dep on isLoggedIn

  const getFraudScore = async () => {
    const token = localStorage.getItem('token');
    try {
      const payload = {
        amount: total / 100,
        item_count: cartItems.length,
        location: location ? { lat: location.lat, lng: location.lng } : null,
      };

      const res = await axios.post('http://localhost:5001/api/fraud/score', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFraudScore(res.data);

      if (res.data.otp_sent) {
        setShowOtpInput(true);
        toast.info('Verification code sent to your email — enter it to proceed');
      }

      return res.data;
    } catch (err) {
      console.error('Fraud scoring failed:', err);
      toast.error('Unable to check fraud risk');
      return null;
    }
  };

  const handleVerifyOtpAndPay = async () => {
  let cleanOtp = (otp || '').trim().replace(/\s+/g, ''); // Clean before sending

  if (!cleanOtp || cleanOtp.length !== 6) {
    return toast.error('Please enter a valid 6-digit code');
  }

  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found');
      setLoading(false);
      return;
    }

    console.log('Sending verify-otp with cleaned OTP:', cleanOtp);

    const verifyRes = await axios.post('http://localhost:5001/api/fraud/verify-otp', { otp: cleanOtp }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (verifyRes.data.message === 'OTP verified successfully') {
      toast.success('OTP verified! Processing payment...');

      if (!stripe || !elements || !clientSecret) {
        toast.error('Payment system not ready');
        setLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        console.error('Stripe error:', error);
      } else if (paymentIntent.status === 'succeeded') {
        const isSuspicious = total / 100 > 500 || cartItems.length > 5 || fraudScore.is_fraud;

        try {
          const orderRes = await axios.post('http://localhost:5001/api/orders', {
            items: cartItems.map(item => ({
              name: item.name,
              qty: item.qty,
              price: item.price,
            })),
            total: total / 100,
            isFlagged: isSuspicious,
            paymentIntentId: paymentIntent.id,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Order saved successfully');

          // NEW: Send confirmation email
          await axios.post(`http://localhost:5001/api/orders/${orderRes.data._id}/send-confirmation-email`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Confirmation email sent');

        } catch (err) {
          console.error('Order save failed:', err);
        }

        toast.success('Payment successful! Order placed.');
        localStorage.removeItem('cartItems');
        navigate('/');
      }
    }
  } catch (err) {
    console.error('Verify OTP error:', err.response?.data || err.message);
    toast.error(err.response?.data?.message || 'Invalid or expired code');
  }
  setLoading(false);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const fraud = await getFraudScore();
  if (!fraud) {
    setLoading(false);
    return;
  }

  // If OTP required, wait for user to verify
  if (fraud.otp_sent) {
    setLoading(false);
    return;
  }

  // Low-risk direct payment
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
    const isSuspicious = total / 100 > 500 || cartItems.length > 5 || fraud.is_fraud;

    try {
      const token = localStorage.getItem('token');
      const orderRes = await axios.post('http://localhost:5001/api/orders', {
        items: cartItems.map(item => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        total: total / 100,
        isFlagged: isSuspicious,
        paymentIntentId: paymentIntent.id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // NEW: Send confirmation email
      await axios.post(`http://localhost:5001/api/orders/${orderRes.data._id}/send-confirmation-email`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Confirmation email sent');

    } catch (err) {
      console.error('Order save failed', err);
    }

    toast.success('Payment successful! Order placed.');
    localStorage.removeItem('cartItems');
    navigate('/');
  }

  setLoading(false);
};

  if (!isLoggedIn) { // NEW: Unauth message
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
        <h2>Checkout</h2>
        <p>You need to be logged in to complete checkout.</p>
        <button 
          onClick={() => navigate('/login')} 
          style={{ padding: '10px 20px', background: 'blue', color: 'white', marginRight: '10px' }}
        >
          Login
        </button>
        <button 
          onClick={() => navigate('/register')} 
          style={{ padding: '10px 20px', background: 'green', color: 'white' }}
        >
          Register
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Checkout</h2>
      <p><strong>Total:</strong> ${(total / 100).toFixed(2)}</p>

      {fraudScore && (
        <div style={{ margin: '10px 0', padding: '10px', background: fraudScore.is_fraud ? '#ffebee' : '#e8f5e9', borderRadius: '4px' }}>
          <strong>Fraud Risk Score:</strong> {fraudScore.score}%  
          {fraudScore.is_fraud ? ' (High Risk)' : ' (Low Risk)'}  
          <br />
          Reason: {fraudScore.reason}
        </div>
      )}

      {showOtpInput && (
        <div style={{ margin: '20px 0' }}>
          <h3>Enter Verification Code</h3>
          <p>Check your email for the code</p>
          <input
            type="text"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <button 
            type="button" 
            onClick={handleVerifyOtpAndPay} 
            disabled={loading} 
            style={{ 
              padding: '10px 20px', 
              background: loading ? '#ccc' : 'blue', 
              color: 'white', 
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? 'Verifying...' : 'Verify & Pay'}
          </button>
        </div>
      )}

      <div style={{ border: '1px solid #ddd', padding: '15px', margin: '20px 0' }}>
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      <button 
        type="submit" 
        disabled={!stripe || loading || !clientSecret || showOtpInput} 
        style={{ 
          padding: '10px 20px', 
          background: showOtpInput ? '#ccc' : 'green', 
          color: 'white', 
          cursor: showOtpInput ? 'not-allowed' : 'pointer',
          marginTop: '10px'
        }}
      >
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