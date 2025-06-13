  import React from 'react';
  import { useLocation, useNavigate } from 'react-router-dom';
  import Button from '../common/Button';
  import './OrderConfirmation.css';

  const OrderConfirmation = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    return (
      <div className="order-confirmation">
        <h2>Xác nhận đơn hàng</h2>
        {state?.success ? (
          <>
            <p>Đơn hàng của bạn đã được đặt thành công!</p>
            <p>Cảm ơn bạn đã mua sắm với chúng tôi. Đơn hàng sẽ sớm được xử lý và giao đến bạn.</p>
          </>
        ) : (
          <p>Đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
        )}
        <Button variant="primary" onClick={() => navigate('/')}>
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  };

  export default OrderConfirmation;