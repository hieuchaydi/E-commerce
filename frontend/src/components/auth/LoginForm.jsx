import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import './LoginForm.css';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({ username: '', password: '', general: '' });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef(null);
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
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (name === 'username' && value.length < 3) {
      setErrors((prev) => ({ ...prev, username: 'Tên người dùng phải dài ít nhất 3 ký tự' }));
    } else if (name === 'password' && value.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Mật khẩu phải dài ít nhất 6 ký tự' }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ username: '', password: '', general: '' });
    setLoading(true);
    try {
      await login(credentials, rememberMe);
      navigate('/', { replace: true });
    } catch (err) {
      const errorData = err.response?.data || {};
      if (errorData.username || errorData.password) {
        setErrors({
          username: errorData.username?.[0] || '',
          password: errorData.password?.[0] || '',
          general: '',
        });
      } else {
        setErrors({
          general:
            errorData.non_field_errors?.[0] ||
            errorData.detail ||
            'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.',
        });
      }
      usernameRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className="login-container">
      <canvas ref={canvasRef} className="particle-canvas" />
      <div className="login-card">
        <h2 className="login-title">Đăng nhập</h2>
        {errors.general && (
          <div className="login-error" role="alert">
            {errors.general}
          </div>
        )}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Tên người dùng
            </label>
            <input
              type="text"
              id="username"
              name="username"
              ref={usernameRef}
              value={credentials.username}
              onChange={handleChange}
              required
              autoComplete="username"
              className={`form-input ${errors.username ? 'input-error' : ''}`}
            />
            {errors.username && <span className="input-error-message">{errors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
              />
              <span
                className="password-toggle"
                onClick={togglePasswordVisibility}
                role="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && togglePasswordVisibility()}
              >
                <svg
                  className="password-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {showPassword ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7 1.275-4.057 5.065-7 9.543-7 4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.668 3.825M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.75 0a9.015 9.015 0 01-1.207 4.432M3.75 12a9.015 9.015 0 011.207-4.432m5.293 4.432l-6.586 6.586M18.586 18.586l-6.586-6.586"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.75 0a9.015 9.015 0 01-9.75 9c-4.478 0-8.268-2.943-9.543-7 1.275-4.057 5.065-7 9.543-7 4.478 0 8.268 2.943 9.543 7z"
                    />
                  )}
                </svg>
              </span>
            </div>
            {errors.password && <span className="input-error-message">{errors.password}</span>}
          </div>
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              Nhớ mật khẩu
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Quên mật khẩu?
            </Link>
          </div>
          <Button type="submit" disabled={loading} className="login-button">
            {loading ? (
              <>
                <svg className="spinner" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" stroke="#fff" strokeWidth="5" fill="none" />
                </svg>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </Button>
        </form>
        <p className="register-link">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;