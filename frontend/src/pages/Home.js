import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]); // Track favorited IDs

  // Local backend URL (for development)
  const API_BASE = 'http://localhost:5001';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Featured
        const featuredRes = await axios.get(`${API_BASE}/api/products?limit=6`);
        setFeaturedProducts(featuredRes.data);

        // New Arrivals
        const newRes = await axios.get(`${API_BASE}/api/products?sort=-createdAt&limit=6`);
        setNewArrivals(newRes.data);

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
    fetchData();
  }, []);

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

  // Carousel settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } }
    ]
  };

  return (
    <div>
      {/* Hero Section with subtle gradient overlay */}
      <section className="bg-dark text-white text-center py-5 position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient" style={{ opacity: 0.6 }}></div>
        <div className="container position-relative">
          <h1 className="display-4 fw-bold mb-3">Welcome to ShieldShop</h1>
          <p className="lead mb-4">
            Secure shopping for premium sneakers, watches, and clothing — protected by advanced fraud detection and trusted payments.
          </p>

          {/* Trust Badge Row */}
          <div className="d-flex justify-content-center gap-4 mb-4 flex-wrap">
            <div className="d-flex align-items-center">
              <i className="bi bi-shield-lock-fill fs-3 me-2 text-success"></i>
              <span>Secure Payments</span>
            </div>
            <div className="d-flex align-items-center">
              <i className="bi bi-shield-check-fill fs-3 me-2 text-success"></i>
              <span>Fraud Protection</span>
            </div>
            <div className="d-flex align-items-center">
              <i className="bi bi-truck fs-3 me-2 text-success"></i>
              <span>Fast Shipping</span>
            </div>
            <div className="d-flex align-items-center">
              <i className="bi bi-shield-fill fs-3 me-2 text-success"></i>
              <span>Buyer Protection</span>
            </div>
          </div>

          {/* Buttons with pulse on Shop Now */}
          <div className="d-flex justify-content-center gap-3">
            <Link 
              to="/products" 
              className="btn btn-primary btn-lg pulse-btn"
            >
              Shop Now
            </Link>
            <Link to="/products" className="btn btn-outline-light btn-lg">
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products - Carousel */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Featured Products</h2>

          {loading ? (
            <p className="text-center">Loading featured items...</p>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center">No featured products available.</p>
          ) : (
            <Slider {...settings}>
              {featuredProducts.map((product) => (
                <div key={product._id} className="px-2">
                  <div className="card h-100 shadow-sm border-0 product-card position-relative">
                    {/* Featured badge */}
                    <span className="badge bg-primary position-absolute top-0 start-0 m-2 z-10">Featured</span>

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
            </Slider>
          )}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-5">New Arrivals</h2>

          {loading ? (
            <p className="text-center">Loading new arrivals...</p>
          ) : newArrivals.length === 0 ? (
            <p className="text-center">No new arrivals yet.</p>
          ) : (
            <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
              {newArrivals.map((product) => (
                <div className="col" key={product._id}>
                  <div className="card h-100 shadow-sm border-0 product-card position-relative">
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
      <section className="py-5 bg-light">
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

      {/* CSS for pulse, hover, and badge */}
      <style jsx>{`
        .pulse-btn {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        .product-card .card-img-top {
          transition: transform 0.4s ease;
        }
        .product-card:hover .card-img-top {
          transform: scale(1.08);
        }
        .bg-gradient {
          background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%);
        }
      `}</style>
    </div>
  );
};

export default Home;