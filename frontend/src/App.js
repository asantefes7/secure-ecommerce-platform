import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Cart from './pages/Cart';

const Home = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Secure E-Commerce</h1>
      <p>
        {token ? (
          <>
            <Link to="/profile" style={{ margin: '0 10px' }}>Profile</Link> | 
            <Link to="/products" style={{ margin: '0 10px' }}>View Products</Link> | 
            <button onClick={logoutHandler} style={{ margin: '0 10px', padding: '5px 10px' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ margin: '0 10px' }}>Login</Link> | 
            <Link to="/register" style={{ margin: '0 10px' }}>Register</Link> | 
            <Link to="/products" style={{ margin: '0 10px' }}>View Products</Link>
            <Link to="/cart" style={{ margin: '0 10px' }}>View Cart</Link>
          </>
        )}
      </p>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;