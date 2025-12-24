// src/pages/Login/ForgotPassword/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../../services/api';
import "./ForgotPassword.css";

const API_BASE_URL = 'http://localhost:8000';

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("buyer");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e?.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email");
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage("Email không hợp lệ");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // API call với fetch (vì backend dùng cookie)
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          role: role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send OTP');
      }

      const data = await response.json();
      setSuccessMessage("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
    } catch (err) {
      console.error('Forgot password error:', err);
      
      if (err.message.includes("404") || err.message.includes("not found")) {
        setErrorMessage("Email không tồn tại trong hệ thống");
      } else if (err.message.includes("429")) {
        setErrorMessage("Quá nhiều yêu cầu. Vui lòng thử lại sau");
      } else {
        setErrorMessage(err.message || "Không thể gửi OTP. Vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();

    if (!otp.trim()) {
      setErrorMessage("Vui lòng nhập mã OTP");
      return;
    }
    if (otp.trim().length !== 6) {
      setErrorMessage("Mã OTP phải có 6 chữ số");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies
        body: JSON.stringify({
          otp: otp.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'OTP verification failed');
      }

      setSuccessMessage("Xác thực thành công! Vui lòng đặt mật khẩu mới");
      setStep(3);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setErrorMessage(err.message || "Mã OTP không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();

    if (!newPassword.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Reset password failed');
      }

      setSuccessMessage("Đặt lại mật khẩu thành công!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage(err.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${step >= 1 ? "active" : ""}`}>
        <span className="step-number">1</span>
        <span className="step-label">Email</span>
      </div>
      <div className="step-line"></div>
      <div className={`step ${step >= 2 ? "active" : ""}`}>
        <span className="step-number">2</span>
        <span className="step-label">OTP</span>
      </div>
      <div className="step-line"></div>
      <div className={`step ${step >= 3 ? "active" : ""}`}>
        <span className="step-number">3</span>
        <span className="step-label">Mật khẩu mới</span>
      </div>
    </div>
  );

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-password-container">
        <div className="forgot-banner">
          <div className="banner-content">
            <div className="brand-logo">🔐</div>
            <h1>Quên mật khẩu?</h1>
            <p>Đừng lo lắng! Chúng tôi sẽ giúp bạn lấy lại tài khoản</p>
          </div>
        </div>

        <div className="forgot-form-section">
          <h2 className="form-title">Khôi phục tài khoản</h2>

          {renderStepIndicator()}

          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {/* Step 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP}>
              <p className="form-description">
                Nhập email đã đăng ký để nhận mã xác thực
              </p>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Nhập email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className={`submit-btn ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Đang gửi...
                  </>
                ) : (
                  "Gửi mã OTP"
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <p className="form-description">
                Mã OTP đã được gửi đến <strong>{email}</strong>
              </p>

              <div className="form-group">
                <label htmlFor="otp">Mã OTP (6 chữ số)</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Nhập mã OTP..."
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength="6"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className={`submit-btn ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Đang xác thực...
                  </>
                ) : (
                  "Xác thực OTP"
                )}
              </button>

              <button
                type="button"
                className="back-btn"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Quay lại
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <p className="form-description">
                Đặt mật khẩu mới cho tài khoản của bạn
              </p>

              <div className="form-group">
                <label htmlFor="new-password">Mật khẩu mới</label>
                <div className="password-input">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
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

              <div className="form-group">
                <label htmlFor="confirm-password">Xác nhận mật khẩu</label>
                <div className="password-input">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`submit-btn ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Đang xử lý...
                  </>
                ) : (
                  "Đặt lại mật khẩu"
                )}
              </button>
            </form>
          )}

          <div className="footer-links">
            <button
              type="button"
              className="link-btn"
              onClick={handleBackToLogin}
            >
              ← Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;