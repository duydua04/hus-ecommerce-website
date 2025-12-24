import React, { useState, useEffect } from "react";
import "./AvatarUpload.scss";

export default function AvatarUploadModal({
  isOpen,
  onClose,
  onUpload,
  carrierId,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreview(null);
      setError("");
      setIsDragging(false);
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleFileSelect = (selectedFile) => {
    setError("");

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Vui lòng chọn một tệp hình ảnh");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("Kích thước tệp không được vượt quá 2MB");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!carrierId) {
      setError("Không xác định được đơn vị vận chuyển");
      return;
    }

    if (!file) {
      setError("Vui lòng chọn một tệp");
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(carrierId, file);
      onClose();
    } catch {
      setError("Tải lên thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="avatar-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Cập nhật avatar</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={isUploading}
          >
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className="modal-body">
          {!preview ? (
            <div
              className={`upload-area ${isDragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files?.[0]);
              }}
            >
              <i className="bx bx-cloud-upload upload-icon"></i>

              <p className="upload-text">Kéo thả ảnh</p>
              <p className="upload-hint">hoặc</p>

              <label className="file-input-label">
                Chọn tệp
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </label>

              <p className="upload-info">Tối đa 2MB</p>
            </div>
          ) : (
            <div className="preview-area">
              <img src={preview} alt="Preview" className="preview-image" />
              <button
                className="btn-change"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                disabled={isUploading}
              >
                Đổi ảnh
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} disabled={isUploading}>
            Hủy
          </button>
          <button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? "Đang tải..." : "Tải lên"}
          </button>
        </div>
      </div>
    </div>
  );
}
