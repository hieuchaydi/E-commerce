
import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import './CartSummary.css';

const CartSummary = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [error, setError] = useState('');

  const handleClearCart = async () => {
    if (!user) {
      setError('Vui lòng đăng nhập để xóa giỏ hàng.');
      return;
    }
    setError('');
    try {
      await clearCart();
    } catch (err) {
      setError('Xóa giỏ hàng thất bại. Vui lòng thử lại.');
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price || 0) * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="cart-summary">
      <h3>Tóm tắt đơn hàng</h3>
      {error && <div className="error-message">{error}</div>}
      <div className="summary-row">
        <span>Tạm tính</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <div className="summary-row">
        <span>Thuế (10%)</span>
        <span>${tax.toFixed(2)}</span>
      </div>
      <div className="summary-row total">
        <span>Tổng cộng</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <div className="cart-actions">
        <Button variant="danger" onClick={handleClearCart} disabled={!user}>
          Xóa giỏ hàng
        </Button>
        <Button variant="success" to="/checkout" disabled={!user || cartItems.length === 0}>
          Thanh toán
        </Button>
      </div>
    </div>
  );
};

export default CartSummary;
