import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import "./AddCategory.scss";

export default function CategoryModal({ isOpen, onClose, onSubmit, category }) {
  const [formData, setFormData] = useState({
    category_name: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode
        setFormData({
          category_name: category.category_name || "",
        });
      } else {
        // Add mode
        setFormData({
          category_name: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category_name.trim()) {
      newErrors.category_name = "Tên danh mục không được để trống";
    } else if (formData.category_name.trim().length < 2) {
      newErrors.category_name = "Tên danh mục phải có ít nhất 2 ký tự";
    } else if (formData.category_name.trim().length > 100) {
      newErrors.category_name = "Tên danh mục không được quá 100 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error khi người dùng nhập
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
      await onSubmit({
        category_name: formData.category_name.trim(),
      });
    } catch (err) {
      console.error("Error submitting category:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {category ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="category_name" className="form-label">
              Tên danh mục <span className="required">*</span>
            </label>
            <input
              type="text"
              id="category_name"
              name="category_name"
              className={`form-input ${
                errors.category_name ? "form-input--error" : ""
              }`}
              placeholder="Nhập tên danh mục..."
              value={formData.category_name}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.category_name && (
              <span className="form-error">{errors.category_name}</span>
            )}
          </div>

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
              {isSubmitting
                ? "Đang lưu..."
                : category
                ? "Cập nhật"
                : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
