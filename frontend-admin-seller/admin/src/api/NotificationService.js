import axiosInstance from "../utils/axiosConfig";

const NotificationService = {
  /**
   * Lấy danh sách notification
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

    const res = await axiosInstance.get("/admin/notifications/", { params });

    return res.data;
  },

  /**
   * Đánh dấu đã đọc
   */
  async markAsRead(notifId) {
    const res = await axiosInstance.put(`/admin/notifications/${notifId}/read`);
    return res.data;
  },

  /**
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead() {
    const res = await axiosInstance.put("/admin/notifications/read-all");
    return res.data;
  },
};

export default NotificationService;
