import React from "react";
import { X } from "lucide-react";
import "./ProductDetail.scss";

const DEFAULT_IMAGE = "https://via.placeholder.com/150?text=No+Image";

export default function ProductDetailModal({ isOpen, product, onClose }) {
  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--large product-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h3 className="modal__title">Chi tiết sản phẩm: {product.name}</h3>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__body">
          {/* Product Info */}
          <div className="product-info">
            <div className="product-info__row">
              <span className="product-info__label">Tên sản phẩm:</span>
              <span className="product-info__value">{product.name}</span>
            </div>
            <div className="product-info__row">
              <span className="product-info__label">Danh mục:</span>
              <span className="product-info__value">
                {product.category_name || "—"}
              </span>
            </div>
            <div className="product-info__row">
              <span className="product-info__label">Giá gốc:</span>
              <span className="product-info__value">
                {Number(product.base_price).toLocaleString("vi-VN")} ₫
              </span>
            </div>
            <div className="product-info__row">
              <span className="product-info__label">Giảm giá:</span>
              <span className="product-info__value">
                {product.discount_percent}%
              </span>
            </div>
            <div className="product-info__row">
              <span className="product-info__label">Cân nặng:</span>
              <span className="product-info__value">
                {product.weight ? `${product.weight} kg` : "—"}
              </span>
            </div>
            <div className="product-info__row">
              <span className="product-info__label">Trạng thái:</span>
              <span
                className={`status-badge ${
                  product.is_active
                    ? "status-badge--active"
                    : "status-badge--inactive"
                }`}
              >
                {product.is_active ? "Hoạt động" : "Tạm dừng"}
              </span>
            </div>
            {product.description && (
              <div className="product-info__row product-info__row--full">
                <span className="product-info__label">Mô tả:</span>
                <p className="product-info__description">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Images Section */}
          <div className="product-section">
            <h4 className="product-section__title">
              Hình ảnh ({product.images?.length || 0})
            </h4>
            {product.images && product.images.length > 0 ? (
              <div className="image-gallery">
                {product.images.map((img) => (
                  <div
                    key={img.product_image_id}
                    className={`image-gallery__item ${
                      img.is_primary ? "image-gallery__item--primary" : ""
                    }`}
                  >
                    <img
                      src={img.public_image_url || DEFAULT_IMAGE}
                      alt="Product"
                      className="image-gallery__img"
                      onError={(e) => {
                        e.target.src = DEFAULT_IMAGE;
                      }}
                    />
                    {img.is_primary && (
                      <span className="image-gallery__badge">Chính</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="product-section__empty">Chưa có hình ảnh</p>
            )}
          </div>

          {/* Variants Section */}
          <div className="product-section">
            <h4 className="product-section__title">
              Biến thể ({product.variants?.length || 0})
            </h4>
            {product.variants && product.variants.length > 0 ? (
              <div className="variant-list">
                {product.variants.map((variant) => (
                  <div key={variant.variant_id} className="variant-card">
                    <div className="variant-card__header">
                      <strong className="variant-card__name">
                        {variant.variant_name}
                      </strong>
                      <span className="variant-card__price">
                        Điều chỉnh giá:{" "}
                        {Number(variant.price_adjustment).toLocaleString(
                          "vi-VN"
                        )}{" "}
                        ₫
                      </span>
                    </div>
                    {variant.sizes && variant.sizes.length > 0 && (
                      <div className="variant-card__sizes">
                        <span className="variant-card__sizes-label">
                          Kích thước:
                        </span>
                        <div className="size-tags">
                          {variant.sizes.map((size) => (
                            <span
                              key={size.size_id}
                              className={`size-tag ${
                                !size.in_stock ? "size-tag--out-of-stock" : ""
                              }`}
                            >
                              {size.size_name}
                              <span className="size-tag__units">
                                ({size.available_units})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="product-section__empty">Chưa có biến thể</p>
            )}
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
}
