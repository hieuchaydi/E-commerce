import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api/api';
import validator from 'validator';  // Thư viện để validate email

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validator.isEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authAPI.forgotPassword({ email });
      setMessage('Nếu tài khoản tồn tại, liên kết đặt lại mật khẩu đã được gửi đến email của bạn.');
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Quên mật khẩu</h2>
        {message && <p className="mb-4 text-green-600">{message}</p>}
        {error && <p className="mb-4 text-red-600">{error}</p>}
        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 px-4 py-3 text-white disabled:bg-blue-300"
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;