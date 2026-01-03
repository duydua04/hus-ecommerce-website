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

  /* =======================
     CONVERSATIONS
  ======================= */

  const normalizeConversation = useCallback(
    (conv) => {
      const unread =
        role === "seller"
          ? conv.unread_counts?.seller || 0
          : conv.unread_counts?.buyer || 0;

      return {
        id: conv.conversation_id,
        customer_name: conv.partner?.name,
        customer_avatar: conv.partner?.avatar,
        partner: {
          id: conv.partner?.id,
          name: conv.partner?.name,
          avatar: conv.partner?.avatar,
          role: conv.partner?.role,
        },
        last_message: conv.last_message,
        last_message_time: conv.last_message_at,
        unread_count: unread,
      };
    },
    [role]
  );

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await ChatService.getConversations();
      const list = Array.isArray(res) ? res : res.conversations || [];

      setConversations(list.map(normalizeConversation));
    } catch (err) {
      console.error("❌ Load conversations error:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, [normalizeConversation]);

  /* =======================
     MESSAGES
  ======================= */

  const normalizeMessage = (msg) => ({
    id: msg._id || `tmp_${Date.now()}_${Math.random()}`,
    conversation_id: msg.conversation_id,
    sender_role: msg.sender,
    content: msg.content || null,
    image_urls: msg.images || [],
    is_read: msg.is_read || false,
    created_at: msg.created_at || new Date().toISOString(),
  });

  const loadMessages = useCallback(
    async (conversationId, { reset = false } = {}) => {
      if (!conversationId) return;

      setLoadingMessages(true);
      try {
        const res = await ChatService.getMessages(conversationId, {
          cursor: reset ? null : cursor,
        });

        const newMessages = res.messages.map(normalizeMessage);

        setMessages((prev) =>
          reset ? newMessages : [...newMessages, ...prev]
        );
        setCursor(res.next_cursor || null);
      } catch (err) {
        console.error("❌ Load messages error:", err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [cursor]
  );

  const selectConversation = useCallback(
    async (conversationId) => {
      setActiveConversationId(conversationId);
      activeConvRef.current = conversationId;

      setMessages([]);
      setCursor(null);
      loadMessages(conversationId, { reset: true });

      try {
        await ChatService.markAsRead(conversationId);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
          )
        );
      } catch (err) {
        console.error("❌ Mark as read error:", err);
      }
    },
    [loadMessages]
  );

  /* =======================
     SEND MESSAGE
  ======================= */

  const getRecipientId = useCallback(() => {
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) throw new Error("No active conversation");
    return conv.partner.id;
  }, [conversations, activeConversationId]);

  const appendMessage = useCallback((conversationId, message) => {
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
  }, []);

  const sendTextMessage = useCallback(
    async (conversationId, content) => {
      if (!content?.trim()) return;

      setSending(true);
      try {
        const message = await ChatService.sendMessage({
          conversation_id: conversationId,
          recipient_id: getRecipientId(),
          content: content.trim(),
        });

        const normalized = normalizeMessage(message);
        appendMessage(conversationId, normalized);
        return normalized;
      } finally {
        setSending(false);
      }
    },
    [appendMessage, getRecipientId]
  );

  const sendImageMessage = useCallback(
    async (conversationId, files) => {
      if (!files?.length) return;

      setSending(true);
      try {
        const upload = await ChatService.uploadImages(files);

        const message = await ChatService.sendMessage({
          conversation_id: conversationId,
          recipient_id: getRecipientId(),
          image_urls: upload.urls,
        });

        const normalized = normalizeMessage(message);
        appendMessage(conversationId, normalized);
        return normalized;
      } finally {
        setSending(false);
      }
    },
    [appendMessage, getRecipientId]
  );

  /* =======================
     WEBSOCKET
  ======================= */

  useEffect(() => {
    WebSocketClient.connect();

    const unsubscribe = WebSocketClient.subscribe("chat", (ws) => {
      const data = ws.payload || ws;
      if (!data.conversation_id || !data.sender) return;

      const msg = normalizeMessage(data);
      const convId = msg.conversation_id;

      // Skip own message
      if (msg.sender_role === role) return;

      if (activeConvRef.current === convId) {
        setMessages((prev) => [...prev, msg]);
        ChatService.markAsRead(convId).catch(() => {});
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId);
        if (idx === -1) {
          loadConversations();
          return prev;
        }

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

    return unsubscribe;
  }, [role, loadConversations]);

  /* =======================
     INIT
  ======================= */

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /* =======================
     PUBLIC API
  ======================= */

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  return {
    conversations,
    activeConversation,
    activeConversationId,

    messages,
    hasMoreMessages: !!cursor,

    loadingConversations,
    loadingMessages,
    sending,

    selectConversation,
    loadMessages: () => loadMessages(activeConversationId, { reset: false }),

    sendTextMessage,
    sendImageMessage,
  };
}
