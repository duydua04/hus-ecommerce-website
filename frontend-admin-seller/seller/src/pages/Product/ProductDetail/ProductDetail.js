import React, { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash, Package, DollarSign } from "lucide-react";
import VariantModal from "./VariantModal/VariantModal";
import SizeModal from "./SizeModal/SizeModal";
import useProduct from "../../../hooks/useProduct";
import "./ProductDetail.scss";

const DEFAULT_IMAGE = "https://via.placeholder.com/150?text=No+Image";

export default function ProductDetailModal({ isOpen, product, onClose }) {
  const { fetchProductDetail, deleteVariant } = useProduct();

  const [variantModal, setVariantModal] = useState(null);
  const [sizeModal, setSizeModal] = useState(null);
  const [productData, setProductData] = useState(null);

  // Update productData when product prop changes
  useEffect(() => {
    if (product) {
      setProductData(product);
    }
  }, [product]);

  if (!isOpen || !productData) return null;

  const refreshProduct = async () => {
    try {
      const updated = await fetchProductDetail(productData.product_id);
      setProductData(updated);
    } catch (error) {
      console.error("Có lỗi khi cập nhật sản phẩm này:", error);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa biến thể này không?")) {
      try {
        await deleteVariant(productData.product_id, variantId);
        await refreshProduct();
      } catch (error) {
        console.error("Có lỗi xảy ra khi xóa biến thể:", error);
      }
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal modal--large product-detail-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal__header">
            <div className="modal__header-content">
              <h3 className="modal__title">{productData.name}</h3>
              <span
                className={`status-badge ${
                  productData.is_active
                    ? "status-badge--active"
                    : "status-badge--inactive"
                }`}
              >
                {productData.is_active ? "Hoạt động" : "Tạm dừng"}
              </span>
            </div>
          </div>

          <div className="modal__body">
            {/* Thông tin sản phẩm */}
            <div className="product-info-grid">
              <div className="info-card">
                <div className="info-card__icon">
                  <Package size={20} />
                </div>
                <div className="info-card__content">
                  <span className="info-card__label">Danh mục</span>
                  <span className="info-card__value">
                    {productData.category_name || "Chưa phân loại"}
                  </span>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card__icon">
                  <DollarSign size={20} />
                </div>
                <div className="info-card__content">
                  <span className="info-card__label">Giá gốc</span>
                  <span className="info-card__value">
                    {Number(productData.base_price).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card__icon">%</div>
                <div className="info-card__content">
                  <span className="info-card__label">Giảm giá</span>
                  <span className="info-card__value">
                    {productData.discount_percent}%
                  </span>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card__icon">⚖️</div>
                <div className="info-card__content">
                  <span className="info-card__label">Cân nặng</span>
                  <span className="info-card__value">
                    {productData.weight ? `${productData.weight} kg` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {productData.description && (
              <div className="description-section">
                <h4 className="section-title">Mô tả sản phẩm</h4>
                <p className="description-text">{productData.description}</p>
              </div>
            )}

            {/* List ảnh sản phẩm */}
            <div className="product-section">
              <div className="section-header">
                <h4 className="section-title">
                  Hình ảnh
                  <span className="section-count">
                    {productData.images?.length || 0}
                  </span>
                </h4>
              </div>

              {productData.images && productData.images.length > 0 ? (
                <div className="image-gallery">
                  {productData.images.map((img) => (
                    <div
                      key={img.product_image_id}
                      className={`gallery-item ${
                        img.is_primary ? "gallery-item--primary" : ""
                      }`}
                    >
                      <img
                        src={img.public_image_url || DEFAULT_IMAGE}
                        alt="Product"
                        onError={(e) => {
                          e.target.src = DEFAULT_IMAGE;
                        }}
                      />
                      {img.is_primary && (
                        <span className="primary-badge">Ảnh chính</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Package size={48} />
                  <p>Chưa có hình ảnh</p>
                </div>
              )}
            </div>

            {/* Biến thể*/}
            <div className="product-section">
              <div className="section-header">
                <h4 className="section-title">
                  Biến thể
                  <span className="section-count">
                    {productData.variants?.length || 0}
                  </span>
                </h4>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() =>
                    setVariantModal({
                      mode: "create",
                      productId: productData.product_id,
                    })
                  }
                >
                  <Plus size={16} />
                  <span>Thêm biến thể</span>
                </button>
              </div>

              {productData.variants && productData.variants.length > 0 ? (
                <div className="variant-grid">
                  {productData.variants.map((variant) => (
                    <div key={variant.variant_id} className="variant-card">
                      <div className="variant-card__header">
                        <div className="variant-card__info">
                          <h5 className="variant-card__name">
                            {variant.variant_name}
                          </h5>
                          <span className="variant-card__price">
                            {Number(variant.price_adjustment) >= 0 ? "+" : ""}
                            {Number(variant.price_adjustment).toLocaleString(
                              "vi-VN"
                            )}{" "}
                            ₫
                          </span>
                        </div>

                        <div className="variant-card__actions">
                          <button
                            className="action-btn action-btn--edit"
                            onClick={() =>
                              setVariantModal({
                                mode: "edit",
                                productId: productData.product_id,
                                variant,
                              })
                            }
                            title="Sửa biến thể"
                          >
                            <i className="bx bx-edit-alt" />
                          </button>

                          <button
                            className="action-btn action-size"
                            onClick={() =>
                              setSizeModal({
                                productId: productData.product_id,
                                variant,
                              })
                            }
                            title="Quản lý size"
                          >
                            <span>Size</span>
                          </button>

                          <button
                            className="action-btn action-btn--delete"
                            onClick={() =>
                              handleDeleteVariant(variant.variant_id)
                            }
                            title="Xóa biến thể"
                          >
                            <i className="bx bx-trash" />
                          </button>
                        </div>
                      </div>

                      {variant.sizes && variant.sizes.length > 0 && (
                        <div className="variant-card__sizes">
                          <span className="sizes-label">Kích thước:</span>
                          <div className="size-chips">
                            {variant.sizes.map((size) => (
                              <div
                                key={size.size_id}
                                className={`size-chip ${
                                  !size.in_stock ? "size-chip--out" : ""
                                }`}
                              >
                                <span className="size-chip__name">
                                  {size.size_name}
                                </span>
                                <span className="size-chip__units">
                                  {size.available_units}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Package size={48} />
                  <p>Chưa có biến thể nào</p>
                </div>
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

      {/* Modals */}
      {variantModal && (
        <VariantModal
          open={!!variantModal}
          data={variantModal}
          onClose={() => setVariantModal(null)}
          onSuccess={refreshProduct}
        />
      )}

      {sizeModal && (
        <SizeModal
          open={!!sizeModal}
          data={sizeModal}
          onClose={() => setSizeModal(null)}
          onSuccess={refreshProduct}
        />
      )}
    </>
  );
}
