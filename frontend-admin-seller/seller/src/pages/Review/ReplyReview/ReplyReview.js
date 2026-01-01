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
            size={18}
            fill={star <= rating ? "#ef4444" : "none"}
            stroke={star <= rating ? "#ef4444" : "#d1d5db"}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const remainingChars = 500 - replyText.length;
  const existingRepliesCount = review.replies?.length || 0;

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
            {/* Customer Info */}
            <div className="review-info__customer">
              <div className="customer-info">
                {review.reviewer?.avatar && (
                  <img
                    src={review.reviewer.avatar}
                    alt={review.reviewer.name}
                    className="customer-avatar"
                  />
                )}
                <div className="customer-details">
                  <span className="customer-name">
                    {review.reviewer?.name || "Ẩn danh"}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating and Date */}
            <div className="review-info__meta">
              <div className="review-rating">{renderStars(review.rating)}</div>
              <div className="review-date">
                <span>{formatDate(review.created_at)}</span>
              </div>
            </div>

            {/* Review Text */}
            {review.review_text && (
              <div className="review-info__content">
                <p className="review-text">{review.review_text}</p>
              </div>
            )}

            {/* Existing Replies */}
            {existingRepliesCount > 0 && (
              <div className="existing-replies">
                <p className="existing-replies__title">
                  Phản hồi hiện có ({existingRepliesCount}):
                </p>
                <div className="existing-replies__list">
                  {review.replies.map((reply, idx) => (
                    <div key={idx} className="existing-reply">
                      <div className="existing-reply__header">
                        <span className="reply-author">Shop</span>
                        <span className="reply-date">
                          {formatDate(reply.reply_date)}
                        </span>
                      </div>
                      <p className="existing-reply__text">{reply.reply_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSubmit} className="reply-form">
            <div className="form-group">
              <label className="form-group__label">
                {existingRepliesCount > 0
                  ? "Thêm phản hồi mới"
                  : "Nội dung phản hồi"}{" "}
                <span className="required">*</span>
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
              <p className="reply-tips__title">Gợi ý phản hồi:</p>
              <ul className="reply-tips__list">
                <li>Cảm ơn bạn đã đánh giá sản phẩm cho shop!</li>
                <li>Bạn có thắc mắc gì về sản phẩm không?</li>
                <li>Ủng hộ cho shop tiếp bạn nhé!</li>
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
