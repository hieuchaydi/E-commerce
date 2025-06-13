import React, { useState, useEffect } from 'react';
import { productsAPI, ordersAPI } from '../../api/api';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          productsAPI.getProducts({ page: 1, page_size: 10 }),
          ordersAPI.getOrders({ page: 1, page_size: 10 }),
        ]);

        const productsData = productsRes.data.results || productsRes.data || [];
        const ordersData = ordersRes.data.results || ordersRes.data || [];

        console.log('Seller Dashboard - Products:', productsData);
        console.log('Seller Dashboard - Orders:', ordersData);

        setProducts(productsData.slice(0, 5));
        setOrders(ordersData);

        setStats({
          totalProducts: productsData.length,
          totalSales: ordersData.reduce(
            (sum, order) => sum + (parseFloat(order.total_price) || 0),
            0
          ),
          pendingOrders: ordersData.filter(
            (order) => order.status === 'pending'
          ).length,
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Không thể tải dữ liệu dashboard';
        console.error('Fetch error:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    setError(null);
    try {
      await ordersAPI.updateOrderStatus(orderId, { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      setSuccessMessage(`Cập nhật trạng thái đơn hàng #${orderId} thành công`);
      setTimeout(() => setSuccessMessage(null), 3000);
      console.log(`Updated order ${orderId} status to: ${newStatus}`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Lỗi khi cập nhật trạng thái đơn hàng';
      console.error('Status update error:', err);
      setError(errorMessage);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Đang chờ' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipped', label: 'Đã giao' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  if (loading) return <div className="loading">Đang tải dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="seller-dashboard">
      <h1>Dashboard Người bán</h1>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="stats-container">
        <div className="stat-card">
          <h3>Tổng Sản phẩm</h3>
          <p>{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Tổng Doanh thu</h3>
          <p>${(parseFloat(stats.totalSales) || 0).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Đơn hàng đang chờ</h3>
          <p>{stats.pendingOrders}</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="recent-products">
          <div className="section-header">
            <h2>Sản phẩm gần đây</h2>
            <Link to="/seller/products" className="view-all">
              Xem tất cả
            </Link>
          </div>
          {products.length === 0 ? (
            <p>Không tìm thấy sản phẩm</p>
          ) : (
            <ul className="products-list">
              {products.map((product) => (
                <li key={product.id}>
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                  <span>${(parseFloat(product.price) || 0).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="recent-orders">
          <div className="section-header">
            <h2>Đơn hàng gần đây</h2>
            <Link to="/orders" className="view-all">
              Xem tất cả
            </Link>
          </div>
          {orders.length === 0 ? (
            <p>Không tìm thấy đơn hàng</p>
          ) : (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Đơn hàng</th>
                    <th>Trạng thái</th>
                    <th>Tổng tiền</th>
                    <th>Cập nhật trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link to={`/orders/${order.id}`}>Đơn hàng #{order.id}</Link>
                      </td>
                      <td>
                        <span className={`status-${order.status}`}>
                          {statusOptions.find((opt) => opt.value === order.status)?.label || order.status}
                        </span>
                      </td>
                      <td>${(parseFloat(order.total_price) || 0).toFixed(2)}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingOrder === order.id}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;