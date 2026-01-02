import { useEffect, useState, useCallback, useRef } from "react";
import wsManager from "../utils/WebsocketManager";
import { chatApi } from "../api/ChatService";

export const useChat = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const unsubscribeRef = useRef(null);

  // Load initial messages
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const handleNewMessage = (data) => {
      // Chỉ add message nếu thuộc conversation hiện tại
      if (data.conversation_id === conversationId) {
        setMessages((prev) => {
          // Tránh duplicate
          const exists = prev.some((msg) => msg.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    };

    unsubscribeRef.current = wsManager.subscribe("message", handleNewMessage);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversationId]);

  const loadMessages = async (loadMore = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await chatApi.getMessages(
        conversationId,
        loadMore ? cursor : null
      );

      if (loadMore) {
        setMessages((prev) => [...response.messages, ...prev]);
      } else {
        setMessages(response.messages);
      }

      setCursor(response.next_cursor);
      setHasMore(!!response.next_cursor);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content, images = []) => {
    try {
      let imageUrls = [];

      // Upload images nếu có
      if (images.length > 0) {
        const uploadResult = await chatApi.uploadImages(images);
        imageUrls = uploadResult.urls; // Adjust theo response format
      }

      // Gửi message qua REST API
      const newMessage = await chatApi.sendMessage(
        conversationId,
        content,
        imageUrls
      );

      // Optimistic update (message sẽ được confirm lại qua WebSocket)
      setMessages((prev) => [...prev, newMessage]);

      return newMessage;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    hasMore,
    sendMessage,
    loadMore: () => loadMessages(true),
  };
};
