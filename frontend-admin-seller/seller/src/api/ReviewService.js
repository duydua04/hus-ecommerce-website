import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const REVIEW_ENDPOINT = `${API_URL}/seller/reviews`;

const handleAxiosError = (error) => {
  if (error.response) {
    throw {
      detail: error.response.data?.detail || error.response.data?.message,
      status: error.response.status,
    };
  }

  if (error.request) {
    throw { detail: "Không thể kết nối đến server" };
  }

  throw { detail: error.message };
};

const reviewService = {
  /* GET LIST - Lấy danh sách review của shop */
  async getReviews(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // API sử dụng offset thay vì page
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;

      if (params.product_name) {
        queryParams.append("product_name", params.product_name);
      }
      if (params.rating) {
        queryParams.append("rating", params.rating);
      }
      queryParams.append("offset", offset);
      queryParams.append("limit", limit);

      const res = await axios.get(
        `${REVIEW_ENDPOINT}?${queryParams.toString()}`,
        { withCredentials: true }
      );

      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* CREATE REPLY - Trả lời đánh giá */
  async replyReview(reviewId, replyText) {
    try {
      const res = await axios.post(
        `${REVIEW_ENDPOINT}/${reviewId}/replies`,
        { reply_text: replyText },
        { withCredentials: true }
      );

      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* GET REPLIES - Lấy danh sách phản hồi của một review */
  async getReplies(reviewId) {
    try {
      const res = await axios.get(`${REVIEW_ENDPOINT}/${reviewId}/replies`, {
        withCredentials: true,
      });

      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },
};

export default reviewService;