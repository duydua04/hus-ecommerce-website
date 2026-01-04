import React, { useState, useEffect } from "react";
import { X, Check, Star } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import SearchBox from "../../components/common/SearchBox/SearchBox";
import ReviewDetailModal from "./ReviewDetail/ReviewDetail";
import ReplyReviewModal from "./ReplyReview/ReplyReview";
import useReview from "../../hooks/useReview";

import "../../assets/styles/page.scss";
import "./Review.scss";

export default function ReviewContent() {
  const {
    reviews,
    pagination,
    loading,
    error,
    fetchReviews,
    replyReview,
    getReplies,
    clearError,
  } = useReview();

  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [reviewToReply, setReviewToReply] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const itemsPerPage = 10;

  /* FETCH DATA */
  useEffect(() => {
    fetchReviews({
      product_name: null,
      rating: null,
      page: 1,
      limit: itemsPerPage,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews({
        product_name: searchQuery || null,
        rating: ratingFilter,
        page: currentPage,
        limit: itemsPerPage,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, ratingFilter, currentPage]);

  const totalPages = Math.ceil(pagination.total / itemsPerPage);

  /* HANDLERS */
  const handleViewDetail = async (review) => {
    try {
      setSelectedReview(review);
      setIsDetailModalOpen(true);

      // Gọi API lấy danh sách replies riêng biệt
      setLoadingReplies(true);
      await getReplies(review.id);
      setLoadingReplies(false);
    } catch (err) {
      console.error("Không tải được chi tiết đánh giá:", err);
      setLoadingReplies(false);
    }
  };

  const handleReplyClick = (review) => {
    // Lấy review đã có replies từ state (đã được update bởi getReplies)
    const reviewWithReplies = reviews.find((r) => r.id === review.id) || review;
    setReviewToReply(reviewWithReplies);
    setIsReplyModalOpen(true);
  };

  const handleReplyConfirm = async (replyText) => {
    if (!reviewToReply) return;

    try {
      // Gọi API tạo reply
      await replyReview(reviewToReply.id, replyText);
      setSuccessMessage("Đã gửi phản hồi thành công");

      setTimeout(() => setSuccessMessage(""), 3000);

      // Đóng modal reply
      setIsReplyModalOpen(false);
      setReviewToReply(null);

      // Nếu đang mở detail modal, cập nhật lại replies
      if (isDetailModalOpen && selectedReview?.id === reviewToReply.id) {
        await getReplies(reviewToReply.id);
      }
    } catch (err) {
      console.error("Error replying review:", err);
    }
  };

  const handleRatingFilterChange = (rating) => {
    setRatingFilter(rating);
    setCurrentPage(1);
  };

  /* RENDER RATING STARS */
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

  /* TABLE  */
  const columns = [
    {
      key: "product_id",
      label: "Sản phẩm",
      className: "table__cell--product",
      render: (v) => `Sản phẩm #${v}` || "N/A",
    },
    {
      key: "reviewer",
      label: "Khách hàng",
      className: "table__cell--buyer",
      render: (v) => v?.name || "Ẩn danh",
    },
    {
      key: "rating",
      label: "Đánh giá",
      className: "table__cell--rating",
      render: (v, row) => (
        <div className="rating-cell">
          {renderStars(v)}
          <span className="rating-number">{v}/5</span>
        </div>
      ),
    },
    {
      key: "review_text",
      label: "Nội dung",
      className: "table__cell--comment",
      render: (v) => {
        if (!v) return <span className="text-muted">Không có bình luận</span>;
        return v.length > 50 ? `${v.substring(0, 50)}...` : v;
      },
    },
    {
      key: "replies",
      label: "Phản hồi",
      className: "table__cell--replies",
      render: (v) => {
        const replyCount = Array.isArray(v) ? v.length : 0;
        return (
          <span
            className={`reply-badge ${
              replyCount > 0 ? "reply-badge--active" : ""
            }`}
          >
            {replyCount > 0 ? `${replyCount} phản hồi` : "Chưa phản hồi"}
          </span>
        );
      },
    },
  ];

  const actions = [
    {
      label: "Xem chi tiết",
      icon: "bx bx-show",
      onClick: handleViewDetail,
      className: "action-btn action-btn--view",
    },
    {
      label: "Phản hồi",
      icon: "bx bx-message-square-add",
      onClick: handleReplyClick,
      className: "action-btn action-btn--reply",
    },
  ];

  // Lấy review đã update từ state để truyền vào modal
  const currentSelectedReview = selectedReview
    ? reviews.find((r) => r.id === selectedReview.id) || selectedReview
    : null;

  /* RENDER */
  return (
    <main className="main">
      <PageHeader
        title="Đánh giá"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Đánh giá", path: "/reviews" },
        ]}
      />

      <div className="toolbar">
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Quản lý đánh giá</h3>
            <p className="toolbar__title-desc">
              Quản lý và phản hồi các đánh giá từ khách hàng
            </p>
          </div>
        </div>

        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm theo tên sản phẩm..."
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="toolbar__filters">
            <div className="filter-group">
              <label className="filter-label">Lọc theo sao:</label>
              <select
                className="filter-select"
                value={ratingFilter || ""}
                onChange={(e) =>
                  handleRatingFilterChange(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              >
                <option value="">Tất cả</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>

            {(ratingFilter || searchQuery) && (
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  setRatingFilter(null);
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
              >
                <i className="bx bx-x btn__icon"></i>
                <span className="btn__text">Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="toolbar__alert alert alert-error">
            <span>{error}</span>
            <button onClick={clearError} className="alert-close">
              <X size={18} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="toolbar__alert alert alert-success">
            <Check size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {loading && <div className="toolbar__loading">Đang tải...</div>}

        <div className="toolbar__stats">
          <div className="stats-card">
            <div className="stats-card__icon stats-card__icon--primary">
              <i className="bx bx-star"></i>
            </div>
            <div className="stats-card__content">
              <h4 className="stats-card__title">Tổng đánh giá</h4>
              <p className="stats-card__value-review">{pagination.total || 0}</p>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card__icon stats-card__icon--success">
              <i className="bx bx-message-square-check"></i>
            </div>
            <div className="stats-card__content">
              <h4 className="stats-card__title">Đã phản hồi</h4>
              <p className="stats-card__value-review">
                {reviews.filter((r) => r.replies && r.replies.length > 0)
                  .length || 0}
              </p>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card__icon stats-card__icon--warning">
              <i className="bx bx-message-square-x"></i>
            </div>
            <div className="stats-card__content">
              <h4 className="stats-card__title">Chưa phản hồi</h4>
              <p className="stats-card__value-review">
                {reviews.filter((r) => !r.replies || r.replies.length === 0)
                  .length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="toolbar__table">
          <Table columns={columns} data={reviews} actions={actions} />
        </div>

        {totalPages > 1 && (
          <div className="toolbar__pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/*  MODALS  */}
      <ReviewDetailModal
        isOpen={isDetailModalOpen}
        review={currentSelectedReview}
        loadingReplies={loadingReplies}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReview(null);
        }}
        onReply={() => {
          setIsDetailModalOpen(false);
          handleReplyClick(currentSelectedReview);
        }}
      />

      <ReplyReviewModal
        isOpen={isReplyModalOpen}
        review={reviewToReply}
        onConfirm={handleReplyConfirm}
        onCancel={() => {
          setIsReplyModalOpen(false);
          setReviewToReply(null);
        }}
      />
    </main>
  );
}
