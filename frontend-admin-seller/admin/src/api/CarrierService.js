import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const CARRIERS_ENDPOINT = `${API_URL}/admin/carriers`; // Đúng cú pháp

const carrierService = {
  /**
   * Lấy danh sách các đơn vị vận chuyển hoạt động
   */
  listCarriers: async (q = null) => {
    try {
      const response = await axios.get(`${CARRIERS_ENDPOINT}/`, {
        params: { q },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Tạo một đơn vị vận chuyển mới
   */
  createCarrier: async (data) => {
    try {
      const response = await axios.post(`${CARRIERS_ENDPOINT}/`, data, {
        withCredentials: true,
        headers: {
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
   */
  updateCarrier: async (carrierId, data) => {
    try {
      const response = await axios.patch(
        `${CARRIERS_ENDPOINT}/${carrierId}`,
        data,
        {
          withCredentials: true,
          headers: {
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
   * Upload avatar
   */
  uploadAvatar: async (carrierId, file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await axios.post(
        `${CARRIERS_ENDPOINT}/${carrierId}/upload-avatar`,
        formData,
        {
          withCredentials: true,
          headers: {
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
   * Xóa carrier
   */
  deleteCarrier: async (carrierId) => {
    try {
      const response = await axios.delete(`${CARRIERS_ENDPOINT}/${carrierId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy chi tiết carrier
   */
  getCarrierDetail: async (carrierId) => {
    try {
      const response = await axios.get(`${CARRIERS_ENDPOINT}/${carrierId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default carrierService;
