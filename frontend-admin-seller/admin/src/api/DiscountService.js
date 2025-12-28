import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DISCOUNTS_ENDPOINT = `${API_URL}/admin/discounts`;

const discountService = {
  // get discount list
  listDiscounts: async ({ q = "", limit = 10, offset = 0 } = {}) => {
    try {
      const response = await axios.get(DISCOUNTS_ENDPOINT, {
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

  // create discount
  createDiscount: async (data) => {
    try {
      const response = await axios.post(DISCOUNTS_ENDPOINT, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  // update discount
  updateDiscount: async (discountId, data) => {
    try {
      const response = await axios.patch(
        `${DISCOUNTS_ENDPOINT}/${discountId}`,
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

  // set status for discount
  setStatus: async (discountId, isActive) => {
    try {
      const response = await axios.patch(
        `${DISCOUNTS_ENDPOINT}/${discountId}/status`,
        { is_active: isActive },
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

  // delete discount
  deleteDiscount: async (discountId) => {
    try {
      const response = await axios.delete(
        `${DISCOUNTS_ENDPOINT}/${discountId}`,
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

export default discountService;
