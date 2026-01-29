import React from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const navigate = useNavigate();

  const submitCheckout = () => {
    const isSuspicious = total > 100 || cartItems.length > 5;

    if (isSuspicious) {
      toast.warning('Potential fraud detected: High-value order flagged for review.');
    } else {
      toast.success('Checkout successful! Order placed.');
    }

    // Clear cart
    localStorage.removeItem('cartItems');

    // Delay redirect to show toast
    setTimeout(() => {
      navigate('/');
    }, 4000);  // 4 seconds (time for toast to be read)
  };

  if (cartItems.length === 0) {
    return <p style={{ padding: '20px' }}>Cart is empty—add items first.</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Checkout</h2>
      <p><strong>Total:</strong> ${total.toFixed(2)}</p>
      <button onClick={submitCheckout} style={{ padding: '10px 20px', background: 'green', color: 'white' }}>
        Place Order
      </button>
    </div>
  );
};

export default Checkout;