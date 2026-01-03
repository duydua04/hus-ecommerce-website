import axiosInstance from "../utils/axiosConfig";

const AVATARS_ENDPOINT = "/avatars";

const extractErrorMessage = (detail) => {
  if (Array.isArray(detail)) {
    return detail.map((e) => e.msg).join(", ");
  }

  if (typeof detail === "object" && detail !== null) {
    return detail.msg || "Dữ liệu không hợp lệ";
  }

  if (typeof detail === "string") {
    return detail;
  }

  return "Có lỗi xảy ra";
};

const avatarService = {
  uploadMyAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axiosInstance.post(
        `${AVATARS_ENDPOINT}/me`,
        formData,
        { timeout: 30000 }
      );
      return data;
    } catch (err) {
      throw {
        detail: extractErrorMessage(err.response?.data?.detail),
        status: err.response?.status,
      };
    }
  },

  deleteMyAvatar: async () => {
    try {
      const { data } = await axiosInstance.delete(`${AVATARS_ENDPOINT}/me`);
      return data;
    } catch (err) {
      throw {
        detail: extractErrorMessage(err.response?.data?.detail),
        status: err.response?.status,
      };
    }
  },

  validateFile: (file, maxSizeMB = 10) => {
    if (!file) return "Chưa chọn file";
    if (!file.type.startsWith("image/")) return "File phải là ảnh";
    if (file.size > maxSizeMB * 1024 * 1024)
      return `File phải nhỏ hơn ${maxSizeMB}MB`;
    return null;
  },
};

export default avatarService;
