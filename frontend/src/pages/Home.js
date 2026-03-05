import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Fetch products (limit to 6 for featured)
        const res = await axios.get('http://localhost:5001/api/products?limit=6');
        setFeaturedProducts(res.data);
      } catch (err) {
        toast.error('Failed to load featured products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-dark text-white text-center py-5">
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">Welcome to Secure E-Commerce</h1>
          <p className="lead mb-4">
            Shop the latest sneakers, watches, and clothing with secure payments and advanced fraud protection.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop Now
            </Link>
            <Link to="/products" className="btn btn-outline-light btn-lg">
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Featured Products</h2>

          {loading ? (
            <p className="text-center">Loading featured items...</p>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center">No featured products available.</p>
          ) : (
            <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
              {featuredProducts.map((product) => (
                <div className="col" key={product._id}>
                  <div className="card h-100 shadow-sm border-0">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(product.name)}
                      className="card-img-top"
                      alt={product.name}
                      style={{ height: '220px', objectFit: 'cover' }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{product.name}</h5>
                      <p className="card-text text-muted flex-grow-1">{product.description?.substring(0, 80)}...</p>
                      <div className="mt-auto">
                        <p className="card-text fw-bold text-primary">${product.price.toFixed(2)}</p>
                        <Link to={`/products/${product._id}`} className="btn btn-outline-primary w-100">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-5">Shop by Category</h2>
          <div className="row text-center">
            <div className="col-md-4 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h4>Sneakers</h4>
                  <p>Latest drops from Nike, Adidas, Jordan, and more.</p>
                  <Link to={'/products?category=Sneakers'} className="btn btn-outline-primary">
                    Explore Sneakers
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h4>Watches</h4>
                  <p>Timeless luxury and smart watches from top brands.</p>
                  <Link to={'/products?category=Watches'} className="btn btn-outline-primary">
                    Explore Watches
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h4>Clothing</h4>
                  <p>Streetwear, hoodies, tees, and premium apparel.</p>
                  <Link to={'/products?category=Clothing'} className="btn btn-outline-primary">
                    Explore Clothing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-primary text-white py-5 text-center">
        <div className="container">
          <h3 className="mb-4">Why Shop With Us?</h3>
          <div className="row">
            <div className="col-md-4">
              <h5>🔒 Secure Payments</h5>
              <p>Protected by Stripe and advanced fraud detection.</p>
            </div>
            <div className="col-md-4">
              <h5>🚚 Fast Shipping</h5>
              <p>Orders processed quickly with tracking.</p>
            </div>
            <div className="col-md-4">
              <h5>🛡️ Buyer Protection</h5>
              <p>Full refund policy on eligible orders.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;