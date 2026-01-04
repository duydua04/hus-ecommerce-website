import React, { useState, useEffect } from "react";
import "./ImageUpload.scss";

export default function ImageUploadModal({
  isOpen,
  onClose,
  onUpload,
  multiple = false,
  title = "Tải lên hình ảnh",
  maxSizeMB = 2,
  acceptedFormats = "image/*",
  uploadButtonText = "Tải lên",
  cancelButtonText = "Hủy",
  dragDropText = "Kéo thả ảnh",
  orText = "hoặc",
  selectFileText = "Chọn tệp",
  changeImageText = "Đổi ảnh",
  maxSizeText,
  invalidFormatError = "Vui lòng chọn một tệp hình ảnh",
  maxSizeError,
  selectFileError = "Vui lòng chọn một tệp",
  uploadFailedError = "Tải lên thất bại. Vui lòng thử lại.",
}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const maxSizeErrorMessage =
    maxSizeError || `Kích thước tệp không được vượt quá ${maxSizeMB}MB`;
  const maxSizeInfoText = maxSizeText || `Tối đa ${maxSizeMB}MB`;

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setPreviews([]);
      setPrimaryIndex(0);
      setError("");
      setIsDragging(false);
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleFileSelect = (selectedFiles) => {
    setError("");

    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const newPreviews = [];

    for (let file of fileArray) {
      // Kiểm tra định dạng file
      if (!file.type.startsWith("image/")) {
        setError(invalidFormatError);
        continue;
      }

      // Kiểm tra kích thước file
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(maxSizeErrorMessage);
        continue;
      }

      validFiles.push(file);

      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === validFiles.length) {
          setPreviews(multiple ? [...previews, ...newPreviews] : newPreviews);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      setFiles(multiple ? [...files, ...validFiles] : validFiles);
    }
  };

  const handleRemoveImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setFiles(newFiles);
    setPreviews(newPreviews);

    // Điều chỉnh primaryIndex nếu cần
    if (primaryIndex === index) {
      setPrimaryIndex(0);
    } else if (primaryIndex > index) {
      setPrimaryIndex(primaryIndex - 1);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError(selectFileError);
      return;
    }

    setIsUploading(true);
    try {
      // Nếu multiple, truyền array files + primaryIndex
      // Nếu single, truyền file đầu tiên
      if (multiple) {
        await onUpload(files, primaryIndex);
      } else {
        await onUpload(files[0]);
      }
      onClose();
    } catch (err) {
      setError(uploadFailedError);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="image-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={isUploading}
          >
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className="modal-body">
          {previews.length === 0 ? (
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
                handleFileSelect(e.dataTransfer.files);
              }}
            >
              <i className="bx bx-cloud-upload upload-icon"></i>

              <p className="upload-text">{dragDropText}</p>
              <p className="upload-hint">{orText}</p>

              <label className="file-input-label">
                {selectFileText}
                <input
                  type="file"
                  accept={acceptedFormats}
                  multiple={multiple}
                  hidden
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </label>

              <p className="upload-info">
                {maxSizeInfoText}
                {multiple && " Có thể chọn nhiều ảnh"}
              </p>
            </div>
          ) : (
            <div className="preview-area">
              <div className="preview-grid">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className={`preview-item ${
                      multiple && primaryIndex === index
                        ? "preview-item--primary"
                        : ""
                    }`}
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="preview-image"
                    />

                    {multiple && (
                      <div className="preview-actions">
                        <button
                          className="btn-set-primary"
                          onClick={() => setPrimaryIndex(index)}
                          disabled={isUploading}
                          title="Đặt làm ảnh chính"
                        >
                          {primaryIndex === index ? (
                            <i className="bx bxs-star"></i>
                          ) : (
                            <i className="bx bx-star"></i>
                          )}
                        </button>
                      </div>
                    )}

                    <button
                      className="btn-remove"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isUploading}
                      title="Xóa ảnh"
                    >
                      <i className="bx bx-x"></i>
                    </button>
                  </div>
                ))}
              </div>

              {multiple && (
                <label className="btn-add-more">
                  <i className="bx bx-plus"></i> Thêm ảnh
                  <input
                    type="file"
                    accept={acceptedFormats}
                    multiple
                    hidden
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </label>
              )}

              <button
                className="btn-change"
                onClick={() => {
                  setFiles([]);
                  setPreviews([]);
                  setPrimaryIndex(0);
                }}
                disabled={isUploading}
              >
                {changeImageText}
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} disabled={isUploading}>
            {cancelButtonText}
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? "Đang tải..." : uploadButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
