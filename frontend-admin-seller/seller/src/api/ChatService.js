import axiosInstance from "../utils/axiosConfig";

const ChatService = {
  /* UPLOAD IMAGE */
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

  /* SEND MESSAGE */
  async sendMessage(payload) {
    const res = await axiosInstance.post("/chat/send", payload);
    return res.data;
  },

  /* CONVERSATIONS */
  async getConversations() {
    const res = await axiosInstance.get("/chat/conversations");
    return res.data;
  },

  /* MESSAGES */
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
