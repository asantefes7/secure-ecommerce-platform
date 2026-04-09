import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import NavBar from './components/NavBar';  
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import FlaggedOrders from './pages/FlaggedOrders';
import ForgotPassword from './pages/ForgotPassword';
import ProductDetail from './pages/ProductDetail';
import Home from './pages/Home';
import MyFavorites from './pages/MyFavorites'; 

function App() {
  return (
    <div className="App">
      <NavBar />  
      <Routes>
        {/* Default route - professional Home page */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/my-favorites" element={<MyFavorites />} /> 
        <Route path="/admin/flagged-orders" element={<FlaggedOrders />} />

        {/* Optional 404 */}
        <Route path="*" element={<div className="text-center mt-5"><h2>404 - Page Not Found</h2></div>} />
      </Routes>
      <ToastContainer position="top-center" autoClose={5000} />
    </div>
  );
}

export default App;