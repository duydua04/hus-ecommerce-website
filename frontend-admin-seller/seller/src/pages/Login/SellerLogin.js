import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./SellerLogin.scss";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function SellerLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("savedSellerEmail");
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e) => {
    e?.preventDefault();

    // Validation
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email");
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage("Email không hợp lệ");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/auth/login/seller`,
        { email: email.trim(), password },
        { withCredentials: true }
      );

      // Lưu email nếu chọn remember
      if (remember) {
        localStorage.setItem("savedSellerEmail", email);
      } else {
        localStorage.removeItem("savedSellerEmail");
      }

      // Lưu role nếu có
      if (response.data?.scope) {
        localStorage.setItem("userRole", response.data.scope);
      }

      // Chuyển đến trang products sau khi đăng nhập thành công
      navigate("/seller/products", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 401) {
        setErrorMessage("Email hoặc mật khẩu không đúng");
      } else if (status === 403) {
        setErrorMessage("Tài khoản không có quyền Seller");
      } else if (status === 429) {
        setErrorMessage("Quá nhiều lần đăng nhập. Vui lòng thử lại sau");
      } else if (err.response) {
        setErrorMessage(detail || `Lỗi ${status}: Đăng nhập thất bại`);
      } else if (err.request) {
        setErrorMessage("Không thể kết nối server. Vui lòng kiểm tra mạng");
      } else {
        setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Backend endpoint: /auth/google/login/seller
    // Không cần truyền role vì đã có trong URL
    window.location.href = `${API_URL}/auth/google/login/seller`;
  };

  const handleForgotPassword = () => {
    navigate("/seller/forgot-password");
  };

  const handleRegister = () => {
    navigate("/seller/register");
  };

  return (
    <div className="seller-login-wrapper">
      <div className="seller-login-container">
        <div className="login-banner">
          <i className="bx bxs-store banner-icon"></i>
          <h1>Chào mừng đến với trang của Seller!</h1>
          <p>Quản lý cửa hàng và sản phẩm của bạn</p>
        </div>

        <div className="login-form-section">
          <h2 className="login-title">Đăng nhập</h2>
          <p className="login-subtitle">Vui lòng nhập thông tin để tiếp tục</p>

          {errorMessage && (
            <div className="error-message show">{errorMessage}</div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="text"
                placeholder="Nhập email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="checkbox-group">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember">Ghi nhớ email</label>
            </div>

            <button
              type="submit"
              className={`login-btn ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
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

          <div className="footer-links">
            <button
              type="button"
              className="link-btn"
              onClick={handleForgotPassword}
            >
              Quên mật khẩu?
            </button>
            <span className="divider-dot"> </span>
            <button type="button" className="link-btn" onClick={handleRegister}>
              Đăng ký tài khoản mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerLogin;
