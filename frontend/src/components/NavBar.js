import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = () => {
  // This dummy state forces re-render when needed
  const [, forceUpdate] = useState(0);

  // Read token & user fresh on every render
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.isAdmin === true;

  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const navigate = useNavigate();

  // Listen for storage changes from anywhere (login/logout)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        forceUpdate(prev => prev + 1); // Re-render NavBar
      }
    };

    window.addEventListener('storage', handleStorage);

    // Also force check on initial mount & after any change
    forceUpdate(prev => prev + 1);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav style={{ 
      background: '#333', 
      color: 'white', 
      padding: '15px', 
      textAlign: 'center', 
      fontSize: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <Link to="/" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>Home</Link>
      <Link to="/products" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>Products</Link>

      <Link to="/cart" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>
        Cart ({cartCount})
      </Link>

      {cartCount > 0 && (
        <Link to="/checkout" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>
          Checkout
        </Link>
      )}

      {token ? (
        <>
          <Link to="/profile" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>
            Profile
          </Link>

          {/* My Orders - visible to ALL logged-in users */}
          <Link to="/my-orders" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>
            My Orders
          </Link>

          {isAdmin && (
            <Link to="/admin/flagged-orders" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>
              Flagged Orders
            </Link>
          )}

          <button
            onClick={logoutHandler}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              margin: '0 15px',
              fontSize: '16px',
              padding: 0
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>
            Login
          </Link>
          <Link to="/register" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>
            Register
          </Link>
        </>
      )}
    </nav>
  );
};

export default NavBar;