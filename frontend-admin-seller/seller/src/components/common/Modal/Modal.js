import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./Modal.scss";

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "medium", // "small", "medium", "large"
  closeOnOverlayClick = true,
  showCloseButton = true,
}) {
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

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal modal--${size}`}>
        <div className="modal__header">
          <div className="modal__header-content">
            {title && <h2 className="modal__title">{title}</h2>}
            {subtitle && <p className="modal__subtitle">{subtitle}</p>}
          </div>
          {showCloseButton && (
            <button
              className="modal__close"
              onClick={handleClose}
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
