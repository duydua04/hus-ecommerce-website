import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const CARRIERS_ENDPOINT = `${API_URL}/admin/carriers/`;

const carrierService = {
  /**
   * Lấy danh sách các đơn vị vận chuyển hoạt động
   * @param {string} q - Query tìm kiếm
   * @returns {Promise<Array>}
   */
  listCarriers: async (q = null) => {
    try {
      const response = await axios.get(CARRIERS_ENDPOINT, {
        params: { q },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Tạo một đơn vị vận chuyển mới
   * @param {Object} data - Dữ liệu carrier
   * @returns {Promise<Object>}
   */
  createCarrier: async (data) => {
    try {
      const response = await axios.post(CARRIERS_ENDPOINT, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cập nhật thông tin đơn vị vận chuyển
   * @param {number} carrierId - ID của carrier
   * @param {Object} data - Dữ liệu cần cập nhật
   * @returns {Promise<Object>}
   */
  updateCarrier: async (carrierId, data) => {
    try {
      const response = await axios.patch(
        `${CARRIERS_ENDPOINT}/${carrierId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Tải lên avatar cho đơn vị vận chuyển
   * @param {number} carrierId - ID của carrier
   * @param {File} file - File hình ảnh
   * @returns {Promise<Object>}
   */
  uploadAvatar: async (carrierId, file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await axios.post(
        `${CARRIERS_ENDPOINT}/${carrierId}/upload-avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xóa đơn vị vận chuyển
   * @param {number} carrierId - ID của carrier
   * @returns {Promise<Object>}
   */
  deleteCarrier: async (carrierId) => {
    try {
      const response = await axios.delete(`${CARRIERS_ENDPOINT}/${carrierId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy chi tiết một đơn vị vận chuyển
   * @param {number} carrierId - ID của carrier
   * @returns {Promise<Object>}
   */
  getCarrierDetail: async (carrierId) => {
    try {
      const response = await axios.get(`${CARRIERS_ENDPOINT}/${carrierId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default carrierService;
