import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCart } from '../../context/CartContext';
import { getMediaUrl } from '../../api/api';
import Button from '../common/Button';
import { toast } from 'react-toastify';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const [error, setError] = useState('');

  const handleQuantityChange = async (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (newQuantity > 0) {
      setError('');
      try {
        await updateCartItem(item.id, newQuantity);
      } catch (err) {
        setError('Cập nhật số lượng thất bại. Vui lòng thử lại.');
      }
    }
  };

  const handleRemove = async () => {
    setError('');
    try {
      await removeFromCart(item.id);
    } catch (err) {
      setError('Xóa sản phẩm thất bại. Vui lòng thử lại.');
    }
  };

  const price = Number(item.product.price);
  const validPrice = isNaN(price) ? 0 : price;
  const total = validPrice * item.quantity;
  const imageSrc = getMediaUrl(item.product.image);

  return (
    <div className="cart-item">
      {error && <div className="error-message">{error}</div>}
      <div className="cart-item-image">
        <img src={imageSrc || '/placeholder-product.png'} alt={item.product.name} />
      </div>
      <div className="cart-item-details">
        <h4>{item.product.name}</h4>
        <p>${validPrice.toFixed(2)}</p>
        <div className="cart-item-quantity">
          <label>Số lượng:</label>
          <input type="number" min="1" value={item.quantity} onChange={handleQuantityChange} />
        </div>
      </div>
      <div className="cart-item-total">
        <p>${total.toFixed(2)}</p>
        <Button variant="danger" size="small" onClick={handleRemove}>
          Xóa
        </Button>
      </div>
    </div>
  );
};

CartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    product: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      image: PropTypes.string,
    }).isRequired,
    quantity: PropTypes.number.isRequired,
  }).isRequired,
};

export default CartItem;