import axios from "axios";

//const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const chatApi = {
  // Gửi message qua REST API (không qua WebSocket)
  sendMessage: async (conversationId, content, imageUrls = []) => {
    const response = await axios.post(`${API_BASE}/chat/send`, {
      conversation_id: conversationId,
      content: content,
      image_urls: imageUrls,
    });
    return response.data;
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await axios.post(`${API_BASE}/chat/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getConversations: async () => {
    const response = await axios.get(`${API_BASE}/chat/conversations`);
    return response.data;
  },

  getMessages: async (conversationId, cursor = null, limit = 20) => {
    const response = await axios.get(
      `${API_BASE}/chat/${conversationId}/messages`,
      { params: { cursor, limit } }
    );
    return response.data;
  },
};
