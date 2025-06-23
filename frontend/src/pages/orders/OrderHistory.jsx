import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ordersAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import './OrderHistory.css';

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(location.state?.success || null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    // Làm mới danh sách khi có state từ checkout
    if (user && location.state?.success) {
      fetchOrders();
    }
    // Reset success message sau 3 giây
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, location.state, success]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getOrders();
      console.log('Orders response:', response); // Ghi log để kiểm tra dữ liệu trả về
      // Xử lý dữ liệu trả về: đảm bảo là mảng
      if (Array.isArray(response)) {
        setOrders(response);
      } else if (response && Array.isArray(response.results)) {
        setOrders(response.results); // Hỗ trợ phân trang nếu backend trả về dạng { results: [...] }
      } else {
        setError('Dữ liệu đơn hàng không hợp lệ.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err.message);
      if (err.response?.status === 401) {
        setError('Bạn không có quyền truy cập danh sách đơn hàng.');
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy đơn hàng.');
      } else {
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
      }
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

  return (
    <div className="order-history-page container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Lịch Sử Đơn Hàng</h2>
      {success && <div className="success-message text-green-600 text-center">{success}</div>}
      {loading ? (
        <div className="text-center py-4 sm:py-6 text-gray-600">Đang tải...</div>
      ) : error ? (
        <div className="text-center py-4 sm:py-6 text-red-500">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-4 sm:py-6 text-gray-600">Bạn chưa có đơn hàng nào.</div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="order-card bg-white p-3 sm:p-4 rounded-lg shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 sm:mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Đơn #{order.id}</h3>
                <span className={`text-sm sm:text-base font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                <p>Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                <p>Tổng tiền: ${Number(order.total_price || 0).toFixed(2)}</p>
                <p>Phương thức: {order.payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : order.payment_method || 'Chưa xác định'}</p>
              </div>
              <Button
                variant="primary"
                size="small"
                onClick={() => navigate(`/orders/${order.id}`)}
                className="mt-2 sm:mt-3"
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

export default OrderHistory;