import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCart } from '../../context/CartContext';
import { getMediaUrl } from '../../api/api';
import Button from '../common/Button';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [error, setError] = useState('');

  const handleAddToCart = async () => {
    setError('');
    try {
      await addToCart(product.id, 1);
    } catch (err) {
      setError('Thêm vào giỏ hàng thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="product-card">
      {error && <div className="error-message">{error}</div>}
      <img
        src={getMediaUrl(product.image) || '/placeholder-product.png'}
        alt={product.name}
        className="product-image"
      />
      <h3 className="product-name">{product.name}</h3>
      <p className="price">${Number(product.price || 0).toFixed(2)}</p>
      {product.avg_rating && (
        <p className="rating">Đánh giá: {product.avg_rating.toFixed(1)}★</p>
      )}
      {product.sold_count !== undefined && (
        <p className="sold">Đã bán: {product.sold_count}</p>
      )}
      <Button variant="primary" size="small" onClick={handleAddToCart}>
        Thêm vào giỏ
      </Button>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    image: PropTypes.string,
    avg_rating: PropTypes.number,
    sold_count: PropTypes.number,
  }).isRequired,
};

export default ProductCard;