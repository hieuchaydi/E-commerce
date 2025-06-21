import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../api/api';
import Button from '../../components/common/Button';
import './SellerOrderManagement.css';

const SellerOrderManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user || user.role !== 'seller') {
      setError('Bạn không có quyền truy cập trang này.');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = { page, page_size: 10 }; // Thêm phân trang
        const response = await ordersAPI.getOrders(params);

        // Xử lý dữ liệu trả về (hỗ trợ cả pagination từ Django REST Framework)
        const data = response.results || response; // Lấy danh sách đơn hàng
        const total = response.count || data.length; // Tổng số đơn hàng
        setTotalPages(Math.ceil(total / 10));

        if (Array.isArray(data)) {
          const sellerOrders = data.filter(order => 
            order.items && Array.isArray(order.items) && 
            order.items.some(item => 
              item.product && item.product.seller && item.product.seller.id === user.id
            )
          );
          setOrders(sellerOrders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Error fetching seller orders:', err.message);
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, page]);

  const handleShipOrder = async (orderId) => {
    if (window.confirm('Bạn có chắc muốn đánh dấu đơn hàng đang giao?')) {
      try {
        const response = await ordersAPI.updateOrderStatus(orderId, { status: 'shipped' });
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: 'shipped' } : order
        ));
        console.log('Order shipped successfully:', response.data);
      } catch (err) {
        console.error('Error shipping order:', err.message);
        setError('Cập nhật trạng thái giao hàng thất bại.');
      }
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-500';
      case 'processing': return 'text-blue-500';
      case 'shipped': return 'text-purple-500';
      case 'completed': return 'text-green-600';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) return <div className="text-center py-6 text-gray-600">Đang tải...</div>;
  if (error) return <div className="text-center py-6 text-red-500">{error}</div>;

  return (
    <div className="seller-order-management container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        Quản Lý Đơn Hàng
      </h2>
      {orders.length === 0 ? (
        <p className="text-center py-4 text-gray-600">Không có đơn hàng nào để quản lý.</p>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-lg shadow-md">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Đơn hàng #{order.id}</h3>
                  <p>Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                  <p>Trạng thái: <span className={getStatusColor(order.status)}>{getStatusText(order.status)}</span></p>
                  <p>Tổng tiền: ${Number(order.total_price).toFixed(2)}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-700">Sản phẩm</h4>
                  {order.items && order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b py-2">
                      <div>
                        <p className="font-medium">{item.product?.name || 'Sản phẩm không xác định'}</p>
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                {order.status === 'pending' || order.status === 'processing' ? (
                  <Button
                    variant="success"
                    size="small"
                    onClick={() => handleShipOrder(order.id)}
                  >
                    Đánh dấu đang giao
                  </Button>
                ) : (
                  <p className="text-gray-600">Đơn hàng đã được xử lý.</p>
                )}
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="ml-2"
                >
                  Xem chi tiết
                </Button>
              </div>
            ))}
          </div>
          {/* Phân trang */}
          <div className="flex justify-center mt-4 gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              Trang trước
            </Button>
            <span className="text-gray-600">Trang {page} / {totalPages}</span>
            <Button
              variant="secondary"
              size="small"
              onClick={handleNextPage}
              disabled={page === totalPages}
            >
              Trang sau
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SellerOrderManagement;