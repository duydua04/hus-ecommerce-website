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
    _id: data._id,
    id: data._id, // Thêm id để tương thích với code cũ
    product_id: data.product_id,
    product_name: data.product_name,
    order_id: data.order_id,
    reviewer: data.reviewer || {},
    rating: data.rating || 0,
    review_text: data.review_text || "",
    images: Array.isArray(data.images) ? data.images : [],
    videos: Array.isArray(data.videos) ? data.videos : [],
    replies: Array.isArray(data.replies) ? data.replies : [],
    created_at: data.created_at,
  };
};

const normalizePaginationData = (apiResponse = {}) => {
  // API trả về { meta: {...}, data: [...] }
  const meta = apiResponse.meta || {};
  const data = apiResponse.data || [];

  return {
    items: Array.isArray(data) ? data.map((i) => normalizeReview(i)) : [],
    total: meta.total || 0,
    page: Math.floor((meta.offset || 0) / (meta.limit || 10)) + 1,
    limit: meta.limit || 10,
    pages: Math.ceil((meta.total || 0) / (meta.limit || 10)),
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
            review._id === reviewId
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
        const repliesData = await reviewService.getReplies(reviewId);

        // API có thể trả về { data: [...] } hoặc trực tiếp [...]
        const replies = Array.isArray(repliesData)
          ? repliesData
          : Array.isArray(repliesData?.data)
          ? repliesData.data
          : [];

        // Cập nhật replies cho review cụ thể
        setReviews((prev) =>
          prev.map((review) =>
            review._id === reviewId ? { ...review, replies } : review
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
