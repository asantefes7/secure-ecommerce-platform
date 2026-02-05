import React from 'react';
import { toast } from 'react-toastify';

const Cart = () => {
  const [cartItems, setCartItems] = React.useState(JSON.parse(localStorage.getItem('cartItems') || '[]'));

  const updateCart = (updatedItems) => {
    setCartItems(updatedItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
  };

  const updateQty = (id, delta) => {
    const updatedItems = cartItems.map((item) =>
      item._id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    );
    updateCart(updatedItems);
    toast.info('Cart updated');
  };

  const removeItem = (id) => {
    const updatedItems = cartItems.filter((item) => item._id !== id);
    updateCart(updatedItems);
    toast.info('Item removed from cart');
  };

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  if (cartItems.length === 0) {
    return <p className="text-center my-5">Your cart is empty.</p>;
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">Shopping Cart</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item._id}>
              <td>
                <strong>{item.name}</strong>
                <br />
                {item.description}
              </td>
              <td>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQty(item._id, -1)}>-</button>
                <span className="mx-3">{item.qty}</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQty(item._id, 1)}>+</button>
              </td>
              <td>${(item.price * item.qty).toFixed(2)}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => removeItem(item._id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="text-end">Total: ${total.toFixed(2)}</h3>
    </div>
  );
};

export default Cart;