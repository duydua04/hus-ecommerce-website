import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import useProduct from "../../../../hooks/useProduct";
import "./VariantModal.scss";

export default function VariantModal({ open, onClose, data, onSuccess }) {
  const { createVariant, updateVariant } = useProduct();

  const isEdit = data?.mode === "edit";
  const productId = data?.productId;
  const variant = data?.variant;

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Init form state */
  useEffect(() => {
    if (!open) return;

    if (isEdit && variant) {
      setName(variant.variant_name || "");
      setPrice(variant.price_adjustment || 0);
    } else {
      setName("");
      setPrice(0);
    }

    setError("");
  }, [open, isEdit, variant]);

  if (!open) return null;

  /* Helpers */
  const parseApiError = (err) => {
    if (
      err?.detail === "Missing access token" ||
      err?.response?.status === 401
    ) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }

    if (Array.isArray(err?.detail)) {
      return err.detail
        .map((e) => {
          const field = e.loc?.[1] || "unknown";
          return `${field}: ${e.msg}`;
        })
        .join(", ");
    }

    if (typeof err?.detail === "string") return err.detail;
    if (err?.message) return err.message;

    return "Đã có lỗi xảy ra";
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Vui lòng nhập tên biến thể");
      return;
    }

    if (!productId) {
      setError("Không tìm thấy ID sản phẩm");
      return;
    }

    const payload = {
      product_id: productId,
      variant_name: name.trim(),
      price_adjustment: price,
      is_active: true,
    };

    try {
      setLoading(true);
      setError("");

      if (isEdit && variant) {
        await updateVariant(productId, variant.variant_id, payload);
      } else {
        await createVariant(productId, payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  /* Render */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--small variant-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal__header">
          <h3 className="modal__title">
            {isEdit ? "Sửa biến thể" : "Thêm biến thể mới"}
          </h3>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div className="form-group">
              <label className="form-label">
                Tên biến thể <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Màu đỏ, Màu xanh..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Price */}
            <div className="form-group">
              <label className="form-label">Điều chỉnh giá (₫)</label>
              <div className="input-with-icon">
                <span className="input-icon">₫</span>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <p className="form-hint">Số tiền cộng/trừ so với giá gốc</p>
            </div>

            {/* Price preview */}
            {price !== 0 && (
              <div className="price-preview">
                <span className="price-preview__label">
                  Giá sau điều chỉnh:
                </span>
                <span
                  className={`price-preview__value ${
                    price < 0 ? "price-preview__value--negative" : ""
                  }`}
                >
                  {price > 0 && "+"}
                  {price.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span>{isEdit ? "Cập nhật" : "Thêm mới"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
