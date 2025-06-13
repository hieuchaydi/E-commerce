import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import './CartPage.css';

const Cart = () => {
  const { cartItems, loading, error, refreshCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Cart items updated in Cart component:', cartItems);
  }, [cartItems]);

  if (loading) return <div>Loading cart...</div>;
  if (error) return <div>Error: {error}</div>;
  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/')}>Continue Shopping</button>
        <button onClick={refreshCart}>Refresh Cart</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your Shopping Cart</h1>
      <div className="cart-container">
        <div className="cart-items">
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>
        <div className="cart-summary">
          <CartSummary />
        </div>
      </div>
    </div>
  );
};

export default Cart;