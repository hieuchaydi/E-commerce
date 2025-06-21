import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, getMediaUrl } from '../../api/api';
import './SellerProfile.css';

const SellerProfile = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        const [userRes, productsRes] = await Promise.all([
          productsAPI.getUser(sellerId),
          productsAPI.getProducts({ seller: sellerId }),
        ]);
        setSeller(userRes.data);
        setProducts(productsRes.data.results || productsRes.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Lỗi tải thông tin người bán');
        setLoading(false);
      }
    };
    fetchSellerData();
  }, [sellerId]);

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!seller) return <div className="not-found">Không tìm thấy người bán</div>;

  return (
    <div className="seller-profile">
      <h1>{seller.username}</h1>
      <p>Email: {seller.email || 'Chưa cung cấp'}</p>
      <p>Số điện thoại: {seller.phone || 'Chưa cung cấp'}</p>
      <p>Địa chỉ: {seller.address || 'Chưa cung cấp'}</p>
      <p>Đánh giá: {seller.seller_rating ? `${seller.seller_rating.toFixed(1)} ★` : 'Chưa có đánh giá'}</p>
      <h2>Sản phẩm đang bán</h2>
      <div className="product-list">
        {products.length === 0 ? (
          <p>Chưa có sản phẩm nào.</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="product-item"
              onClick={() => handleProductClick(product.id)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={getMediaUrl(product.image) || getMediaUrl('/media/products/placeholder.jpg')}
                alt={product.name}
                className="product-image"
                onError={(e) => (e.target.src = getMediaUrl('/media/products/placeholder.jpg'))}
              />
              <h3>{product.name}</h3>
              <p>{product.price ? `${product.price.toLocaleString('vi-VN')} ₫` : 'Liên hệ'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SellerProfile;