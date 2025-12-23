import React, { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import "./AddCarrier.scss";

export default function CarrierModal({
  isOpen,
  onClose,
  onSubmit,
  carrier = null,
}) {
  const [formData, setFormData] = useState({
    carrier_name: "",
    base_price: "",
    price_per_kg: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (carrier) {
      setFormData({
        carrier_name: carrier.carrier_name,
        base_price: carrier.base_price,
        price_per_kg: carrier.price_per_kg,
        is_active: carrier.is_active,
      });
    } else {
      setFormData({
        carrier_name: "",
        base_price: "",
        price_per_kg: "",
        is_active: true,
      });
    }
    setErrors({});
  }, [carrier, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Validate carrier name
    if (!formData.carrier_name?.trim()) {
      newErrors.carrier_name = "Tên đơn vị vận chuyển là bắt buộc";
    } else if (formData.carrier_name.trim().length > 255) {
      newErrors.carrier_name =
        "Tên đơn vị vận chuyển không được vượt quá 255 ký tự";
    }

    // Validate base price
    const basePrice = parseFloat(formData.base_price);
    if (!formData.base_price || isNaN(basePrice)) {
      newErrors.base_price = "Giá cơ bản là bắt buộc";
    } else if (basePrice <= 0) {
      newErrors.base_price = "Giá cơ bản phải lớn hơn 0";
    } else if (basePrice > 999999999) {
      newErrors.base_price = "Giá cơ bản quá lớn";
    }

    // Validate price per kg
    const pricePerKg = parseFloat(formData.price_per_kg);
    if (!formData.price_per_kg || isNaN(pricePerKg)) {
      newErrors.price_per_kg = "Giá theo kg là bắt buộc";
    } else if (pricePerKg <= 0) {
      newErrors.price_per_kg = "Giá theo kg phải lớn hơn 0";
    } else if (pricePerKg > 999999999) {
      newErrors.price_per_kg = "Giá theo kg quá lớn";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = value;

    // Xử lý số không âm cho giá
    if (
      (name === "base_price" || name === "price_per_kg") &&
      type === "number"
    ) {
      // Chỉ cho phép số dương hoặc rỗng
      if (value !== "" && parseFloat(value) < 0) {
        return; // Không cập nhật nếu là số âm
      }
      newValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : newValue,
    }));

    // Clear error khi người dùng sửa
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Chuẩn bị dữ liệu gửi lên server
    const submitData = {
      carrier_name: formData.carrier_name.trim(),
      base_price: parseFloat(formData.base_price),
      price_per_kg: parseFloat(formData.price_per_kg),
      is_active: formData.is_active,
    };

    try {
      await onSubmit(submitData);
      // Đóng modal và reset form sau khi thành công
      onClose();
      setFormData({
        carrier_name: "",
        base_price: "",
        price_per_kg: "",
        is_active: true,
      });
      setErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);

      // Xử lý lỗi từ backend
      if (error.response?.status === 409) {
        // Conflict - tên đã tồn tại
        const errorMsg =
          error.response?.data?.detail || "Tên đơn vị vận chuyển đã tồn tại";
        setErrors({ carrier_name: errorMsg });
      } else if (error.response?.status === 400) {
        // Bad request - validation error
        const errorMsg = error.response?.data?.detail || "Dữ liệu không hợp lệ";
        setErrors({ submit: errorMsg });
      } else {
        // Lỗi khác
        setErrors({ submit: "Có lỗi xảy ra. Vui lòng thử lại." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đóng modal khi click overlay
  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay" && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {carrier ? "Cập nhật đơn vị vận chuyển" : "Thêm đơn vị vận chuyển"}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            disabled={isSubmitting}
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              Tên đơn vị vận chuyển <span className="required">*</span>
            </label>
            <input
              type="text"
              name="carrier_name"
              value={formData.carrier_name}
              onChange={handleChange}
              className={`form-input ${errors.carrier_name ? "error" : ""}`}
              placeholder="Nhập tên đơn vị vận chuyển..."
              disabled={isSubmitting}
              maxLength={255}
              autoComplete="off"
            />
            {errors.carrier_name && (
              <span className="error-message">{errors.carrier_name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Giá cơ bản (đ) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="base_price"
              value={formData.base_price}
              onChange={handleChange}
              className={`form-input ${errors.base_price ? "error" : ""}`}
              placeholder="VD: 20000"
              disabled={isSubmitting}
              min="0"
              step="1000"
              autoComplete="off"
            />
            {errors.base_price && (
              <span className="error-message">{errors.base_price}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Giá theo kg (đ) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="price_per_kg"
              value={formData.price_per_kg}
              onChange={handleChange}
              className={`form-input ${errors.price_per_kg ? "error" : ""}`}
              placeholder="VD: 5000"
              disabled={isSubmitting}
              min="0"
              step="1000"
              autoComplete="off"
            />
            {errors.price_per_kg && (
              <span className="error-message">{errors.price_per_kg}</span>
            )}
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <label htmlFor="is_active">Hoạt động</label>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : carrier ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
