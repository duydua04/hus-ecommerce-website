// components/modal.jsx
import React, { useEffect, useRef } from "react";
import "./modal.css";

const Modal = ({
  // Cơ bản
  isOpen = false,
  onClose,
  title = "Thông báo",
  message = "",
  type = "info", // success, error, warning, info, confirm

  // Nút điều khiển
  showCloseButton = true,
  showOkButton = true,
  okText = "OK",
  onOk,
  cancelText = "Hủy",
  onCancel,
  showCancelButton = false,

  // Nội dung
  children,
  icon = null, // Custom icon component

  // Kích thước & vị trí
  size = "medium", // small, medium, large, xlarge, fullscreen
  position = "center", // center, top, bottom

  // Form
  isForm = false,
  formFields = [],
  formData = {},
  onFormChange,
  onFormSubmit,
  submitText = "Gửi",

  // Hành vi
  hideOnOverlayClick = true,
  hideOnEsc = true,
  showIcon = true,
  closeOnConfirm = true,
  closeOnCancel = true,
  autoFocus = true,
  preventClose = false, // Ngăn đóng modal (cho loading)

  // Style
  overlayClassName = "",
  contentClassName = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  okButtonClassName = "",
  cancelButtonClassName = "",

  // Animation
  animation = "fadeIn", // fadeIn, slideUp, scale, none
  animationDuration = 300,

  // Loading state
  isLoading = false,
  loadingText = "Đang xử lý...",

  // Footer actions
  footerActions = [], // Mảng các action button tùy chỉnh
}) => {
  const modalRef = useRef(null);
  const okButtonRef = useRef(null);

  // Handle body overflow
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (autoFocus && okButtonRef.current) {
        setTimeout(() => okButtonRef.current?.focus(), 100);
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, autoFocus]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isOpen && hideOnEsc && !preventClose) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onClose, hideOnEsc, preventClose]);

  // Handle click outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && hideOnOverlayClick && !preventClose) {
      onClose?.();
    }
  };

  // Get icon based on type
  const getIcon = () => {
    if (icon) return icon;

    switch (type) {
      case "success":
        return (
          <div className="modal-icon-success">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="modal-icon-error">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="modal-icon-warning">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
        );
      case "info":
        return (
          <div className="modal-icon-info">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
        );
      case "confirm":
        return (
          <div className="modal-icon-confirm">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // Handle button clicks
  const handleOkClick = () => {
    if (isLoading) return;

    if (onOk) {
      const result = onOk();
      if (result !== false && closeOnConfirm) {
        onClose?.();
      }
    } else if (closeOnConfirm) {
      onClose?.();
    }
  };

  const handleCancelClick = () => {
    if (isLoading) return;

    if (onCancel) {
      const result = onCancel();
      if (result !== false && closeOnCancel) {
        onClose?.();
      }
    } else if (closeOnCancel) {
      onClose?.();
    }
  };

  // Handle form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (onFormSubmit) {
      const result = onFormSubmit();
      if (result !== false) {
        onClose?.();
      }
    }
  };

  // Handle custom field types
  const renderFormField = (field) => {
    const fieldValue = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={fieldValue}
            onChange={onFormChange}
            placeholder={field.placeholder}
            className="form-textarea"
            rows={field.rows || 4}
            required={field.required}
            disabled={isLoading}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={fieldValue}
            onChange={onFormChange}
            className="form-select"
            required={field.required}
            disabled={isLoading}
          >
            <option value="">{field.placeholder || 'Chọn...'}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              name={field.name}
              checked={!!fieldValue}
              onChange={onFormChange}
              disabled={isLoading}
              className="form-checkbox"
            />
            <span className="form-checkbox-text">{field.label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="form-radio-group">
            {field.options?.map(option => (
              <label key={option.value} className="form-radio-label">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={fieldValue === option.value}
                  onChange={onFormChange}
                  disabled={isLoading}
                  className="form-radio"
                />
                <span className="form-radio-text">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="rating-stars">
            {[5, 4, 3, 2, 1].map((star) => (
              <React.Fragment key={star}>
                <input
                  type="radio"
                  id={`${field.name}-${star}`}
                  name={field.name}
                  value={star}
                  checked={fieldValue === star.toString()}
                  onChange={onFormChange}
                  className="rating-input"
                  disabled={isLoading}
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
        );

      case 'file':
        return (
          <div className="form-file-upload">
            <input
              type="file"
              id={field.name}
              name={field.name}
              onChange={onFormChange}
              accept={field.accept}
              className="form-file-input"
              disabled={isLoading}
            />
            <label htmlFor={field.name} className="form-file-label">
              {field.buttonText || 'Chọn file'}
            </label>
            {fieldValue && (
              <span className="form-file-name">{fieldValue.name}</span>
            )}
          </div>
        );

      default: // text, email, password, number, etc.
        return (
          <input
            type={field.type || 'text'}
            id={field.name}
            name={field.name}
            value={fieldValue}
            onChange={onFormChange}
            placeholder={field.placeholder}
            className="form-input"
            required={field.required}
            disabled={isLoading}
            autoComplete={field.autoComplete}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${position} ${overlayClassName} ${animation}`}
      style={{ '--animation-duration': `${animationDuration}ms` }}
      onClick={handleOverlayClick}
      data-testid="modal-overlay"
    >
      <div
        ref={modalRef}
        className={`modal-content ${size} ${isForm ? 'modal-form' : ''} ${contentClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className={`modal-header ${headerClassName}`}>
          <h3 id="modal-title" className="modal-title">
            {title}
          </h3>
          {showCloseButton && !preventClose && (
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Đóng"
              disabled={isLoading}
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className={`modal-body ${bodyClassName}`}>
          {/* Icon */}
          {showIcon && type && !isForm && !children && (
            <div className="modal-icon-container">
              {getIcon()}
            </div>
          )}

          {/* Message */}
          {message && !isForm && !children && (
            <div className="modal-message-container">
              <p className="modal-message">{message}</p>
            </div>
          )}

          {/* Form */}
          {isForm ? (
            <form onSubmit={handleFormSubmit} className="modal-form-content">
              {formFields.map((field) => (
                <div key={field.name} className={`form-field ${field.className || ''}`}>
                  {field.type !== 'checkbox' && field.type !== 'radio' && (
                    <label htmlFor={field.name} className="form-label">
                      {field.label}
                      {field.required && <span className="required-star">*</span>}
                    </label>
                  )}
                  <div className="form-input-container">
                    {renderFormField(field)}
                    {field.helperText && (
                      <p className="form-helper-text">{field.helperText}</p>
                    )}
                  </div>
                </div>
              ))}
            </form>
          ) : (
            // Children content
            children && (
              <div className="modal-children">
                {children}
              </div>
            )
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="modal-loading-overlay">
              <div className="modal-loading-spinner"></div>
              <p className="modal-loading-text">{loadingText}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(showOkButton || showCancelButton || isForm || footerActions.length > 0) && (
          <div className={`modal-footer ${footerClassName}`}>
            {/* Custom footer actions */}
            {footerActions.map((action, index) => (
              <button
                key={index}
                className={`modal-btn ${action.className || ''}`}
                onClick={action.onClick}
                disabled={isLoading || action.disabled}
                type="button"
              >
                {action.icon && <span className="btn-icon">{action.icon}</span>}
                {action.text}
              </button>
            ))}

            {/* Cancel button */}
            {showCancelButton && (
              <button
                className={`modal-btn modal-btn-cancel ${cancelButtonClassName}`}
                onClick={handleCancelClick}
                disabled={isLoading}
                type="button"
              >
                {cancelText}
              </button>
            )}

            {/* OK/Submit button */}
            {(showOkButton || isForm) && (
              <button
                ref={okButtonRef}
                className={`modal-btn modal-btn-ok modal-btn-${type} ${okButtonClassName}`}
                onClick={isForm ? undefined : handleOkClick}
                type={isForm ? "submit" : "button"}
                disabled={isLoading}
                form={isForm ? "modal-form" : undefined}
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    {loadingText}
                  </>
                ) : isForm ? (
                  submitText
                ) : (
                  okText
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions để dễ sử dụng
export const useModal = () => {
  const [modalState, setModalState] = React.useState({
    isOpen: false,
    config: {}
  });

  const openModal = (config) => {
    setModalState({
      isOpen: true,
      config: config
    });
  };

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const ModalComponent = () => (
    <Modal
      isOpen={modalState.isOpen}
      onClose={closeModal}
      {...modalState.config}
    />
  );

  return {
    openModal,
    closeModal,
    Modal: ModalComponent,
    modalState
  };
};

// Pre-configured modal types
export const showSuccessModal = (message, title = "Thành công") => ({
  type: "success",
  title,
  message,
  showCancelButton: false,
});

export const showErrorModal = (message, title = "Lỗi") => ({
  type: "error",
  title,
  message,
  showCancelButton: false,
});

export const showWarningModal = (message, title = "Cảnh báo") => ({
  type: "warning",
  title,
  message,
  showCancelButton: false,
});

export const showInfoModal = (message, title = "Thông báo") => ({
  type: "info",
  title,
  message,
  showCancelButton: false,
});

export const showConfirmModal = (message, onConfirm, title = "Xác nhận") => ({
  type: "confirm",
  title,
  message,
  showCancelButton: true,
  onOk: onConfirm,
  okText: "Đồng ý",
  cancelText: "Hủy",
});

export default Modal;