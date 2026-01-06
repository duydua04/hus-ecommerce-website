import React, { useState, useEffect } from "react";
import { X, Plus, Trash, Edit2 } from "lucide-react";
import useProduct from "../../../../hooks/useProduct";
import ConfirmModal from "../../../../components/common/ConfirmModal/ConfirmModal";
import "./SizeModal.scss";

export default function SizeModal({ open, data, onClose, onSuccess }) {
  const { createSize, updateSize, deleteSize } = useProduct();

  const variant = data?.variant;
  const productId = data?.productId;

  const [name, setName] = useState("");
  const [units, setUnits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Confirm delete state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSizeId, setPendingSizeId] = useState(null);

  // Edit size state
  const [editMode, setEditMode] = useState(false);
  const [editingSize, setEditingSize] = useState(null);

  // Reset form khi đóng modal hoặc chuyển mode
  useEffect(() => {
    if (!open) {
      setEditMode(false);
      setEditingSize(null);
      setName("");
      setUnits(0);
      setError("");
    }
  }, [open]);

  // Load data khi vào edit mode
  useEffect(() => {
    if (editMode && editingSize) {
      setName(editingSize.size_name || "");
      setUnits(editingSize.available_units || 0);
      setError("");
    } else if (!editMode) {
      setName("");
      setUnits(0);
      setError("");
    }
  }, [editMode, editingSize]);

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

  /* Add/Update size */
  const handleSubmit = async (e) => {
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

      if (editMode && editingSize) {
        await updateSize(
          productId,
          variant.variant_id,
          editingSize.size_id,
          payload
        );
      } else {
        await createSize(productId, variant.variant_id, payload);
      }

      setName("");
      setUnits(0);
      setEditMode(false);
      setEditingSize(null);
      onSuccess?.();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  /* Open edit mode */
  const handleEditSize = (size) => {
    setEditingSize(size);
    setEditMode(true);
  };

  /* Cancel edit */
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingSize(null);
    setName("");
    setUnits(0);
    setError("");
  };

  /* Open confirm delete */
  const handleDeleteSize = (sizeId) => {
    setPendingSizeId(sizeId);
    setConfirmOpen(true);
  };

  /* Delete size */
  const confirmDeleteSize = async () => {
    if (!pendingSizeId) return;

    try {
      await deleteSize(productId, variant.variant_id, pendingSizeId);
      onSuccess?.();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setConfirmOpen(false);
      setPendingSizeId(null);
    }
  };

  /* Render */
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

          {/* Add/Edit size form */}
          <form onSubmit={handleSubmit} className="size-form">
            <h4 className="size-form__title">
              {editMode ? "Sửa kích thước" : "Thêm kích thước mới"}
            </h4>

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

              <div className="size-form__buttons">
                {editMode && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      <span>{editMode ? "Đang lưu..." : "Đang thêm..."}</span>
                    </>
                  ) : (
                    <>
                      {editMode ? (
                        <span>Cập nhật</span>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>Thêm</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
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
                    } ${
                      editingSize?.size_id === size.size_id
                        ? "size-item--editing"
                        : ""
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

                    <div className="size-item__actions">
                      <button
                        className="size-item__edit"
                        title="Sửa kích thước"
                        onClick={() => handleEditSize(size)}
                        disabled={editMode}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="size-item__delete"
                        title="Xóa kích thước"
                        onClick={() => handleDeleteSize(size.size_id)}
                        disabled={editMode}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
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

        {/* Confirm delete modal */}
        <ConfirmModal
          isOpen={confirmOpen}
          title="Xóa kích thước"
          message="Bạn có chắc chắn muốn xóa kích thước này? Hành động này không thể hoàn tác."
          onCancel={() => {
            setConfirmOpen(false);
            setPendingSizeId(null);
          }}
          onConfirm={confirmDeleteSize}
        />
      </div>
    </div>
  );
}
