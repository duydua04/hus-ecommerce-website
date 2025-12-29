import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const PROFILE_ENDPOINT = `${API_URL}/seller/profile`;

const profileService = {
  /**
   * Lấy thông tin hồ sơ Seller
   */
  getProfile: async () => {
    try {
      const response = await axios.get(PROFILE_ENDPOINT, {
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
   * Cập nhật thông tin hồ sơ Seller
   */
  updateProfile: async (data) => {
    try {
      const response = await axios.put(PROFILE_ENDPOINT, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
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
};

export default profileService;
