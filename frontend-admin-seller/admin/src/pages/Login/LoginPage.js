import React, { useState, useEffect } from "react";
import "./Login.scss";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved email
  useEffect(() => {
    const saved = localStorage.getItem("savedEmail");
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

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
    return true;
  };

  // Fake API call
  const fakeApiLogin = (email, password) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === "admin1@example.com" && password === "123456") {
          resolve({
            access_token: "fake-jwt-token",
            refresh_token: "fake-refresh-token",
            token_type: "bearer",
            expires_in: 3600,
            scope: "admin",
          });
        } else {
          reject({ detail: "Email hoặc mật khẩu không chính xác" });
        }
      }, 1000);
    });

  const handleLogin = async () => {
    setErrorMessage("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = await fakeApiLogin(email.trim(), password);

      // Lưu token
      localStorage.setItem("token", data.access_token);

      // Remember email
      if (remember) localStorage.setItem("savedEmail", email);
      else localStorage.removeItem("savedEmail");

      setErrorMessage("Đăng nhập thành công!");
      setLoading(false);

      // Redirect
      setTimeout(() => {
        window.location.href = "/transport";
      }, 800);
    } catch (err) {
      setErrorMessage(
        err.detail || "Không thể kết nối server. Vui lòng thử lại!"
      );
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
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

          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              placeholder="Nhập email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label>Ghi nhớ email</label>
          </div>

          <button
            className={`login-btn ${loading ? "loading" : ""}`}
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
