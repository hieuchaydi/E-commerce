import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ordersAPI } from '../../api/api';
const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = parseInt(id, 10);
        if (isNaN(orderId)) {
          setError('ID đơn hàng không hợp lệ.');
          setLoading(false);
          return;
        }

        const response = await ordersAPI.getOrder(orderId);
        console.log('Full response:', response);
        if (!response || Object.keys(response).length === 0) {
          setError('Đơn hàng không tồn tại.');
        } else {
          setOrder(response);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Đơn hàng không tồn tại.');
        } else if (err.response?.status === 401) {
          setError('Bạn không có quyền truy cập đơn hàng này.');
        } else {
          setError('Không thể tải thông tin đơn hàng.');
        }
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;
  if (!order) return <div>Đơn hàng không tồn tại.</div>;

  // Xử lý total_price
  const totalNum = parseFloat(order.total_price);
  const totalDisplay = Number.isFinite(totalNum)
    ? totalNum.toFixed(2)
    : '0.00';

  return (
    <div className="order-detail-page container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
        Chi tiết đơn hàng #{order.id}
      </h1>
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
        <p><strong>Địa chỉ giao hàng:</strong> {order.shipping_address || 'Không có thông tin'}</p>
        <p><strong>Trạng thái:</strong> {order.status || 'Không có thông tin'}</p>
        <p><strong>Tổng tiền:</strong> ${totalDisplay}</p>

        {order.items && order.items.length > 0 ? (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mt-4 mb-2">Sản phẩm</h2>
            <ul className="space-y-2">
              {order.items.map((item) => {
                // Parse price an toàn
                const priceNum = parseFloat(item.price);
                const priceDisplay = Number.isFinite(priceNum)
                  ? priceNum.toFixed(2)
                  : '0.00';
                return (
                  <li key={item.id} className="text-sm sm:text-base text-gray-600">
                    {item.product?.name || 'Sản phẩm không xác định'} - {item.quantity} x ${priceDisplay}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p>Không có sản phẩm trong đơn hàng.</p>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
