import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import './OrderStatus.css';

const OrderStatus = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrder();
    }
  }, [user, id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getOrder(id);
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
  };

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

  const getStatusSteps = (status) => {
    const steps = [
      { status: 'pending', label: 'Chờ xử lý', completed: false },
      { status: 'processing', label: 'Đang xử lý', completed: false },
      { status: 'shipped', label: 'Đang giao hàng', completed: false },
      { status: 'completed', label: 'Đã hoàn thành', completed: false },
    ];

    let reached = true;
    return steps.map((step) => {
      if (step.status === status.toLowerCase()) {
        reached = false;
        return { ...step, completed: true, active: true };
      }
      return { ...step, completed: reached };
    });
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

  const statusSteps = getStatusSteps(order.status);

  return (
    <div className="order-status-page container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        Trạng Thái Đơn Hàng #{order.id}
      </h2>
      {success && <div className="success-message text-green-600 text-center mb-4">{success}</div>}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Theo Dõi Giao Hàng</h3>
        <div className="status-timeline">
          {statusSteps.map((step, index) => (
            <div
              key={step.status}
              className={`status-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
            >
              <div className="status-icon">
                {step.completed ? '✔' : index + 1}
              </div>
              <div className="status-label">{step.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between items-center">
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
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;