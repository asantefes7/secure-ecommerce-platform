import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  // Local backend URL (for development)
  const API_BASE = 'http://localhost:5001';

  useEffect(() => {
    const fetchMyOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/orders/my-orders`, {
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

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Pending':
        return { text: 'Pending', color: 'warning', explanation: 'Your order has been received and is awaiting processing.' };
      case 'Processing':
        return { text: 'Processing', color: 'info', explanation: 'Your order is being prepared and packaged for shipment.' };
      case 'Shipped':
        return { text: 'Shipped', color: 'primary', explanation: 'Your order has been shipped and is on its way to you.' };
      case 'Delivered':
        return { text: 'Delivered', color: 'success', explanation: 'Your order has been successfully delivered.' };
      case 'Cancelled':
        return { text: 'Cancelled', color: 'danger', explanation: 'Your order has been cancelled.' };
      default:
        return { text: status || 'Unknown', color: 'secondary', explanation: 'Status information not available.' };
    }
  };

  const getFlaggedExplanation = (order) => {
    if (!order.isFlagged) return null;

    const reasons = order.flaggedReason || [];

    return (
      <div className="mt-4 p-4 bg-danger-subtle border border-danger rounded">
        <h6 className="text-danger fw-bold mb-3">
          <i className="bi bi-shield-lock-fill me-2"></i>
          This order was flagged for review
        </h6>

        {reasons.length > 0 ? (
          <ul className="mb-0 ps-4">
            {reasons.map((reason, index) => (
              <li key={index} className="text-dark">{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mb-0">Flagged for security review (no specific reason recorded in this order).</p>
        )}

        <p className="text-muted small mt-3 mb-0">
          This is a standard security check. Your order is still valid and being processed normally.
        </p>
      </div>
    );
  };

  if (loading) return <p className="text-center my-5 fs-4">Loading your orders...</p>;

  if (orders.length === 0) {
    return (
      <div className="container my-5 text-center">
        <h2 className="mb-4">My Orders</h2>
        <p className="text-muted fs-5">You have no orders yet. Start shopping now!</p>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4 fw-bold">My Orders</h2>
      <div className="table-responsive shadow rounded">
        <table className="table table-hover table-striped align-middle mb-0">
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
              <tr 
                key={order._id}
                style={{ cursor: 'pointer' }}
                className="hover-light"
                onClick={() => setSelectedOrder(order)}
              >
                <td>{order._id}</td>
                <td className="fw-bold">${order.total.toFixed(2)}</td>
                <td>
                  <ul className="list-unstyled mb-0">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} × {item.qty}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{order.paymentIntentId?.slice(0, 10)}...</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  {order.isFlagged && <span className="badge bg-danger me-2">Flagged</span>}
                  <span className={`badge bg-${getStatusInfo(order.status).color}`}>
                    {getStatusInfo(order.status).text}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-dark text-white">
                  <h5 className="modal-title">Order Details – {selectedOrder._id}</h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setSelectedOrder(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-4">
                    <h6><strong>Current Status:</strong> 
                      <span className={`badge bg-${getStatusInfo(selectedOrder.status).color} ms-2 fs-6`}>
                        {getStatusInfo(selectedOrder.status).text}
                      </span>
                    </h6>
                    <p className="text-muted mt-2">
                      {getStatusInfo(selectedOrder.status).explanation}
                    </p>
                  </div>

                  {getFlaggedExplanation(selectedOrder)}

                  <hr />

                  <h6 className="mb-3"><strong>Order Summary</strong></h6>
                  <p><strong>Placed on:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p><strong>Total Amount:</strong> ${selectedOrder.total.toFixed(2)}</p>
                  <p><strong>Payment ID:</strong> {selectedOrder.paymentIntentId || 'N/A'}</p>

                  <h6 className="mt-4 mb-3"><strong>Items Ordered</strong></h6>
                  <ul className="list-group mb-3">
                    {selectedOrder.items.map((item, idx) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{item.name}</strong> × {item.qty}
                        </div>
                        <span>${(item.price * item.qty).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setSelectedOrder(null)}></div>
        </>
      )}
    </div>
  );
};

export default MyOrders;