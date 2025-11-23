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
    console.log("LoginPage: Loading saved email");

    // Chỉ load saved email, KHÔNG check auth
    const saved = localStorage.getItem("savedEmail");
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []); // Không dependency, không check auth

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email");
      return false;
    }
    if (!validateEmail(email)) {
      setErrorMessage("Email không hợp lệ");
      return false;
    }
    if (!password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const handleLogin = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("Attempting login...");

      const response = await axios.post(
        `${API_URL}/auth/login/admin`,
        {
          email: email.trim(),
          password,
        },
        {
          withCredentials: true,
        }
      );

      console.log("Login successful:", response.data);

      // Lưu email nếu chọn "remember"
      if (remember) {
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      // Optional: Lưu role
      if (response.data?.scope) {
        localStorage.setItem("userRole", response.data.scope);
      }

      setErrorMessage("");
      setLoading(false);

      console.log("Redirecting to /transport");
      navigate("/transport", { replace: true });
    } catch (err) {
      setLoading(false);

      console.error("Login error:", err);
      console.error("Response:", err.response);
      console.error("Status:", err.response?.status);

      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        if (status === 401) {
          setErrorMessage("Email hoặc mật khẩu không đúng");
        } else if (status === 403) {
          setErrorMessage("Tài khoản không có quyền Admin");
        } else if (status === 429) {
          setErrorMessage("Quá nhiều lần đăng nhập. Vui lòng thử lại sau");
        } else {
          setErrorMessage(detail || `Lỗi ${status}: Đăng nhập thất bại`);
        }
      } else if (err.request) {
        setErrorMessage("Không thể kết nối server. Vui lòng kiểm tra mạng");
      } else {
        setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
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
            <div className={`error-message ${errorMessage ? "show" : ""}`}>
              {errorMessage}
            </div>
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
                onKeyPress={handleKeyPress}
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
                  onKeyPress={handleKeyPress}
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
