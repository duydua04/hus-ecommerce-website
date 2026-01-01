import React, { useState, useEffect } from "react";
import { X, Star, AlertCircle } from "lucide-react";
import "./ReplyReview.scss";

export default function ReplyReviewModal({
  isOpen,
  review,
  onConfirm,
  onCancel,
}) {
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReplyText("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !review) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!replyText.trim()) {
      setError("Vui lòng nhập nội dung phản hồi");
      return;
    }

    if (replyText.trim().length < 10) {
      setError("Nội dung phản hồi phải có ít nhất 10 ký tự");
      return;
    }

    if (replyText.trim().length > 500) {
      setError("Nội dung phản hồi không được vượt quá 500 ký tự");
      return;
    }

    onConfirm(replyText.trim());
  };

  const renderStars = (rating) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? "#fbbf24" : "none"}
            stroke={star <= rating ? "#fbbf24" : "#d1d5db"}
          />
        ))}
      </div>
    );
  };

  const remainingChars = 500 - replyText.length;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal__header">
          <h2 className="modal__title">Phản hồi đánh giá</h2>
          <button className="modal__close" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="modal__body">
          {/* Review Info */}
          <div className="review-info">
            <div className="review-info__header">
              <h4 className="review-info__product">{review.product_name}</h4>
              <div className="review-info__rating">
                {renderStars(review.rating)}
                <span className="rating-number">{review.rating}/5</span>
              </div>
            </div>

            {review.comment && (
              <div className="review-info__comment">
                <p className="review-info__label">Nhận xét của khách hàng:</p>
                <p className="review-info__text">{review.comment}</p>
              </div>
            )}

            <div className="review-info__customer">
              <span className="customer-name">
                {review.buyer_name || "Ẩn danh"}
              </span>
              <span className="customer-date">
                {review.created_at
                  ? new Date(review.created_at).toLocaleDateString("vi-VN")
                  : ""}
              </span>
            </div>
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSubmit} className="reply-form">
            <div className="form-group">
              <label className="form-group__label">
                Nội dung phản hồi <span className="required">*</span>
              </label>
              <textarea
                className={`form-textarea ${
                  error ? "form-textarea--error" : ""
                }`}
                placeholder="Nhập nội dung phản hồi của bạn..."
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  setError("");
                }}
                rows={6}
                maxLength={500}
              />
              <div className="form__footer">
                {error && (
                  <div className="form-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                <div className="char-counter">
                  <span
                    className={
                      remainingChars < 50 ? "char-counter--warning" : ""
                    }
                  >
                    {remainingChars} ký tự còn lại
                  </span>
                </div>
              </div>
            </div>

            <div className="reply-tips">
              <p className="reply-tips__title">💡 Gợi ý phản hồi:</p>
              <ul className="reply-tips__list">
                <li>Cảm ơn khách hàng đã đánh giá và tin tưởng sản phẩm</li>
                <li>Giải đáp thắc mắc hoặc khắc phục vấn đề (nếu có)</li>
                <li>Mời khách hàng tiếp tục ủng hộ trong tương lai</li>
              </ul>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={!replyText.trim()}
          >
            Gửi phản hồi
          </button>
        </div>
      </div>
    </div>
  );
}
