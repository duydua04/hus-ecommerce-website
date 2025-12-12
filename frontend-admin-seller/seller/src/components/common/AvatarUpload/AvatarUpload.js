import React, { useState } from "react";
import { X, Upload } from "lucide-react";
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

  const handleFileSelect = (selectedFile) => {
    setError("");

    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Vui lòng chọn một tệp hình ảnh");
      return;
    }

    // Validate file size (max 2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("Kích thước tệp không được vượt quá 2MB");
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e) => {
    handleFileSelect(e.target.files?.[0] || null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    handleFileSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn một tệp");
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(carrierId, file);
      setFile(null);
      setPreview(null);
      onClose();
    } catch (err) {
      setError("Tải lên thất bại. Vui lòng thử lại.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="avatar-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Tải lên avatar</h2>
          <button
            onClick={onClose}
            className="modal-close"
            disabled={isUploading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {!preview ? (
            <div
              className={`upload-area ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload size={48} className="upload-icon" />
              <p className="upload-text">Kéo và thả hình ảnh ở đây</p>
              <p className="upload-hint">hoặc</p>
              <label htmlFor="file-input" className="file-input-label">
                Chọn tệp từ máy tính
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                disabled={isUploading}
              />
              <p className="upload-info">
                Kích thước tối đa: 2MB. Định dạng: PNG, JPG, GIF...
              </p>
            </div>
          ) : (
            <div className="preview-area">
              <img src={preview} alt="Preview" className="preview-image" />
              <p className="preview-filename">{file.name}</p>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setError("");
                }}
                className="btn-change"
                disabled={isUploading}
              >
                Thay đổi ảnh
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isUploading}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className="btn-primary"
            disabled={!file || isUploading}
          >
            {isUploading ? "Đang tải lên..." : "Tải lên"}
          </button>
        </div>
      </div>
    </div>
  );
}
