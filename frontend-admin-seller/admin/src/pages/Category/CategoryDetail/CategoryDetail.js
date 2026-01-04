import React from "react";
import { X } from "lucide-react";
import "./CategoryDetail.scss";
import defaultAvatar from "../../../assets/images/default-avatar-category.png";

const CategoryDetailModal = ({ isOpen, category, onClose }) => {
  if (!isOpen || !category) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Chi tiết danh mục</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal__body">
          <div className="detail">
            {/* Hình ảnh danh mục */}
            <div className="detail__image-section">
              <img
                src={category.image_url || defaultAvatar}
                alt={category.category_name}
                className="detail__image"
                onError={(e) => {
                  e.target.src = defaultAvatar;
                }}
              />
            </div>

            {/* Thông tin chi tiết */}
            <div className="detail__info-section">
              <div className="detail__group">
                <label className="detail__label">ID danh mục</label>
                <p className="detail__value">{category.category_id}</p>
              </div>

              <div className="detail__group">
                <label className="detail__label">Tên danh mục</label>
                <p className="detail__value detail__value--highlight">
                  {category.category_name}
                </p>
              </div>

              {category.updated_at && (
                <div className="detail__group">
                  <label className="detail__label">Cập nhật lần cuối</label>
                  <p className="detail__value">
                    {formatDate(category.updated_at)}
                  </p>
                </div>
              )}

              <div className="detail__group">
                <label className="detail__label">URL hình ảnh</label>
                <p className="detail__value detail__value--link">
                  {category.image_url || "Chưa có hình ảnh"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;
