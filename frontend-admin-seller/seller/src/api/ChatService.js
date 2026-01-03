import axiosInstance from "../utils/axiosConfig";

const ChatService = {
  /**
   * Upload ảnh cho chat
   * @param {File[]} files - Danh sách file ảnh
   * @returns {Promise<{urls: string[]}>}
   */
  async uploadImages(files) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await axiosInstance.post("/chat/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  /**
   * Gửi tin nhắn
   * @param {Object} payload
   * @param {string} payload.conversation_id
   * @param {string} payload.content - Nội dung text (optional)
   * @param {string[]} payload.image_urls - Danh sách URL ảnh (optional)
   * @returns {Promise<MessageResponse>}
   */
  async sendMessage(payload) {
    const res = await axiosInstance.post("/chat/send", payload);
    return res.data;
  },

  /**
   * Lấy danh sách cuộc trò chuyện (inbox)
   * @returns {Promise<ConversationResponse[]>}
   */
  async getConversations() {
    const res = await axiosInstance.get("/chat/conversations");
    return res.data;
  },

  /**
   * Lấy lịch sử tin nhắn theo conversation
   * @param {string} conversationId
   * @param {Object} options
   * @param {string} options.cursor - Cursor phân trang
   * @param {number} options.limit - Số lượng tin nhắn
   * @returns {Promise<ChatHistoryResponse>}
   */
  async getMessages(conversationId, { cursor = null, limit = 20 } = {}) {
    const params = { limit };
    if (cursor) params.cursor = cursor;

    const res = await axiosInstance.get(`/chat/${conversationId}/messages`, {
      params,
    });

    return res.data;
  },
};

export default ChatService;
