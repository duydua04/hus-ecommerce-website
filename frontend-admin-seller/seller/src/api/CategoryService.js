import axiosInstance from "../utils/axiosConfig";

const CATEGORIES_ENDPOINT = "/common/categories";

const categoryService = {
  /**
   * Lấy toàn bộ danh mục
   */
  getAllCategories: async () => {
    try {
      const response = await axiosInstance.get(CATEGORIES_ENDPOINT);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          detail: error.response.data?.detail || "Lỗi từ server",
          status: error.response.status,
        };
      } else if (error.request) {
        throw { detail: "Không thể kết nối đến server" };
      } else {
        throw { detail: error.message };
      }
    }
  },

  /**
   * Lấy chi tiết danh mục
   */
  getCategoryDetail: async (categoryId) => {
    try {
      const response = await axiosInstance.get(
        `${CATEGORIES_ENDPOINT}/${categoryId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },
};

export default categoryService;
