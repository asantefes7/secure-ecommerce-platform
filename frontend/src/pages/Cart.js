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
    return <p style={{ padding: '20px' }}>Your cart is empty.</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Shopping Cart</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cartItems.map((item) => (
          <li key={item._id} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '10px' }}>
            <h3>{item.name}</h3>
            <p>Quantity: {item.qty}</p>
            <button onClick={() => updateQty(item._id, -1)}>-</button>
            <span style={{ margin: '0 10px' }}>{item.qty}</span>
            <button onClick={() => updateQty(item._id, 1)}>+</button>
            <p>Price: ${item.price.toFixed(2)}</p>
            <button onClick={() => removeItem(item._id)} style={{ marginTop: '10px', background: 'red', color: 'white' }}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <h3>Total: ${total.toFixed(2)}</h3>
    </div>
  );
};

export default Cart;