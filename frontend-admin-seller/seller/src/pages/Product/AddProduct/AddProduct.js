import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import "./AddProduct.scss";

export default function ProductModal({ isOpen, onClose, onSubmit, product }) {
  const [formData, setFormData] = useState({
    name: "",
    base_price: "",
    category_id: "",
    description: "",
    discount_percent: 0,
    weight: "",
    is_active: true,
  });

  /* LẤY seller_id TỪ localStorage */
  const getSellerIdFromToken = () => {
    const sellerId = localStorage.getItem("seller_id");

    if (!sellerId) {
      console.error("Không tìm thấy seller_id trong localStorage");
      return null;
    }

    return sellerId;
  };

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        base_price: product.base_price || "",
        category_id: product.category_id || "",
        description: product.description || "",
        discount_percent: product.discount_percent || 0,
        weight: product.weight || "",
        is_active: product.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        base_price: "",
        category_id: "",
        description: "",
        discount_percent: 0,
        weight: "",
        is_active: true,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* SUBMIT */
  const handleSubmit = (e) => {
    e.preventDefault();

    const sellerId = getSellerIdFromToken();

    if (!sellerId) {
      alert("Không xác định được người bán. Vui lòng đăng nhập lại.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      seller_id: Number(sellerId), // Chuyển thành số
      base_price: Number(formData.base_price),
      discount_percent: Number(formData.discount_percent) || 0,
      category_id: formData.category_id ? Number(formData.category_id) : null,
      description: formData.description?.trim() || null,
      weight: formData.weight ? Number(formData.weight) : null,
      is_active: Boolean(formData.is_active),
    };

    console.log("SUBMIT PAYLOAD:", payload);

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            {product ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__body">
          <div className="form-group">
            <label className="form-group__label">
              Tên sản phẩm <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-group__input"
              placeholder="Nhập tên sản phẩm"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label">
                Giá gốc <span className="required">*</span>
              </label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                required
                min="0"
                className="form-group__input"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">Giảm giá (%)</label>
              <input
                type="number"
                name="discount_percent"
                value={formData.discount_percent}
                onChange={handleChange}
                min="0"
                max="100"
                className="form-group__input"
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-group__label">Danh mục</label>
            <input
              type="number"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="form-group__input"
              placeholder="ID danh mục"
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="form-group__textarea"
              placeholder="Nhập mô tả sản phẩm"
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Cân nặng (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="form-group__input"
              placeholder="0.00"
            />
          </div>

          <div className="form-group form-group--checkbox">
            <label className="form-group__checkbox">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span className="form-group__checkbox-text">
                Kích hoạt sản phẩm
              </span>
            </label>
          </div>
        </div>

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSubmit}
          >
            {product ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
