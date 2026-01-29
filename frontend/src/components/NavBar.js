import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = () => {
  const token = localStorage.getItem('token');
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cartItems'); // Optional: Clear cart on logout
    navigate('/');
  };

  return (
    <nav style={{ background: '#333', color: 'white', padding: '10px', textAlign: 'center' }}>
      <Link to="/" style={{ color: 'white', margin: '0 15px' }}>Home</Link>
      <Link to="/products" style={{ color: 'white', margin: '0 15px' }}>Products</Link>
      <Link to="/cart" style={{ color: 'white', margin: '0 15px' }}>
        Cart ({cartCount})
      </Link>
      {token ? (
        <>
          <Link to="/profile" style={{ color: 'white', margin: '0 15px' }}>Profile</Link>
          <button onClick={logoutHandler} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', margin: '0 15px' }}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ color: 'white', margin: '0 15px' }}>Login</Link>
          <Link to="/register" style={{ color: 'white', margin: '0 15px' }}>Register</Link>
        </>
      )}
      {cartCount > 0 && <Link to="/checkout" style={{ color: 'white', margin: '0 15px' }}>Checkout</Link>}
    </nav>
  );
};

export default NavBar;