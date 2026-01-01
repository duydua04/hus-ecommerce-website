import { useState, useCallback } from "react";
import reviewService from "../api/ReviewService";

/* Utils */

const extractErrorMessage = (err) => {
  if (Array.isArray(err?.detail)) {
    return err.detail.map((e) => e.msg).join(", ");
  }
  return err?.detail || err?.message || "Đã xảy ra lỗi";
};

const normalizeReview = (data = {}) => {
  return {
    id: data.id || data._id,
    product_id: data.product_id,
    product_name: data.product_name,
    buyer_id: data.buyer_id,
    buyer_name: data.buyer_name,
    seller_id: data.seller_id,
    order_id: data.order_id,
    rating: data.rating || 0,
    comment: data.comment || "",
    images: Array.isArray(data.images) ? data.images : [],
    replies: Array.isArray(data.replies) ? data.replies : [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

const normalizePaginationData = (data = {}) => {
  return {
    items: Array.isArray(data.items)
      ? data.items.map((i) => normalizeReview(i))
      : [],
    total: data.total || 0,
    page: data.page || 1,
    limit: data.limit || 10,
    pages: data.pages || 0,
  };
};

/* Hook */

const useReview = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(extractErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ===== Fetch Reviews ===== */
  const fetchReviews = useCallback(
    (params = {}) =>
      run(async () => {
        const data = await reviewService.getReviews(params);
        const normalized = normalizePaginationData(data);

        setReviews(normalized.items);
        setPagination({
          total: normalized.total,
          page: normalized.page,
          limit: normalized.limit,
          pages: normalized.pages,
        });

        return normalized;
      }),
    []
  );

  /* ===== Reply Review ===== */
  const replyReview = useCallback(
    (reviewId, replyText) =>
      run(async () => {
        const reply = await reviewService.replyReview(reviewId, replyText);

        // Cập nhật review trong state với reply mới
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  replies: [...(review.replies || []), reply],
                }
              : review
          )
        );

        return reply;
      }),
    []
  );

  /* ===== Get Replies ===== */
  const getReplies = useCallback(
    (reviewId) =>
      run(async () => {
        const replies = await reviewService.getReplies(reviewId);

        // Cập nhật replies cho review cụ thể
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, replies: Array.isArray(replies) ? replies : [] }
              : review
          )
        );

        return replies;
      }),
    []
  );

  return {
    reviews,
    pagination,
    loading,
    error,
    fetchReviews,
    replyReview,
    getReplies,
    clearError: () => setError(null),
    clearReviews: () => {
      setReviews([]);
      setPagination({ total: 0, page: 1, limit: 10, pages: 0 });
    },
  };
};

export default useReview;
