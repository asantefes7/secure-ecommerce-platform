import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/products');
        setProducts(data);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load products');
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCartHandler = (product) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existItem = cartItems.find((x) => x._id === product._id);
    if (existItem) {
      cartItems.map((x) => x._id === product._id ? { ...x, qty: x.qty + 1 } : x);
    } else {
      cartItems.push({ ...product, qty: 1 });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) return <p>Loading products...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Products</h2>
      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {products.map((product) => (
            <li key={product._id} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '10px' }}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p><strong>Price:</strong> ${product.price}</p>
              <p><strong>In Stock:</strong> {product.countInStock}</p>
              <button onClick={() => addToCartHandler(product)} style={{ marginTop: '10px', padding: '8px 16px' }}>
                Add to Cart
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Products;