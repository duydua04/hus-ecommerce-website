import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import "./AddLocation.scss";

/* ===== CONSTANTS ===== */
const LABEL_OPTIONS = [
  { label: "Trụ sở chính", value: "headquarters" },
  { label: "Kho hàng", value: "warehouse" },
  { label: "Khác", value: "other" },
];

const EMPTY_FORM = {
  fullname: "",
  phone: "",
  street: "",
  ward: "",
  district: "",
  province: "",
  label: "other",
  is_default: false,
};

export default function AddEditAddressModal({
  isOpen,
  onClose,
  onSubmit,
  mode, // "add" | "edit-content"
  address,
  loading,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  /* ===== INIT ===== */
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit-content" && address) {
      setFormData({
        fullname: address.address?.fullname ?? "",
        phone: address.address?.phone ?? "",
        street: address.address?.street ?? "",
        ward: address.address?.ward ?? "",
        district: address.address?.district ?? "",
        province: address.address?.province ?? "",
        label: address.label ?? "other",
        is_default: Boolean(address.is_default),
      });
    } else {
      setFormData(EMPTY_FORM);
    }

    setErrors({});
  }, [isOpen, mode, address]);

  /* ===== HANDLERS ===== */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  /* ===== VALIDATE ===== */
  const validate = () => {
    const nextErrors = {};

    if (!formData.fullname.trim())
      nextErrors.fullname = "Vui lòng nhập tên người nhận";

    if (!formData.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^(\+84|0)[0-9]{9,10}$/.test(formData.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }

    ["street", "ward", "district", "province"].forEach((field) => {
      if (!formData[field].trim()) nextErrors[field] = "Không được để trống";
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* ===== SUBMIT ===== */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      label: formData.label || "other",
    });
  };

  if (!isOpen) return null;

  const title = mode === "add" ? "Thêm địa chỉ mới" : "Cập nhật địa chỉ";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-group__label">
              Tên người nhận <span className="required">*</span>
            </label>
            <input
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              className="form-group__input"
            />
            {errors.fullname && (
              <span className="form-error">{errors.fullname}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-group__label">
              Số điện thoại <span className="required">*</span>
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-group__input"
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-group__label">
              Địa chỉ cụ thể <span className="required">*</span>
            </label>
            <input
              name="street"
              value={formData.street}
              onChange={handleChange}
              className="form-group__input"
            />
          </div>

          <div className="form-row">
            {["ward", "district", "province"].map((field) => (
              <div className="form-group" key={field}>
                <label className="form-group__label">
                  {field === "ward"
                    ? "Phường/Xã"
                    : field === "district"
                    ? "Quận/Huyện"
                    : "Tỉnh/TP"}{" "}
                  <span className="required">*</span>
                </label>
                <input
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="form-group__input"
                />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-group__label">Loại địa chỉ</label>
            <select
              name="label"
              value={formData.label}
              onChange={handleChange}
              className="form-group__input"
            >
              {LABEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group form-group--checkbox">
            <label className="form-group__checkbox">
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
              />
              <span>Đặt làm địa chỉ mặc định</span>
            </label>
          </div>

          {/* FOOTER */}
          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {mode === "add" ? "Thêm địa chỉ" : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
