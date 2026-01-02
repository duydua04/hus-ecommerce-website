import axiosInstance from "../utils/axiosConfig";

const REVIEW_ENDPOINT = "/seller/reviews";

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
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;

      const queryParams = {
        offset,
        limit,
      };

      if (params.product_name) {
        queryParams.product_name = params.product_name;
      }
      if (params.rating) {
        queryParams.rating = params.rating;
      }

      const res = await axiosInstance.get(REVIEW_ENDPOINT, {
        params: queryParams,
      });

      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* CREATE REPLY - Trả lời đánh giá */
  async replyReview(reviewId, replyText) {
    try {
      const res = await axiosInstance.post(
        `${REVIEW_ENDPOINT}/${reviewId}/replies`,
        { reply_text: replyText }
      );

      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* GET REPLIES - Lấy danh sách phản hồi của một review */
  async getReplies(reviewId) {
    try {
      const res = await axiosInstance.get(
        `${REVIEW_ENDPOINT}/${reviewId}/replies`
      );

      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },
};

export default reviewService;
