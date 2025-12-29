import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const CATEGORIES_ENDPOINT = `${API_URL}/admin/categories`;

const categoryService = {
  listCategories: async ({ q = "", limit = 10, offset = 0 } = {}) => {
    try {
      const response = await axios.get(CATEGORIES_ENDPOINT, {
        params: {
          q, // string | null
          limit, // number
          offset, // number
        },
        withCredentials: true,
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

  createCategory: async (data) => {
    try {
      const response = await axios.post(CATEGORIES_ENDPOINT, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  updateCategory: async (categoryId, data) => {
    try {
      const response = await axios.put(
        `${CATEGORIES_ENDPOINT}/${categoryId}`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const response = await axios.delete(
        `${CATEGORIES_ENDPOINT}/${categoryId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  getCategoryDetail: async (categoryId) => {
    try {
      const response = await axios.get(`${CATEGORIES_ENDPOINT}/${categoryId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  // CHỨC NĂNG MỚI: Upload image cho category
  uploadCategoryImage: async (categoryId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${CATEGORIES_ENDPOINT}/upload-image`,
        formData,
        {
          params: { category_id: categoryId },
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },
};

export default categoryService;
