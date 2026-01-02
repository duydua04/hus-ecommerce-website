import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import "./CancelOrder.scss";

// Danh sách lý do hủy phổ biến
const CANCEL_REASONS = [
  "Khách hàng yêu cầu hủy",
  "Hết hàng",
  "Sản phẩm bị lỗi",
  "Không liên lạc được với khách",
  "Địa chỉ giao hàng không chính xác",
  "Đơn hàng trùng lặp",
  "Giá sản phẩm thay đổi",
  "Khác",
];

export default function CancelOrderModal({
  isOpen,
  order,
  onConfirm,
  onCancel,
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    setError("");
    if (reason !== "Khác") {
      setCustomReason("");
    }
  };

  const handleCustomReasonChange = (e) => {
    setCustomReason(e.target.value);
    setError("");
  };

  const handleSubmit = () => {
    // Validation
    if (!selectedReason) {
      setError("Vui lòng chọn lý do hủy đơn");
      return;
    }

    if (selectedReason === "Khác" && !customReason.trim()) {
      setError("Vui lòng nhập lý do cụ thể");
      return;
    }

    // Lấy lý do cuối cùng
    const finalReason =
      selectedReason === "Khác" ? customReason.trim() : selectedReason;

    // Gọi callback
    onConfirm(finalReason);

    // Reset form
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setError("");
    onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal__header">
          <h2 className="modal__title">Hủy đơn hàng #{order.order_id}</h2>
          <button className="modal__close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="modal__body">
          <div className="cancel-warning">
            <AlertCircle size={20} />
            <span>
              Hành động này sẽ hủy đơn hàng và hoàn lại số lượng tồn kho. Vui
              lòng chọn lý do hủy.
            </span>
          </div>

          {/* Thông tin đơn hàng */}
          <div className="order-info">
            <div className="order-info-item">
              <span className="label">Khách hàng:</span>
              <span className="value">{order.buyer_name || "N/A"}</span>
            </div>
            <div className="order-info-item">
              <span className="label">Tổng tiền:</span>
              <span className="value">
                {Number(order.total_price).toLocaleString("vi-VN")} ₫
              </span>
            </div>
            <div className="order-info-item">
              <span className="label">Số sản phẩm:</span>
              <span className="value">{order.item_count || 0} sản phẩm</span>
            </div>
          </div>

          {/* Chọn lý do */}
          <div className="form-group">
            <label className="form-group__label">
              Lý do hủy đơn <span className="required">*</span>
            </label>
            <div className="reason-list">
              {CANCEL_REASONS.map((reason) => (
                <label key={reason} className="reason-item">
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => handleReasonChange(reason)}
                  />
                  <span className="reason-text">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nhập lý do tùy chỉnh */}
          {selectedReason === "Khác" && (
            <div className="form-group">
              <label className="form-group__label">
                Nhập lý do cụ thể <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="Vui lòng nhập lý do hủy đơn..."
                value={customReason}
                onChange={handleCustomReasonChange}
                rows={4}
                maxLength={500}
              />
              <div className="char-count">{customReason.length}/500 ký tự</div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={handleClose}>
            Quay lại
          </button>
          <button className="btn btn--danger" onClick={handleSubmit}>
            <i className="bx bx-x-circle"></i>
            Xác nhận hủy đơn
          </button>
        </div>
      </div>
    </div>
  );
}
