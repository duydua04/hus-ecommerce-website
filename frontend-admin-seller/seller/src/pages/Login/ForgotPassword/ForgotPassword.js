import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../utils/axiosConfig";
import "./ForgotPassword.scss";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [permissionToken, setPermissionToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Helper function to extract error message
  const getErrorMessage = (err) => {
    const detail = err.response?.data?.detail;

    // Nếu detail là string, trả về trực tiếp
    if (typeof detail === "string") {
      return detail;
    }

    // Nếu detail là array (validation errors)
    if (Array.isArray(detail)) {
      return detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
    }

    // Nếu detail là object
    if (typeof detail === "object" && detail !== null) {
      return detail.msg || detail.message || JSON.stringify(detail);
    }

    return null;
  };

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
      // Backend nhận qua Pydantic model ForgotPasswordRequest
      const response = await axios.post(
        `${API_URL}/auth/forgot-password`,
        {
          email: email.trim(),
          role: "seller",
        },
        { withCredentials: true } // ← QUAN TRỌNG: Để nhận cookie
      );

      // Backend set reset_token vào cookie, không cần lưu vào state
      // setResetToken() không cần nữa vì backend quản lý qua cookie
      setSuccessMessage("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = getErrorMessage(err);

      if (status === 404) {
        setErrorMessage("Email không tồn tại trong hệ thống");
      } else if (status === 429) {
        setErrorMessage("Quá nhiều yêu cầu. Vui lòng thử lại sau");
      } else if (errorMsg) {
        setErrorMessage(errorMsg);
      } else if (err.response) {
        setErrorMessage(`Lỗi ${status}: Không thể gửi OTP`);
      } else if (err.request) {
        setErrorMessage("Không thể kết nối server. Vui lòng kiểm tra mạng");
      } else {
        setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại");
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
      const response = await axios.post(
        `${API_URL}/auth/verify-otp`,
        {
          otp: otp.trim(),
          reset_token: resetToken, // Backend sẽ bỏ qua field này, lấy từ cookie
        },
        { withCredentials: true } // ← QUAN TRỌNG: Gửi cookie
      );

      // Backend cũng set permission_token vào cookie
      setPermissionToken(response.data.permission_token || "");
      setSuccessMessage("Xác thực thành công! Vui lòng đặt mật khẩu mới");
      setStep(3);
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = getErrorMessage(err);

      if (status === 400) {
        setErrorMessage("Mã OTP không đúng hoặc đã hết hạn");
      } else if (errorMsg) {
        setErrorMessage(errorMsg);
      } else if (err.response) {
        setErrorMessage(`Lỗi ${status}: Xác thực thất bại`);
      } else if (err.request) {
        setErrorMessage("Không thể kết nối server. Vui lòng kiểm tra mạng");
      } else {
        setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại");
      }
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
      await axios.post(
        `${API_URL}/auth/reset-password`,
        {
          new_password: newPassword,
          confirm_password: confirmPassword,
          permission_token: permissionToken, // Backend sẽ bỏ qua, lấy từ cookie
        },
        { withCredentials: true } // ← QUAN TRỌNG: Gửi cookie
      );

      setSuccessMessage("Đặt lại mật khẩu thành công!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/seller/login");
      }, 2000);
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = getErrorMessage(err);

      if (status === 400) {
        setErrorMessage("Phiên làm việc đã hết hạn. Vui lòng thử lại");
      } else if (errorMsg) {
        setErrorMessage(errorMsg);
      } else if (err.response) {
        setErrorMessage(`Lỗi ${status}: Không thể đặt lại mật khẩu`);
      } else if (err.request) {
        setErrorMessage("Không thể kết nối server. Vui lòng kiểm tra mạng");
      } else {
        setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/seller/login");
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
          <i className="bx bxs-lock-open banner-icon"></i>
          <h1>Quên mật khẩu?</h1>
          <p>Đừng lo lắng! Chúng tôi sẽ giúp bạn lấy lại tài khoản</p>
        </div>

        <div className="forgot-form-section">
          <h2 className="form-title">Khôi phục tài khoản Seller</h2>

          {renderStepIndicator()}

          {errorMessage && (
            <div className="error-message show">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="success-message show">{successMessage}</div>
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
                  onKeyDown={(e) => e.key === "Enter" && handleRequestOTP(e)}
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
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP(e)}
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
                <div className="input-wrapper">
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
                <div className="input-wrapper">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleResetPassword(e)
                    }
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                    }
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
