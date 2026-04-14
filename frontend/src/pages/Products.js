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
  const [favorites, setFavorites] = useState([]); // Track favorited IDs

  // Track selected size/color per product ID
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});

  // Local backend URL (for development)
  const API_BASE = 'http://localhost:5001';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = `${API_BASE}/api/products`;
        if (categoryFilter !== 'All') {
          url += `?category=${categoryFilter}`;
        }
        const res = await axios.get(url);
        setProducts(res.data);

        // Fetch user's favorites (if logged in)
        const token = localStorage.getItem('token');
        if (token) {
          const favRes = await axios.get(`${API_BASE}/api/auth/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFavorites(favRes.data.map(p => p._id));
        }
      } catch (err) {
        toast.error('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter]);

  const toggleFavorite = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Please login to add to favorites');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/auth/favorites/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.favorited) {
        setFavorites([...favorites, productId]);
        toast.success('Added to favorites');
      } else {
        setFavorites(favorites.filter(id => id !== productId));
        toast.info('Removed from favorites');
      }
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  };

  const isFavorited = (productId) => favorites.includes(productId);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCartHandler = (product) => {
    const selectedSize = selectedSizes[product._id];
    const selectedColor = selectedColors[product._id];

    // Validation: require size/color if available
    if (product.sizes?.length > 0 && !selectedSize) {
      return toast.error('Please select a size');
    }
    if (product.colors?.length > 0 && !selectedColor) {
      return toast.error('Please select a color');
    }

    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartItem = {
      ...product,
      qty: 1,
      selectedSize: selectedSize || null,
      selectedColor: selectedColor || null,
    };

    const existing = cartItems.find(
      item => item._id === product._id &&
              item.selectedSize === selectedSize &&
              item.selectedColor === selectedColor
    );

    if (existing) {
      existing.qty += 1;
    } else {
      cartItems.push(cartItem);
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
              <div className="card h-100 shadow-sm position-relative">
                {/* Heart Icon Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product._id);
                  }}
                  className="btn btn-sm position-absolute top-0 end-0 m-2 z-10"
                  style={{ background: 'none', border: 'none' }}
                >
                  <i className={`bi ${isFavorited(product._id) ? 'bi-heart-fill text-danger' : 'bi-heart'} fs-4`}></i>
                </button>

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

                  {/* Size selector on list card */}
                  {product.sizes?.length > 0 && (
                    <div className="mb-2">
                      <select
                        className="form-select form-select-sm"
                        value={selectedSizes[product._id] || ''}
                        onChange={(e) => setSelectedSizes({ ...selectedSizes, [product._id]: e.target.value })}
                      >
                        <option value="">Choose size</option>
                        {product.sizes.map((size, i) => (
                          <option key={i} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Color selector on list card */}
                  {product.colors?.length > 0 && (
                    <div className="mb-3">
                      <select
                        className="form-select form-select-sm"
                        value={selectedColors[product._id] || ''}
                        onChange={(e) => setSelectedColors({ ...selectedColors, [product._id]: e.target.value })}
                      >
                        <option value="">Choose color</option>
                        {product.colors.map((color, i) => (
                          <option key={i} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => addToCartHandler(product)}
                    disabled={
                      product.countInStock === 0 ||
                      (product.sizes?.length > 0 && !selectedSizes[product._id]) ||
                      (product.colors?.length > 0 && !selectedColors[product._id])
                    }
                    className={`btn btn-primary mt-auto ${product.countInStock > 0 ? '' : 'disabled'}`}
                  >
                    {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
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