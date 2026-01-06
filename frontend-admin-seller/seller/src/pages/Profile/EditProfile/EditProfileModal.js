import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import "./EditProfileModal.scss";
import "../../../assets/styles/modal.scss";

export default function EditProfileModal({
  isOpen,
  onClose,
  onSubmit,
  mode, // "personal" or "shop"
  profile,
  loading,
}) {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    phone: "",
    shop_name: "",
  });

  // Update form khi profile thay đổi
  useEffect(() => {
    if (profile) {
      setFormData({
        fname: profile.fname || "",
        lname: profile.lname || "",
        phone: profile.phone || "",
        shop_name: profile.shop_name || "",
      });
    }
  }, [profile]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (mode === "personal") {
      onSubmit({
        fname: formData.fname,
        lname: formData.lname,
        phone: formData.phone,
      });
    } else if (mode === "shop") {
      onSubmit({
        shop_name: formData.shop_name,
      });
    }
  };

  const getModalTitle = () => {
    return mode === "personal"
      ? "Chỉnh sửa thông tin cá nhân"
      : "Chỉnh sửa thông tin cửa hàng";
  };

  const getModalSubtitle = () => {
    return "Hãy cập nhật thông tin của bạn luôn chính xác";
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal modal--medium">
        <div className="modal__header">
          <div className="modal__header-content">
            <h2 className="modal__title">{getModalTitle()}</h2>
            <p className="modal__subtitle">{getModalSubtitle()}</p>
          </div>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal__body">
          <div className="edit-profile-modal">
            {mode === "personal" && (
              <>
                <div className="edit-profile-modal__field">
                  <label className="edit-profile-modal__label">Tên</label>
                  <input
                    type="text"
                    name="fname"
                    value={formData.fname}
                    onChange={handleInputChange}
                    className="edit-profile-modal__input"
                    placeholder="Enter first name"
                  />
                </div>

                <div className="edit-profile-modal__field">
                  <label className="edit-profile-modal__label">Họ đệm</label>
                  <input
                    type="text"
                    name="lname"
                    value={formData.lname}
                    onChange={handleInputChange}
                    className="edit-profile-modal__input"
                    placeholder="Enter last name"
                  />
                </div>

                <div className="edit-profile-modal__field">
                  <label className="edit-profile-modal__label">
                    Địa chỉ email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    className="edit-profile-modal__input edit-profile-modal__input--disabled"
                    disabled
                  />
                </div>

                <div className="edit-profile-modal__field">
                  <label className="edit-profile-modal__label">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="edit-profile-modal__input"
                    placeholder="Enter phone number"
                  />
                </div>
              </>
            )}

            {mode === "shop" && (
              <div className="edit-profile-modal__field">
                <label className="edit-profile-modal__label">Tên shop</label>
                <input
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleInputChange}
                  className="edit-profile-modal__input"
                  placeholder="Enter shop name"
                />
              </div>
            )}

            <div className="edit-profile-modal__actions">
              <Button text="Đóng" variant="outline" onClick={onClose} />
              <Button
                text="Lưu thay đổi"
                variant="primary"
                onClick={handleSubmit}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
