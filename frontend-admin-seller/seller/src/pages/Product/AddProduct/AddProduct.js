import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Select from "react-select";
import categoryService from "../../../api/CategoryService";
import "../../../assets/styles/modal.scss";
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

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  /* Load danh mục */
  useEffect(() => {
    if (!isOpen) return;

    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await categoryService.getAllCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [isOpen]);

  /* Fill data khi edit */
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const sellerId = localStorage.getItem("seller_id");
    if (!sellerId) return alert("Vui lòng đăng nhập lại");

    onSubmit({
      name: formData.name.trim(),
      seller_id: Number(sellerId),
      base_price: Number(formData.base_price),
      discount_percent: Number(formData.discount_percent) || 0,
      category_id: formData.category_id ? Number(formData.category_id) : null,
      description: formData.description?.trim() || null,
      weight: formData.weight ? Number(formData.weight) : null,
      is_active: Boolean(formData.is_active),
    });
  };

  if (!isOpen) return null;

  /* react-select options */
  const categoryOptions = categories.map((cat) => ({
    value: cat.category_id,
    label: cat.category_name,
  }));

  const selectedCategory =
    categoryOptions.find((opt) => opt.value === Number(formData.category_id)) ||
    null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal__header">
          <h2 className="modal__title">
            {product ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="modal__body">
          {/* Tên */}
          <div className="form-group">
            <label className="form-group__label">
              Tên sản phẩm <span className="required">*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-group__input"
              required
            />
          </div>

          {/* Giá */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label">Giá gốc *</label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                className="form-group__input"
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">Giảm giá (%)</label>
              <input
                type="number"
                name="discount_percent"
                value={formData.discount_percent}
                onChange={handleChange}
                className="form-group__input"
              />
            </div>
          </div>

          {/* Danh mục */}
          <div className="form-group">
            <label className="form-group__label">Danh mục</label>

            <Select
              classNamePrefix="react-select"
              isLoading={loadingCategories}
              options={categoryOptions}
              value={selectedCategory}
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  category_id: opt ? opt.value : "",
                }))
              }
              placeholder="Chọn danh mục hoặc tìm nhanh"
              isClearable
              isSearchable
              noOptionsMessage={() => "Không có danh mục"}
              loadingMessage={() => "Đang tải..."}
              filterOption={(option, input) =>
                option.label
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .includes(
                    input
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                  )
              }
            />
          </div>

          {/* Active */}
          <div className="form-group form-group--checkbox">
            <label className="form-group__checkbox">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span>Kích hoạt sản phẩm</span>
            </label>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            {product ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
