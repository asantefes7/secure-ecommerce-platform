import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const MyFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      try {
        const res = await axios.get('http://localhost:5001/api/auth/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(res.data);
      } catch (err) {
        toast.error('Failed to load favorites');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const removeFavorite = async (productId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:5001/api/auth/favorites/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(favorites.filter(item => item._id !== productId));
      toast.success('Removed from favorites');
    } catch (err) {
      toast.error('Failed to remove favorite');
    }
  };

  if (loading) return <p className="text-center my-5">Loading favorites...</p>;

  if (favorites.length === 0) {
    return (
      <div className="container my-5 text-center">
        <h2>My Favorites</h2>
        <p className="text-muted fs-5">You have no favorite items yet. Start exploring!</p>
        <Link to="/products" className="btn btn-primary mt-3">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4 fw-bold">My Favorites</h2>
      <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
        {favorites.map((product) => (
          <div className="col" key={product._id}>
            <div className="card h-100 shadow-sm border-0">
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
                  <div className="d-flex gap-2">
                    <Link to={`/products/${product._id}`} className="btn btn-outline-primary flex-grow-1">
                      View Details
                    </Link>
                    <button
                      onClick={() => removeFavorite(product._id)}
                      className="btn btn-outline-danger"
                    >
                      <i className="bi bi-heart-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyFavorites;