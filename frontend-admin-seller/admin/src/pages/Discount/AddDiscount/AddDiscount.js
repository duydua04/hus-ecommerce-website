import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function DiscountModal({
  isOpen,
  onClose,
  onSubmit,
  discount = null,
}) {
  const [formData, setFormData] = useState({
    code: "",
    discount_percent: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= LOAD DATA (EDIT) ================= */
  useEffect(() => {
    if (!isOpen) return;

    if (discount) {
      setFormData({
        code: discount.code || "",
        discount_percent: discount.discount_percent ?? "",
        min_order_value: discount.min_order_value ?? "",
        max_discount: discount.max_discount ?? "",
        usage_limit: discount.usage_limit ?? "",
        start_date: discount.start_date || "",
        end_date: discount.end_date || "",
        is_active: discount.is_active ?? true,
      });
    } else {
      resetForm();
    }

    setErrors({});
  }, [discount, isOpen]);

  const resetForm = () => {
    setFormData({
      code: "",
      discount_percent: "",
      min_order_value: "",
      max_discount: "",
      usage_limit: "",
      start_date: "",
      end_date: "",
      is_active: true,
    });
  };

  /* ================= VALIDATE ================= */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Mã giảm giá là bắt buộc";
    }

    const percent = parseFloat(formData.discount_percent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      newErrors.discount_percent = "Phần trăm giảm phải từ 1 đến 100";
    }

    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.start_date)
    ) {
      newErrors.end_date = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCodeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      code: e.target.value.toUpperCase(),
    }));

    if (errors.code) {
      setErrors((prev) => ({ ...prev, code: "" }));
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const submitData = {
      code: formData.code,
      discount_percent: parseFloat(formData.discount_percent),
      min_order_value: formData.min_order_value
        ? parseFloat(formData.min_order_value)
        : 0,
      max_discount: formData.max_discount
        ? parseFloat(formData.max_discount)
        : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: formData.is_active,
    };

    try {
      await onSubmit(submitData);
      onClose();
      resetForm();
    } catch (err) {
      setErrors({
        submit: err?.detail || "Có lỗi xảy ra, vui lòng thử lại",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  /* ================= RENDER ================= */
  return (
    <div className="modal-overlay">
      <div className="modal modal--large">
        {/* Header */}
        <div className="modal__header">
          <h2 className="modal__title">
            {discount ? "Cập nhật mã giảm giá" : "Thêm mã giảm giá"}
          </h2>
          <button
            className="modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal__body">
          {/* Code */}
          <div className="form-group">
            <label className="form-group__label">
              Mã giảm giá <span className="required">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleCodeChange}
              disabled={!!discount || isSubmitting}
              className={`form-group__input ${
                errors.code ? "form-group__input--error" : ""
              }`}
              placeholder="VD: SALE10"
            />
            {errors.code && (
              <span className="form-group__error">{errors.code}</span>
            )}
          </div>

          {/* Discount percent */}
          <div className="form-group">
            <label className="form-group__label">
              Phần trăm giảm (%) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="discount_percent"
              value={formData.discount_percent}
              onChange={handleChange}
              min="1"
              max="100"
              step="1"
              className={`form-group__input ${
                errors.discount_percent ? "form-group__input--error" : ""
              }`}
              placeholder="VD: 10"
            />
            {errors.discount_percent && (
              <span className="form-group__error">
                {errors.discount_percent}
              </span>
            )}
          </div>

          {/* Min order & Max discount */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label">Đơn hàng tối thiểu</label>
              <input
                type="number"
                name="min_order_value"
                value={formData.min_order_value}
                onChange={handleChange}
                min="0"
                step="1000"
                className="form-group__input"
                placeholder="VD: 100000"
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">Giảm tối đa</label>
              <input
                type="number"
                name="max_discount"
                value={formData.max_discount}
                onChange={handleChange}
                min="0"
                step="1000"
                className="form-group__input"
                placeholder="VD: 200000"
              />
            </div>
          </div>

          {/* Usage limit */}
          <div className="form-group">
            <label className="form-group__label">Giới hạn sử dụng</label>
            <input
              type="number"
              name="usage_limit"
              value={formData.usage_limit}
              onChange={handleChange}
              min="1"
              className="form-group__input"
              placeholder="VD: 100"
            />
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label">Ngày bắt đầu</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="form-group__input"
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">Ngày kết thúc</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`form-group__input ${
                  errors.end_date ? "form-group__input--error" : ""
                }`}
              />
              {errors.end_date && (
                <span className="form-group__error">{errors.end_date}</span>
              )}
            </div>
          </div>

          {/* Active */}
          <div className="form-group form-group--checkbox">
            <div className="form-group__checkbox">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <label htmlFor="is_active" className="form-group__checkbox-text">
                Kích hoạt ngay
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className="form-group__error form-group__error--submit">
              {errors.submit}
            </div>
          )}

          {/* Footer */}
          <div className="modal__footer">
            <button
              className="btn btn--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              className="btn btn--primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang lưu..."
                : discount
                ? "Cập nhật"
                : "Thêm mới"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
