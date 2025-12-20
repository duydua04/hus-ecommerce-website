import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const CATEGORIES_ENDPOINT = `${API_URL}/common/categories`;

const categoryService = {
  /**
   * Lấy toàn bộ danh mục
   */
  getAllCategories: async () => {
    try {
      const response = await axios.get(CATEGORIES_ENDPOINT, {
        withCredentials: true,
        timeout: 10000,
      });
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
      const response = await axios.get(`${CATEGORIES_ENDPOINT}/${categoryId}`, {
        withCredentials: true,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },
};

export default categoryService;
