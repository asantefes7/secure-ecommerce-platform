import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get('http://localhost:5001/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        toast.error('Failed to load your orders');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [navigate]);

  if (loading) return <p className="text-center my-5">Loading your orders...</p>;

  if (orders.length === 0) {
    return (
      <div className="container my-5">
        <h2 className="text-center mb-4">My Orders</h2>
        <p className="text-center">You have no orders yet.</p>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">My Orders</h2>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Order ID</th>
              <th>Total</th>
              <th>Items</th>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <ul className="list-unstyled mb-0">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} × {item.qty} (${item.price.toFixed(2)})
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{order.paymentIntentId?.slice(0, 10)}...</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>
                  {order.isFlagged ? (
                    <span className="badge bg-danger">Flagged</span>
                  ) : (
                    <span className="badge bg-success">Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyOrders;