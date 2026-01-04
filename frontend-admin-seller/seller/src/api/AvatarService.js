import axiosInstance from "../utils/axiosConfig";

const AVATARS_ENDPOINT = "/avatars";

const avatarService = {
  /* Upload avatar cho user hiện tại */
  uploadMyAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post(
        `${AVATARS_ENDPOINT}/me`,
        formData,
        {
          timeout: 30000, // 30s cho upload file
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          detail: error.response.data?.detail || "Lỗi khi upload avatar",
          status: error.response.status,
        };
      } else if (error.request) {
        throw { detail: "Không thể kết nối đến server" };
      } else {
        throw { detail: error.message };
      }
    }
  },

  /* Xóa avatar của user hiện tại */
  deleteMyAvatar: async () => {
    try {
      const response = await axiosInstance.delete(`${AVATARS_ENDPOINT}/me`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          detail: error.response.data?.detail || "Lỗi khi xóa avatar",
          status: error.response.status,
        };
      } else if (error.request) {
        throw { detail: "Không thể kết nối đến server" };
      } else {
        throw { detail: error.message };
      }
    }
  },

  /* Validate file trước khi upload */
  validateFile: (file, maxSizeMB = 10) => {
    if (!file) {
      return { valid: false, error: "Chưa chọn file" };
    }

    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "File phải là ảnh" };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `Dung lượng file phải nhỏ hơn ${maxSizeMB}MB`,
      };
    }

    // Kiểm tra định dạng được hỗ trợ
    const supportedFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!supportedFormats.includes(file.type)) {
      return {
        valid: false,
        error: "Chỉ hỗ trợ định dạng JPG, PNG, GIF, WEBP",
      };
    }

    return { valid: true };
  },

  /* Preview ảnh trước khi upload */
  previewImage: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },
};

export default avatarService;
