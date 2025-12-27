import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const SELLERS_ENDPOINT = `${API_URL}/admin/users/sellers`;

const sellerService = {
  listSellers: async ({
    q = "",
    active_only = true,
    limit = 10,
    offset = 0,
  } = {}) => {
    try {
      const response = await axios.get(SELLERS_ENDPOINT, {
        params: {
          q, // string | null
          active_only, // boolean
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

  deleteSeller: async (sellerId) => {
    try {
      const response = await axios.delete(`${SELLERS_ENDPOINT}/${sellerId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },
};

export default sellerService;
