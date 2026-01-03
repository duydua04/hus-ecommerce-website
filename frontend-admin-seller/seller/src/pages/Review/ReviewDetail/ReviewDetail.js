import React from "react";
import {
  X,
  Star,
  User,
  Package,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import "./ReviewDetail.scss";

import { formatDetailedTime } from "../../../utils/timeUtils";

export default function ReviewDetailModal({
  isOpen,
  review,
  loadingReplies,
  onClose,
  onReply,
}) {
  if (!isOpen || !review) return null;

  const renderStars = (rating) => {
    return (
      <div className="rating-stars rating-stars--large">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            fill={star <= rating ? "#fbbf24" : "none"}
            stroke={star <= rating ? "#fbbf24" : "#d1d5db"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal__header">
          <h2 className="modal__title">Chi tiết đánh giá</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="modal__body">
          {/* Product Info */}
          <div className="review-section">
            <div className="review-section__header">
              <Package size={20} />
              <h3 className="review-section__title">Thông tin sản phẩm</h3>
            </div>
            <div className="review-section__content">
              <div className="info-row">
                <span className="info-label">Sản phẩm:</span>
                <span className="info-value">
                  #{review.product_name || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="review-section">
            <div className="review-section__header">
              <User size={20} />
              <h3 className="review-section__title">Thông tin khách hàng</h3>
            </div>
            <div className="review-section__content">
              <div className="customer-info">
                {review.reviewer?.avatar && (
                  <img
                    src={review.reviewer.avatar}
                    alt={review.reviewer.name}
                    className="customer-avatar"
                  />
                )}
                <div className="customer-details">
                  <div className="info-row">
                    <span className="info-label">Tên khách hàng:</span>
                    <span className="info-value">
                      {review.reviewer?.name || "Ẩn danh"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Mã đơn hàng:</span>
                    <span className="info-value">
                      #{review.order_id || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating & Review */}
          <div className="review-section">
            <div className="review-section__header">
              <Star size={20} />
              <h3 className="review-section__title">Đánh giá</h3>
            </div>
            <div className="review-section__content">
              <div className="rating-display">
                {renderStars(review.rating)}
                <span className="rating-text">{review.rating}/5</span>
              </div>

              <div className="review-date">
                <Calendar size={16} />
                <span className="info-value">
                  {formatDetailedTime(review.created_at)}
                </span>
              </div>

              {review.review_text && (
                <div className="review-comment">
                  <p className="review-comment__text">{review.review_text}</p>
                </div>
              )}

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="review-media">
                  <p className="review-media__label">
                    <ImageIcon size={16} />
                    Hình ảnh đính kèm ({review.images.length})
                  </p>
                  <div className="review-media__grid">
                    {review.images.map((img, idx) => (
                      <div key={idx} className="review-media__item">
                        <img src={img} alt={`Review ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {review.videos && review.videos.length > 0 && (
                <div className="review-media">
                  <p className="review-media__label">
                    <Video size={16} />
                    Video đính kèm ({review.videos.length})
                  </p>
                  <div className="review-media__grid">
                    {review.videos.map((videoKey, idx) => (
                      <div
                        key={idx}
                        className="review-media__item review-media__item--video"
                      >
                        <Video size={32} />
                        <span className="video-label">Video {idx + 1}</span>
                        <span className="video-key">{videoKey}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Replies */}
          <div className="review-section">
            <div className="review-section__header">
              <MessageSquare size={20} />
              <h3 className="review-section__title">
                Phản hồi{" "}
                {review.replies && review.replies.length > 0
                  ? `(${review.replies.length})`
                  : ""}
              </h3>
            </div>
            <div className="review-section__content">
              {loadingReplies ? (
                <div className="replies-loading">Đang tải phản hồi...</div>
              ) : review.replies && review.replies.length > 0 ? (
                <div className="replies-list">
                  {review.replies.map((reply, idx) => (
                    <div key={idx} className="reply-item">
                      <div className="reply-header">
                        <span className="reply-author">
                          <User size={14} />
                          Shop
                        </span>
                        <span className="reply-date">
                          {formatDetailedTime(reply.reply_date)}
                        </span>
                      </div>
                      <p className="reply-text">{reply.reply_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="replies-empty">Chưa có phản hồi nào</p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Đóng
          </button>
          {onReply && (
            <button className="btn btn--primary" onClick={onReply}>
              <MessageSquare size={18} />
              <span>Phản hồi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
