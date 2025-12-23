import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const PRODUCTS_ENDPOINT = `${API_URL}/seller/products`;

const productService = {
  /**
   * Lấy danh sách sản phẩm
   */
  listProducts: async ({
    q = "",
    active_only = true,
    limit = 10,
    offset = 0,
  } = {}) => {
    try {
      const response = await axios.get(PRODUCTS_ENDPOINT, {
        params: {
          q,
          active_only,
          limit,
          offset,
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

  /**
   * Lấy chi tiết sản phẩm
   */
  getProductDetail: async (productId) => {
    try {
      const response = await axios.get(`${PRODUCTS_ENDPOINT}/${productId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Tạo sản phẩm mới
   */
  createProduct: async (data) => {
    try {
      const response = await axios.post(PRODUCTS_ENDPOINT, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Cập nhật sản phẩm
   */
  updateProduct: async (productId, data) => {
    try {
      const response = await axios.put(
        `${PRODUCTS_ENDPOINT}/${productId}`,
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

  /**
   * Xóa sản phẩm
   */
  deleteProduct: async (productId) => {
    try {
      const response = await axios.delete(`${PRODUCTS_ENDPOINT}/${productId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Upload hình ảnh sản phẩm
   */
  uploadImages: async (productId, files, primaryIndex = null) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      let url = `${PRODUCTS_ENDPOINT}/${productId}/images`;
      if (primaryIndex !== null) {
        url += `?primary_index=${primaryIndex}`;
      }

      const response = await axios.post(url, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Set hình ảnh chính
   */
  setPrimaryImage: async (productId, imageId) => {
    try {
      const response = await axios.patch(
        `${PRODUCTS_ENDPOINT}/${productId}/images/${imageId}/primary`,
        {},
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Xóa hình ảnh
   */
  deleteImage: async (productId, imageId) => {
    try {
      const response = await axios.delete(
        `${PRODUCTS_ENDPOINT}/${productId}/images/${imageId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Tạo variant
   */
  createVariant: async (productId, data) => {
    try {
      const response = await axios.post(
        `${PRODUCTS_ENDPOINT}/${productId}/variants`,
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

  /**
   * Cập nhật variant
   */
  updateVariant: async (productId, variantId, data) => {
    try {
      const response = await axios.put(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}`,
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

  /**
   * Xóa variant
   */
  deleteVariant: async (productId, variantId) => {
    try {
      const response = await axios.delete(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Lấy danh sách sizes của variant
   */
  getVariantSizes: async (productId, variantId) => {
    try {
      const response = await axios.get(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}/sizes`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Tạo size
   */
  createSize: async (productId, variantId, data) => {
    try {
      const response = await axios.post(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}/sizes`,
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

  /**
   * Cập nhật size
   */
  updateSize: async (productId, variantId, sizeId, data) => {
    try {
      const response = await axios.put(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}/sizes/${sizeId}`,
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

  /**
   * Xóa size
   */
  deleteSize: async (productId, variantId, sizeId) => {
    try {
      const response = await axios.delete(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}/sizes/${sizeId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },
};

export default productService;
