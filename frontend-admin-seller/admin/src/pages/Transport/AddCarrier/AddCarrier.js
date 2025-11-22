import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
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

    if (!formData.carrier_name?.trim()) {
      newErrors.carrier_name = "Tên đơn vị vận chuyển là bắt buộc";
    }

    if (!formData.base_price || formData.base_price <= 0) {
      newErrors.base_price = "Giá cơ bản phải lớn hơn 0";
    }

    if (!formData.price_per_kg || formData.price_per_kg <= 0) {
      newErrors.price_per_kg = "Giá theo kg phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

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
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ submit: "Có lỗi xảy ra. Vui lòng thử lại." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {carrier ? "Cập nhật đơn vị vận chuyển" : "Thêm đơn vị vận chuyển"}
          </h2>
          <button onClick={onClose} className="modal-close">
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
              placeholder="Nhập tên..."
              disabled={isSubmitting}
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
              placeholder="20000"
              disabled={isSubmitting}
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
              placeholder="5000"
              disabled={isSubmitting}
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
            <div className="error-message">{errors.submit}</div>
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
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
