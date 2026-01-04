import { useCallback, useEffect, useRef, useState } from "react";
import ChatService from "../api/ChatService";
import { WebSocketClient } from "./websocket";

export default function useChat({ role = "seller" } = {}) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);

  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const activeConvRef = useRef(null);

  /* HELPERS  */

  const normalizeConversation = (conv) => ({
    id: conv.conversation_id,
    partner: conv.partner,
    customer_name: conv.partner?.name,
    customer_avatar: conv.partner?.avatar,
    last_message: conv.last_message,
    last_message_time: conv.last_message_at,
    unread_count:
      role === "seller"
        ? conv.unread_counts?.seller || 0
        : conv.unread_counts?.buyer || 0,
  });

  const normalizeMessage = (msg) => ({
    id: msg._id || `tmp_${Date.now()}`,
    conversation_id: msg.conversation_id,
    sender_role: msg.sender,
    content: msg.content || null,
    image_urls: msg.images || [],
    is_read: msg.is_read || false,
    created_at: msg.created_at,
  });

  const getRecipientId = () => {
    const conv = conversations.find((c) => c.id === activeConversationId);
    return conv?.partner?.id;
  };

  /* CONVERSATIONS */

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await ChatService.getConversations();
      const list = Array.isArray(res) ? res : res.conversations || [];
      setConversations(list.map(normalizeConversation));
    } finally {
      setLoadingConversations(false);
    }
  }, [role]);

  const selectConversation = useCallback(async (conversationId) => {
    setActiveConversationId(conversationId);
    activeConvRef.current = conversationId;

    setMessages([]);
    setCursor(null);
    loadMessages(conversationId, true);

    // Mark as read when selecting conversation
    try {
      await ChatService.markAsRead(conversationId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  }, []);

  /* MESSAGES */

  const loadMessages = useCallback(
    async (conversationId, reset = false) => {
      if (!conversationId) return;

      setLoadingMessages(true);
      try {
        const res = await ChatService.getMessages(conversationId, {
          cursor: reset ? null : cursor,
        });

        const list = res.messages.map(normalizeMessage);

        setMessages((prev) => (reset ? list : [...list, ...prev]));
        setCursor(res.next_cursor || null);
      } finally {
        setLoadingMessages(false);
      }
    },
    [cursor]
  );

  const appendMessage = (conversationId, message) => {
    setMessages((prev) => [...prev, message]);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              last_message: message.content || "[Hình ảnh]",
              last_message_time: message.created_at,
              unread_count: 0,
            }
          : c
      )
    );
  };

  const sendTextMessage = async (conversationId, content) => {
    if (!content?.trim()) return;

    setSending(true);
    try {
      const msg = await ChatService.sendMessage({
        conversation_id: conversationId,
        recipient_id: getRecipientId(),
        content: content.trim(),
      });

      const normalized = normalizeMessage(msg);
      appendMessage(conversationId, normalized);
      return normalized;
    } finally {
      setSending(false);
    }
  };

  const sendImageMessage = async (conversationId, files) => {
    if (!files?.length) return;

    setSending(true);
    try {
      const upload = await ChatService.uploadImages(files);

      const msg = await ChatService.sendMessage({
        conversation_id: conversationId,
        recipient_id: getRecipientId(),
        image_urls: upload.urls,
      });

      const normalized = normalizeMessage(msg);
      appendMessage(conversationId, normalized);
      return normalized;
    } finally {
      setSending(false);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await ChatService.markAsRead(conversationId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  /* WEBSOCKET */

  useEffect(() => {
    WebSocketClient.connect();

    return WebSocketClient.subscribe("chat", (ws) => {
      const data = ws.payload || ws;
      if (!data.conversation_id || !data.sender) return;

      const msg = normalizeMessage(data);
      const convId = msg.conversation_id;

      if (msg.sender_role === role) return;

      if (activeConvRef.current === convId) {
        setMessages((prev) => [...prev, msg]);

        // Auto mark as read when receiving message in active conversation
        markConversationAsRead(convId);
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId);
        if (idx === -1) return prev;

        const updated = [...prev];
        const conv = updated[idx];

        updated[idx] = {
          ...conv,
          last_message: msg.content || "[Hình ảnh]",
          last_message_time: msg.created_at,
          unread_count:
            activeConvRef.current === convId ? 0 : conv.unread_count + 1,
        };

        updated.unshift(updated.splice(idx, 1)[0]);
        return updated;
      });
    });
  }, [role]);

  /* INIT */

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    activeConversationId,
    activeConversation: conversations.find(
      (c) => c.id === activeConversationId
    ),

    messages,
    hasMoreMessages: !!cursor,

    loadingConversations,
    loadingMessages,
    sending,

    selectConversation,
    loadMoreMessages: () => loadMessages(activeConversationId, false),

    sendTextMessage,
    sendImageMessage,
    markConversationAsRead,
  };
}
