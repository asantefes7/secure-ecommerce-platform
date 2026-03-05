import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams(); // Get product ID from URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        toast.error('Product not found');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const addToCart = () => {
    let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      existing.qty += quantity;
    } else {
      cart.push({ ...product, qty: quantity });
    }
    localStorage.setItem('cartItems', JSON.stringify(cart));
    toast.success(`${product.name} (${quantity}) added to cart!`);
  };

  if (loading) return <p className="text-center my-5 fs-4">Loading product details...</p>;

  if (!product) return <p className="text-center my-5 fs-4">Product not found.</p>;

  return (
    <div className="container my-5">
      <div className="row g-5">
        {/* Product Image */}
        <div className="col-lg-6">
          <img
            src={product.imageUrl || `https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            className="img-fluid rounded shadow-lg"
            style={{ maxHeight: '500px', objectFit: 'cover' }}
          />
        </div>

        {/* Product Info */}
        <div className="col-lg-6">
          <h2 className="fw-bold mb-3">{product.name}</h2>

          <p className="text-muted mb-4">
            {product.description || 'No detailed description available.'}
          </p>

          <h4 className="text-primary fw-bold mb-4">
            ${product.price.toFixed(2)}
          </h4>

          <div className="mb-4">
            <strong>Category:</strong> {product.category || 'General'}<br />
            <strong>In Stock:</strong> {product.countInStock > 0 ? `${product.countInStock} available` : 'Out of stock'}
          </div>

          <div className="input-group mb-4 w-50">
            <span className="input-group-text">Qty</span>
            <input
              type="number"
              min="1"
              max={product.countInStock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(product.countInStock, parseInt(e.target.value) || 1)))}
              className="form-control"
            />
          </div>

          <button
            onClick={addToCart}
            disabled={product.countInStock === 0}
            className={`btn btn-lg w-100 ${product.countInStock > 0 ? 'btn-success' : 'btn-secondary'}`}
          >
            {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;