import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../api/api';
import Button from '../../components/common/Button';
import './Checkout.css';
import { toast, ToastContainer } from 'react-toastify';

const Checkout = () => {
  const { cartItems, clearCart, error: cartError } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: user?.username || '',
    phone: '',
    address: '',
    city: '',
    country: 'Vietnam',
    discount_code: '',
  });
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price || 0) * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax - discountAmount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyDiscount = async () => {
    try {
      const response = await ordersAPI.validateDiscountCode(formData.discount_code, subtotal);
      const amount = response.discount_amount; // Đã được chuyển thành số trong api.js
      setDiscountAmount(amount);
      setLocalError('');
      toast.success(`Áp dụng mã giảm giá thành công! Giảm: $${amount.toFixed(2)}`);
    } catch (err) {
      console.error('Discount error:', err.message);
      toast.warning(err.message || 'Mã giảm giá không hợp lệ');
      setLocalError(err.message || 'Mã giảm giá không hợp lệ');
      setDiscountAmount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setLocalError('Vui lòng đăng nhập để thanh toán.');
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      return;
    }

    if (!formData.full_name || !formData.phone || !formData.address || !formData.city || !formData.country) {
      setLocalError('Vui lòng nhập đầy đủ thông tin giao hàng.');
      return;
    }

    if (cartItems.length === 0) {
      setLocalError('Giỏ hàng trống.');
      return;
    }

    setLoading(true);
    setLocalError('');

    try {
      const shippingAddressString = `${formData.full_name}, ${formData.address}, ${formData.city}, ${formData.country}, ${formData.phone}`;
      const orderData = {
        shipping_address: shippingAddressString,
        payment_method: 'COD',
        discount_code: formData.discount_code || null,
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price || 0),
        })),
        total_price: total,
      };
      const order = await ordersAPI.createOrder(orderData);
      await clearCart();
      toast.success('Đặt hàng thành công! Vui lòng kiểm tra email để xác nhận.');
      navigate(`/orders/${order.id}`, { state: { success: 'Đặt hàng thành công!' } });
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Thanh toán thất bại. Vui lòng thử lại.';
      setLocalError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (cartError) return <div className="error-message">Lỗi: {cartError}</div>;

  return (
    <div className="checkout-page container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ToastContainer />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Thanh Toán</h2>
      {localError && <div className="error-message">{localError}</div>}
      <div className="checkout-container grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <form onSubmit={handleSubmit} className="shipping-form">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">Thông Tin Giao Hàng</h3>
          <div className="form-group">
            <label htmlFor="full_name">Họ và Tên</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Nguyen Van A"
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Số Điện Thoại</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0123456789"
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Địa Chỉ</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Đường Láng, Đống Đa"
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">Thành Phố</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Hà Nội"
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label htmlFor="country">Quốc Gia</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Vietnam"
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label htmlFor="discount_code">Mã Giảm Giá</label>
            <div className="flex">
              <input
                type="text"
                id="discount_code"
                name="discount_code"
                value={formData.discount_code}
                onChange={handleChange}
                placeholder="Nhập mã giảm giá"
                className="input-field flex-grow"
              />
              <Button
                type="button"
                variant="primary"
                onClick={handleApplyDiscount}
                className="ml-2"
              >
                Áp dụng
              </Button>
            </div>
          </div>
          <div className="form-group">
            <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2">Phương Thức Thanh Toán</h4>
            <label className="flex items-center gap-2">
              <input type="radio" name="payment_method" value="COD" checked disabled className="text-pink-500" />
              Thanh toán khi nhận hàng (COD)
            </label>
          </div>
          <Button
            type="submit"
            variant="success"
            disabled={loading || cartItems.length === 0}
            className="w-full mt-3 sm:mt-4"
          >
            {loading ? 'Đang xử lý...' : 'Đặt Hàng'}
          </Button>
        </form>
        <div className="order-summary bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">Tóm Tắt Đơn Hàng</h3>
          {cartItems.length === 0 ? (
            <p>Giỏ hàng trống</p>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item flex justify-between text-sm sm:text-base mb-1 sm:mb-2">
                  <span className="line-clamp-1">{item.product.name}</span>
                  <span>
                    {item.quantity} x ${Number(item.product.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="summary-row border-t pt-2 mt-2">
                <span>Tạm tính</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Thuế (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="summary-row">
                  <span>Giảm giá</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total font-semibold text-base sm:text-lg">
                <span>Tổng cộng</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;