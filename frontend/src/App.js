import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

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
    <nav style={{ background: '#333', color: 'white', padding: '15px', textAlign: 'center', fontSize: '16px' }}>
      <Link to="/" style={{ color: 'white', margin: '0 15px' }}>Home</Link>
      <Link to="/products" style={{ color: 'white', margin: '0 15px' }}>Products</Link>
      <Link to="/cart" style={{ color: 'white', margin: '0 15px' }}>
        Cart ({cartCount})
      </Link>
      {cartCount > 0 && <Link to="/checkout" style={{ color: 'white', margin: '0 15px' }}>Checkout</Link>}
      {token ? (
        <>
          <Link to="/profile" style={{ color: 'white', margin: '0 15px' }}>Profile</Link>
          <button 
            onClick={logoutHandler} 
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', margin: '0 15px', fontSize: '16px' }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ color: 'white', margin: '0 15px' }}>Login</Link>
          <Link to="/register" style={{ color: 'white', margin: '0 15px' }}>Register</Link>
        </>
      )}
    </nav>
  );
};

const Home = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Secure E-Commerce</h1>
      <p>Use the navigation bar above to explore the app.</p>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Home />} />
      </Routes>
      <ToastContainer position="top-center" autoClose={5000} />
    </div>
  );
}

export default App;