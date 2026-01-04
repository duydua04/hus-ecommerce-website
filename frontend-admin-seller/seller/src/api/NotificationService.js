import axiosInstance from "../utils/axiosConfig";

const SellerNotificationService = {
  /**
   * Lấy danh sách notification của seller
   */
  async getNotifications({
    limit = 20,
    cursor = null,
    unreadOnly = false,
  } = {}) {
    const params = {
      limit,
      unread_only: unreadOnly,
    };

    if (cursor) params.cursor = cursor;

    const res = await axiosInstance.get("/seller/notifications/", { params });

    return res.data;
  },

  /**
   * Đánh dấu một thông báo đã đọc
   */
  async markAsRead(notifId) {
    const res = await axiosInstance.put(
      `/seller/notifications/${notifId}/read`
    );
    return res.data;
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  async markAllAsRead() {
    const res = await axiosInstance.put("/seller/notifications/read-all");
    return res.data;
  },
};

export default SellerNotificationService;
