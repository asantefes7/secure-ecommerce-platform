import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || 'All';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = 'http://localhost:5001/api/products';
        if (categoryFilter !== 'All') {
          url += `?category=${categoryFilter}`;
        }
        const res = await axios.get(url);
        setProducts(res.data);
      } catch (err) {
        toast.error('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter]); // Re-fetch when category changes

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCartHandler = (product) => {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existItem = cartItems.find((x) => x._id === product._id);

    if (existItem) {
      cartItems = cartItems.map((x) =>
        x._id === product._id ? { ...x, qty: x.qty + 1 } : x
      );
    } else {
      cartItems = [...cartItems, { ...product, qty: 1 }];
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">
        {categoryFilter !== 'All' ? `${categoryFilter} Products` : 'All Products'}
      </h2>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline-secondary" type="button">Search</button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center">No products found in this category or matching your search.</p>
      ) : (
        <div className="row">
          {filteredProducts.map((product) => (
            <div key={product._id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(product.name)}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: '250px', objectFit: 'cover' }}
                />
                <div className="card-body d-flex flex-column">
                  <span className="badge bg-primary mb-2">{product.category}</span>
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text flex-grow-1">{product.description}</p>
                  <p className="card-text"><strong>Price:</strong> ${product.price.toFixed(2)}</p>
                  <p className="card-text"><strong>In Stock:</strong> {product.countInStock}</p>
                  <button
                    onClick={() => addToCartHandler(product)}
                    className="btn btn-primary mt-auto"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;