// components/Modal.jsx
import React, { useEffect, useState } from "react";
import "./modal.css";

const Modal = ({
  isOpen = false,
  onClose,
  title = "Thông báo",
  message = "",
  type = "success",
  showCloseButton = true,
  showOkButton = true,
  okText = "OK",
  onOk,
  cancelText = "Hủy",
  onCancel,
  showCancelButton = false,
  children,
  size = "medium",
  position = "center",
  isForm = false,
  formFields = [],
  formData = {},
  onFormChange,
  onFormSubmit,
}) => {
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path fill="#4CAF50" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      case "error":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path fill="#f44336" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        );
      case "warning":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path fill="#ff9800" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        );
      case "info":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path fill="#2196F3" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onFormSubmit?.();
  };

  return (
    <div className={`modal-overlay ${position}`} onClick={handleOverlayClick}>
      <div className={`modal-content ${size} ${isForm ? 'modal-form' : ''}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {showCloseButton && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>

        <div className="modal-body">
          {type && !isForm && (
            <div className="modal-icon">
              {getIcon()}
            </div>
          )}

          {message && !isForm && (
            <p className="modal-message">{message}</p>
          )}

          {isForm ? (
            <form onSubmit={handleFormSubmit} className="modal-form-content">
              {formFields.map((field) => (
                <div key={field.name} className="form-field">
                  <label htmlFor={field.name} className="form-label">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={onFormChange}
                      placeholder={field.placeholder}
                      className="form-textarea"
                      rows={field.rows || 4}
                      required={field.required}
                    />
                  ) : field.type === 'rating' ? (
                    <div className="rating-stars">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <React.Fragment key={star}>
                          <input
                            type="radio"
                            id={`${field.name}-${star}`}
                            name={field.name}
                            value={star}
                            checked={formData[field.name] === star}
                            onChange={onFormChange}
                            className="rating-input"
                          />
                          <label
                            htmlFor={`${field.name}-${star}`}
                            className="rating-label"
                            title={`${star} sao`}
                          >
                            ★
                          </label>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      id={field.name}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={onFormChange}
                      placeholder={field.placeholder}
                      className="form-input"
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </form>
          ) : (
            children && (
              <div className="modal-children">
                {children}
              </div>
            )
          )}
        </div>

        {(showOkButton || showCancelButton || isForm) && (
          <div className="modal-footer">
            {showCancelButton && (
              <button
                className="modal-btn modal-btn-cancel"
                onClick={onCancel || onClose}
                type={isForm ? "button" : "button"}
              >
                {cancelText}
              </button>
            )}

            {showOkButton && (
              <button
                className={`modal-btn modal-btn-ok modal-btn-${type}`}
                onClick={isForm ? handleFormSubmit : (onOk || onClose)}
                type={isForm ? "submit" : "button"}
                autoFocus
              >
                {okText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;