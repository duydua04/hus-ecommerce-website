// src/pages/Login/BuyerLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './BuyerLogin.css';

const API_URL = 'http://localhost:8000';

function BuyerLogin() {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedBuyerEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  // đăng nhập rồi thì chuyển đén trang home
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.auth.getMe();
        if (user && user.role === 'buyer' && window.location.pathname !== '/home') {
          navigate('/home', { replace: true });
        }
      } catch (err) {
        // Chưa đăng nhập thì ở trang login
        console.log('Not authenticated');
      }
    };
    checkAuth();
  }, [navigate]);

  // Email hợp lệ
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Đăng nhập thủ công
  const handleLogin = async (e) => {
    e?.preventDefault();

    // Validation
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Email không hợp lệ');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
        const response = await api.auth.loginBuyer(email.trim(), password);

      console.log('Login successful');

      // Lưu email nếu chọn checkbox
      if (remember) {
        localStorage.setItem('savedBuyerEmail', email);
      } else {
        localStorage.removeItem('savedBuyerEmail');
      }

      // Store access token
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
      }

      // Store user role
      localStorage.setItem('userRole', 'buyer');

      // chuyển đến trang home
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err);

      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 401) {
        setErrorMessage('Email hoặc mật khẩu không đúng');
      } else if (status === 403) {
        setErrorMessage('Tài khoản chưa đăng ký');
      } else if (status === 429) {
        setErrorMessage('Quá nhiều lần đăng nhập. Vui lòng thử lại sau');
      } else if (err.response) {
        setErrorMessage(detail || `Lỗi ${status}: Đăng nhập thất bại`);
      } else if (err.request) {
        setErrorMessage('Không thể kết nối server. Vui lòng kiểm tra mạng');
      } else {
        setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login/buyer`;
  };

  // Link đến trang đăng ký
  const handleRegister = () => {
    navigate('/register');
  };

  // Link đến trang quên mật khẩu
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Left Banner */}
        <div className="login-banner">
          <div className="banner-content">
            <div className="brand-logo">🛍️</div>
            <h1>Chào mừng trở lại!</h1>
            <p>Đăng nhập để tiếp tục mua sắm</p>
            <div className="banner-features">
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Giao hàng nhanh chóng</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Thanh toán an toàn</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="login-form-section">
          <div className="form-header">
            <h2>Đăng nhập</h2>
            <p>Vui lòng nhập thông tin để tiếp tục</p>
          </div>

          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="text"
                placeholder="Nhập email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                className="forgot-link"
                onClick={handleForgotPassword}
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              className={`login-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Đang xử lý...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="divider">
            <span>HOẶC</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Đăng nhập với Google
          </button>

          <div className="register-section">
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                className="register-link"
                onClick={handleRegister}
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuyerLogin;