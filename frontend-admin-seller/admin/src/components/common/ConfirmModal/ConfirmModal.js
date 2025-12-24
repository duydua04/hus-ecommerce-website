import React from "react";
import "./ConfirmModal.scss";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal__header">
          <h3 className="confirm-modal__title">{title || "Xác nhận"}</h3>
        </div>

        <div className="confirm-modal__body">
          <p className="confirm-modal__message">{message}</p>
        </div>

        <div className="confirm-modal__footer">
          <button
            className="confirm-modal__btn confirm-modal__btn--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="confirm-modal__btn confirm-modal__btn--confirm"
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
