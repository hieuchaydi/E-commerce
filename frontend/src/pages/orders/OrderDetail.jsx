import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getOrder(id);
      console.log('Fetched order data:', response); // Debug log
      setOrder(response);
    } catch (err) {
      console.error('Error fetching order:', err.message);
      if (err.response?.status === 401) {
        setError('Bạn không có quyền truy cập đơn hàng này.');
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy đơn hàng.');
      } else {
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      fetchOrder();
    }
  }, [user, fetchOrder]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    try {
      setLoading(true);
      setError(null);
      await ordersAPI.updateOrderStatus(id, { status: 'cancelled' });
      setSuccess('Đơn hàng đã được hủy thành công.');
      fetchOrder(); // Refresh order details
    } catch (err) {
      console.error('Error canceling order:', err.message);
      setError('Hủy đơn hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Chờ xử lý';
      case 'processing':
        return 'Đang xử lý';
      case 'shipped':
        return 'Đang giao hàng';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-500';
      case 'processing':
        return 'text-blue-500';
      case 'shipped':
        return 'text-purple-500';
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return <div className="text-center py-6 text-gray-600">Đang tải...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">{error}</div>;
  }

  if (!order) {
    return <div className="text-center py-6 text-gray-600">Không tìm thấy đơn hàng.</div>;
  }

  return (
    <div className="order-detail-page container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        Chi Tiết Đơn Hàng #{order.id}
      </h2>
      {success && <div className="success-message text-green-600 text-center mb-4">{success}</div>}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Thông Tin Đơn Hàng</h3>
          <p>Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
          <p>Trạng thái: <span className={getStatusColor(order.status)}>{getStatusText(order.status)}</span></p>
          <p>Tổng tiền: ${Number(order.total_price || 0).toFixed(2)}</p>
          <p>Phương thức thanh toán: {order.payment_method || 'Chưa xác định'}</p>
          <p>Địa chỉ giao hàng: {order.shipping_address || 'Chưa cập nhật'}</p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Sản Phẩm</h3>
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b py-2">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                  <p className="text-sm text-gray-600">Đơn giá: ${Number(item.price).toFixed(2)}</p>
                </div>
                <p className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">Không có sản phẩm trong đơn hàng.</p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="primary"
            size="small"
            onClick={() => navigate('/orders')}
          >
            Quay lại lịch sử đơn hàng
          </Button>
          {order.status === 'pending' && (
            <Button
              variant="danger"
              size="small"
              onClick={handleCancelOrder}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Hủy Đơn Hàng'}
            </Button>
          )}
          <Button
            variant="success"
            size="small"
            onClick={() => navigate(`/order-status/${order.id}`)}
          >
            Xem Trạng Thái Giao Hàng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;