import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import './RegisterForm.css';

const RegisterForm = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    role: 'customer',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    general: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Particle background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrame;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: Math.random() * 2 - 1,
      speedY: Math.random() * 2 - 1,
      color: `hsl(${Math.random() * 360}, 70%, 70%)`,
    });

    const updateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          particles[i] = createParticle();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
      });
      animationFrame = requestAnimationFrame(updateParticles);
    };

    resizeCanvas();
    for (let i = 0; i < 50; i++) {
      particles.push(createParticle());
    }
    updateParticles();

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    if (name === 'username' && value.length < 3) {
      setErrors((prev) => ({ ...prev, username: 'Tên người dùng phải dài ít nhất 3 ký tự' }));
    } else if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: 'Email không hợp lệ' }));
    } else if (name === 'password' && value.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Mật khẩu phải dài ít nhất 6 ký tự' }));
    } else if (name === 'password2' && value !== userData.password) {
      setErrors((prev) => ({ ...prev, password2: 'Mật khẩu không khớp' }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [userData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userData.password !== userData.password2) {
      setErrors((prev) => ({ ...prev, password2: 'Mật khẩu không khớp' }));
      return;
    }
    setErrors({ username: '', email: '', password: '', password2: '', general: '' });
    setLoading(true);
    try {
      await register(userData);
      navigate('/login', { replace: true });
    } catch (err) {
      const errorData = err.response?.data || {};
      if (errorData.username || errorData.email || errorData.password) {
        setErrors({
          username: errorData.username?.[0] || '',
          email: errorData.email?.[0] || '',
          password: errorData.password?.[0] || '',
          password2: '',
          general: '',
        });
      } else {
        setErrors({
          general:
            errorData.non_field_errors?.[0] ||
            errorData.detail ||
            'Đăng ký thất bại. Vui lòng thử lại.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <canvas ref={canvasRef} className="particle-canvas" />
      <div className="register-card">
        <h2 className="register-title">Đăng ký</h2>
        {errors.general && (
          <div className="register-error" role="alert">
            {errors.general}
          </div>
        )}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Tên người dùng
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={userData.username}
              onChange={handleChange}
              required
              className={`form-input ${errors.username ? 'input-error' : ''}`}
            />
            {errors.username && <span className="input-error-message">{errors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              required
              className={`form-input ${errors.email ? 'input-error' : ''}`}
            />
            {errors.email && <span className="input-error-message">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              required
              className={`form-input ${errors.password ? 'input-error' : ''}`}
            />
            {errors.password && <span className="input-error-message">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password2" className="form-label">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={userData.password2}
              onChange={handleChange}
              required
              className={`form-input ${errors.password2 ? 'input-error' : ''}`}
            />
            {errors.password2 && <span className="input-error-message">{errors.password2}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Vai trò
            </label>
            <select
              id="role"
              name="role"
              value={userData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="customer">Khách hàng</option>
              <option value="seller">Người bán</option>
            </select>
          </div>
          {userData.role === 'seller' && (
            <div className="seller-fields">
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address" className="form-label">
                  Địa chỉ
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={userData.address}
                  onChange={handleChange}
                  className="form-textarea"
                />
              </div>
            </div>
          )}
          <Button type="submit" disabled={loading} className="register-button">
            {loading ? (
              <>
                <svg className="spinner" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" stroke="#fff" strokeWidth="5" fill="none" />
                </svg>
                Đang đăng ký...
              </>
            ) : (
              'Đăng ký'
            )}
          </Button>
        </form>
        <p className="login-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;