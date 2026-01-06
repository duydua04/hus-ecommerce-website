import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../utils/axiosConfig";
import "./Register.scss";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function SellerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    fname: "",
    lname: "",
    shopName: "",
    password: "",
    confirmPassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[0-9]{10,11}$/.test(phone);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e?.preventDefault();

    // Validation
    if (!formData.email.trim()) {
      setErrorMessage("Vui lòng nhập email");
      return;
    }
    if (!validateEmail(formData.email)) {
      setErrorMessage("Email không hợp lệ");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại");
      return;
    }
    if (!validatePhone(formData.phone)) {
      setErrorMessage("Số điện thoại phải có 10-11 chữ số");
      return;
    }
    if (!formData.fname.trim()) {
      setErrorMessage("Vui lòng nhập họ");
      return;
    }
    if (!formData.lname.trim()) {
      setErrorMessage("Vui lòng nhập tên");
      return;
    }
    if (!formData.shopName.trim()) {
      setErrorMessage("Vui lòng nhập tên cửa hàng");
      return;
    }
    if (!formData.password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage("Vui lòng đồng ý với điều khoản sử dụng");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/auth/register/seller`,
        {
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          fname: formData.fname.trim(),
          lname: formData.lname.trim(),
          shop_name: formData.shopName.trim(),
          password: formData.password,
        },
        { withCredentials: true }
      );

      setSuccessMessage("Đăng ký thành công! Đang chuyển hướng...");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login", {
          state: { message: "Đăng ký thành công! Vui lòng đăng nhập." },
        });
      }, 2000);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 400) {
        if (detail?.includes("Email") || detail?.includes("email")) {
          setErrorMessage("Email đã được sử dụng");
        } else if (detail?.includes("phone")) {
          setErrorMessage("Số điện thoại đã được sử dụng");
        } else {
          setErrorMessage(detail || "Email hoặc số điện thoại đã tồn tại");
        }
      } else if (status === 422) {
        setErrorMessage("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại");
      } else if (status === 429) {
        setErrorMessage("Quá nhiều yêu cầu. Vui lòng thử lại sau");
      } else if (err.response) {
        setErrorMessage(detail || `Lỗi ${status}: Đăng ký thất bại`);
      } else if (err.request) {
        setErrorMessage("Không thể kết nối server. Vui lòng kiểm tra mạng");
      } else {
        setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const nextUrl = "/dashboard";
    window.location.href = `${API_URL}/auth/google/login/seller?next=${encodeURIComponent(
      nextUrl
    )}`;
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="seller-register-wrapper">
      <div className="seller-register-container">
        <div className="register-banner">
          <i className="bx bxs-store-alt banner-icon"></i>
          <h1>Bắt đầu với cửa hàng của bạn!</h1>
          <p>Kinh doanh trực tuyến ngay hôm nay</p>
          <div className="feature-list">
            <div className="feature-item">
              <i className="bx bx-check-circle"></i>
              <span>Quản lý sản phẩm dễ dàng</span>
            </div>
            <div className="feature-item">
              <i className="bx bx-check-circle"></i>
              <span>Theo dõi đơn hàng realtime</span>
            </div>
            <div className="feature-item">
              <i className="bx bx-check-circle"></i>
              <span>Báo cáo doanh thu chi tiết</span>
            </div>
          </div>
        </div>

        <div className="register-form-section">
          <h2 className="form-title">Đăng ký tài khoản mới</h2>
          <p className="form-subtitle">Vui lòng nhập thông tin</p>

          {errorMessage && (
            <div className="error-message show">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="success-message show">{successMessage}</div>
          )}

          <form onSubmit={handleRegister}>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Nhập email..."
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">
                Số điện thoại <span className="required">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Nhập số điện thoại..."
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData((prev) => ({ ...prev, phone: value }));
                }}
                maxLength="11"
                autoComplete="tel"
                disabled={loading}
              />
            </div>

            {/* First Name & Last Name */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fname">
                  Họ <span className="required">*</span>
                </label>
                <input
                  id="fname"
                  name="fname"
                  type="text"
                  placeholder="Họ..."
                  value={formData.fname}
                  onChange={handleChange}
                  autoComplete="given-name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lname">
                  Tên <span className="required">*</span>
                </label>
                <input
                  id="lname"
                  name="lname"
                  type="text"
                  placeholder="Tên..."
                  value={formData.lname}
                  onChange={handleChange}
                  autoComplete="family-name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Shop Name */}
            <div className="form-group">
              <label htmlFor="shopName">
                Tên cửa hàng <span className="required">*</span>
              </label>
              <input
                id="shopName"
                name="shopName"
                type="text"
                placeholder="Nhập tên cửa hàng..."
                value={formData.shopName}
                onChange={handleChange}
                autoComplete="organization"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">
                Mật khẩu <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Xác nhận mật khẩu <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu..."
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister(e)}
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

            {/* Terms Agreement */}
            <div className="checkbox-group">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="terms">
                Tôi đồng ý với{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  Điều khoản sử dụng
                </a>{" "}
                và{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Chính sách bảo mật
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`register-btn ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Đang xử lý...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <div className="divider">
            <span>HOẶC</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleRegister}
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
            Đăng ký với Google
          </button>

          <div className="footer-links">
            <span>Đã có tài khoản?</span>
            <button
              type="button"
              className="link-btn"
              onClick={handleBackToLogin}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerRegister;
