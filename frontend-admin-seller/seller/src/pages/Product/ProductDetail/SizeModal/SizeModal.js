import React, { useState } from "react";
import { X, Plus, Trash } from "lucide-react";
import useProduct from "../../../../hooks/useProduct";
import "./SizeModal.scss";

export default function SizeModal({ open, data, onClose, onSuccess }) {
  const { createSize, deleteSize } = useProduct();

  const variant = data?.variant;
  const productId = data?.productId;

  const [name, setName] = useState("");
  const [units, setUnits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !variant || !productId) return null;

  /* Helper */
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

  /* Add size */
  const handleAddSize = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Vui lòng nhập tên kích thước");
      return;
    }

    if (units < 0) {
      setError("Số lượng không được âm");
      return;
    }

    const payload = {
      variant_id: variant.variant_id,
      size_name: name.trim(),
      available_units: units,
      in_stock: units > 0,
    };

    try {
      setLoading(true);
      setError("");

      await createSize(productId, variant.variant_id, payload);

      setName("");
      setUnits(0);
      onSuccess?.();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  /* Delete size */
  const handleDeleteSize = async (sizeId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kích thước này?")) return;

    try {
      await deleteSize(productId, variant.variant_id, sizeId);
      onSuccess?.();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  /*  Render */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--medium size-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal__header">
          <div className="modal__header-content">
            <h3 className="modal__title">Quản lý kích thước</h3>
            <span className="variant-badge">{variant.variant_name}</span>
          </div>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal__body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="alert-close" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Add size form */}
          <form onSubmit={handleAddSize} className="size-form">
            <h4 className="size-form__title">Thêm kích thước mới</h4>

            <div className="size-form__inputs">
              <div className="form-group form-group--flex">
                <label className="form-label">
                  Kích thước <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="S, M, L, XL..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group form-group--flex">
                <label className="form-label">
                  Số lượng <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  placeholder="0"
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Đang thêm...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Thêm</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Size list */}
          <div className="size-list">
            <h4 className="size-list__title">
              Danh sách kích thước
              <span className="size-list__count">
                {variant.sizes?.length || 0}
              </span>
            </h4>

            {variant.sizes?.length > 0 ? (
              <div className="size-items">
                {variant.sizes.map((size) => (
                  <div
                    key={size.size_id}
                    className={`size-item ${
                      !size.in_stock ? "size-item--out" : ""
                    }`}
                  >
                    <div className="size-item__info">
                      <span className="size-item__name">{size.size_name}</span>
                      <span className="size-item__units">
                        <strong>{size.available_units}</strong> sản phẩm
                        {!size.in_stock && (
                          <span className="size-item__badge">Hết hàng</span>
                        )}
                      </span>
                    </div>

                    <button
                      className="size-item__delete"
                      title="Xóa kích thước"
                      onClick={() => handleDeleteSize(size.size_id)}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state empty-state--small">
                <p>Chưa có kích thước nào</p>
                <p className="empty-state__hint">
                  Thêm kích thước đầu tiên bằng form bên trên
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
