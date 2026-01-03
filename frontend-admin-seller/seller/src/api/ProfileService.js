import axiosInstance from "../utils/axiosConfig";

const PROFILE_ENDPOINT = "/seller/profile";

const profileService = {
  /**
   * Lấy thông tin hồ sơ Seller
   */
  getProfile: async () => {
    try {
      const response = await axiosInstance.get(PROFILE_ENDPOINT);
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
      const response = await axiosInstance.put(PROFILE_ENDPOINT, data);
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
