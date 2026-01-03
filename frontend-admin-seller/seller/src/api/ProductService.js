import axiosInstance from "../utils/axiosConfig";

const PRODUCTS_ENDPOINT = "/seller/products";

const handleError = (error) => {
  throw error.response?.data || { detail: error.message };
};

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
      const response = await axiosInstance.get(PRODUCTS_ENDPOINT, {
        params: { q, active_only, limit, offset },
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
      const response = await axiosInstance.get(
        `${PRODUCTS_ENDPOINT}/${productId}`
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Tạo sản phẩm mới
   */
  createProduct: async (data) => {
    try {
      const response = await axiosInstance.post(PRODUCTS_ENDPOINT, data);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Cập nhật sản phẩm
   */
  updateProduct: async (productId, data) => {
    try {
      const response = await axiosInstance.put(
        `${PRODUCTS_ENDPOINT}/${productId}`,
        data
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Xóa sản phẩm
   */
  deleteProduct: async (productId) => {
    try {
      const response = await axiosInstance.delete(
        `${PRODUCTS_ENDPOINT}/${productId}`
      );
      return response.data;
    } catch (error) {
      handleError(error);
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

      const params =
        primaryIndex !== null ? { primary_index: primaryIndex } : {};

      const response = await axiosInstance.post(
        `${PRODUCTS_ENDPOINT}/${productId}/images`,
        formData,
        { params }
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Set hình ảnh chính
   */
  setPrimaryImage: async (productId, imageId) => {
    try {
      const response = await axiosInstance.patch(
        `${PRODUCTS_ENDPOINT}/${productId}/images/${imageId}/primary`,
        {}
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Xóa hình ảnh
   */
  deleteImage: async (productId, imageId) => {
    try {
      const response = await axiosInstance.delete(
        `${PRODUCTS_ENDPOINT}/${productId}/images/${imageId}`
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Tạo variant
   */
  createVariant: async (productId, data) => {
    try {
      const response = await axiosInstance.post(
        `${PRODUCTS_ENDPOINT}/${productId}/variants`,
        data
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Cập nhật variant
   */
  updateVariant: async (productId, variantId, data) => {
    try {
      const response = await axiosInstance.put(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}`,
        data
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Xóa variant
   */
  deleteVariant: async (productId, variantId) => {
    try {
      const response = await axiosInstance.delete(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}`
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Lấy danh sách sizes của variant
   */
  getVariantSizes: async (productId, variantId) => {
    try {
      const response = await axiosInstance.get(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}/sizes`
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Tạo size
   */
  createSize: async (productId, variantId, data) => {
    try {
      const response = await axiosInstance.post(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}/sizes`,
        data
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Cập nhật size
   */
  updateSize: async (productId, variantId, sizeId, data) => {
    try {
      const response = await axiosInstance.put(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}/sizes/${sizeId}`,
        data
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * Xóa size
   */
  deleteSize: async (productId, variantId, sizeId) => {
    try {
      const response = await axiosInstance.delete(
        `${PRODUCTS_ENDPOINT}/${productId}/variants/${variantId}/sizes/${sizeId}`
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },
};

export default productService;
