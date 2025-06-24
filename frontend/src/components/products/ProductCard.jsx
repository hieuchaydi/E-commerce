import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../../api/api';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const imageSrc = getMediaUrl(product.image) || '/placeholder-product.png';
  const price = Number(product.price);
  const validPrice = isNaN(price) ? 0 : price;

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`}>
        <img src={imageSrc} alt={product.name} className="product-image" />
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{validPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
        <p className="product-seller">Người bán: {product.seller.username}</p>
        {product.avg_rating && (
          <p className="product-rating">Đánh giá: {product.avg_rating.toFixed(1)}/5</p>
        )}
      </Link>
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
    seller: PropTypes.shape({
      username: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};

export default ProductCard;