import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const CARRIERS_ENDPOINT = `${API_URL}/admin/carriers`;

const carrierService = {
  listCarriers: async ({ q = "", limit = 10, offset = 0 } = {}) => {
    try {
      const response = await axios.get(CARRIERS_ENDPOINT, {
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

  createCarrier: async (data) => {
    try {
      const response = await axios.post(CARRIERS_ENDPOINT, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  updateCarrier: async (carrierId, data) => {
    try {
      const response = await axios.patch(
        `${CARRIERS_ENDPOINT}/${carrierId}`,
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

  uploadAvatar: async (carrierId, file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await axios.post(
        `${CARRIERS_ENDPOINT}/${carrierId}/upload-avatar`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  deleteCarrier: async (carrierId) => {
    try {
      const response = await axios.delete(`${CARRIERS_ENDPOINT}/${carrierId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  getCarrierDetail: async (carrierId) => {
    try {
      const response = await axios.get(`${CARRIERS_ENDPOINT}/${carrierId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },
};

export default carrierService;
