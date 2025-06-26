import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productsAPI } from '../../api/api';
import Button from '../../components/common/Button';

const SellerProfile = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSellerDetails = async () => {
    try {
      setLoading(true);
      const sellerData = await productsAPI.getSellerDetails(sellerId);
      setSeller(sellerData);
      const productData = await productsAPI.getProductsBySeller(sellerId);
      setProducts(productData);
    } catch (err) {
      console.error('Failed to fetch seller details:', err);
      setError(err.message || 'Không thể tải thông tin người bán');
      setSeller({ username: 'Người dùng không xác định' }); // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerDetails();
  }, [sellerId]);

  const handleMessageSeller = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/messages/${sellerId}`);
  };

  if (loading) return <div className="text-center py-6 text-gray-600">Đang tải...</div>;
  if (error) return <div className="text-center py-6 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">
        Hồ sơ người bán: {seller?.username || 'Không xác định'}
      </h1>
      <div className="mb-6">
        <Button variant="primary" onClick={handleMessageSeller}>
          Nhắn tin cho người bán
        </Button>
      </div>
      <h2 className="text-xl font-semibold mb-4">Sản phẩm của người bán</h2>
      {products.length === 0 ? (
        <p className="text-gray-600">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border p-4 rounded-lg shadow-sm">
              <img
                src={product.image || '/placeholder-image.jpg'}
                alt={product.name}
                className="w-full h-48 object-cover mb-4"
              />
              <h3 className="text-lg font-medium">{product.name}</h3>
              <p className="text-gray-600">{product.price} VNĐ</p>
              <Button
                variant="secondary"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                Xem chi tiết
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerProfile;