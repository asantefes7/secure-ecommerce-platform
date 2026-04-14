import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const FlaggedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Local backend URL (for development)
  const API_BASE = 'http://localhost:5001';

  const fetchFlaggedOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/api/orders/flagged`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/');
      } else {
        toast.error('Failed to load flagged orders');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchFlaggedOrders();
  }, [fetchFlaggedOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`${API_BASE}/api/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Order status updated!');
      await sendStatusEmail(orderId, newStatus);
      fetchFlaggedOrders(); // Refetch to update table
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    }
  };

  const sendStatusEmail = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_BASE}/api/orders/${orderId}/send-status-email`, { newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Status email sent for order:', orderId);
    } catch (err) {
      console.error('Status email error:', err);
    }
  };

  if (loading) return <p className="text-center my-5">Loading flagged orders...</p>;

  if (orders.length === 0) {
    return (
      <div className="container my-5">
        <h2 className="text-center mb-4">Flagged Orders</h2>
        <p className="text-center">No flagged orders at this time.</p>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">Flagged Orders (Fraud Monitoring)</h2>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Email</th>
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
                <td>{order.user?.name || 'N/A'}</td>
                <td>{order.user?.email || 'N/A'}</td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <ul className="list-unstyled mb-0">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} x {item.qty} (${item.price.toFixed(2)})
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{order.paymentIntentId?.slice(0, 10)}...</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>
                  <select
                    defaultValue={order.status || 'Pending'}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="form-select form-select-sm d-inline-block w-auto me-2"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlaggedOrders;