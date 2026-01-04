import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./Login.scss";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("savedEmail");
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
        `${API_URL}/auth/login/admin`,
        { email: email.trim(), password },
        { withCredentials: true }
      );

      // Lưu email nếu chọn remember
      if (remember) {
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      // Lưu role nếu có
      if (response.data?.scope) {
        localStorage.setItem("userRole", response.data.scope);
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 401) {
        setErrorMessage("Email hoặc mật khẩu không đúng");
      } else if (status === 403) {
        setErrorMessage("Tài khoản không có quyền Admin");
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

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-banner">
          <i className="bx bxs-lock banner-icon"></i>
          <h1>Chào mừng trở lại!</h1>
          <p>Hệ thống quản trị dành cho Admin</p>
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
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
