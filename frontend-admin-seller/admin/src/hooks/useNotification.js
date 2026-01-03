import { useCallback, useEffect, useState, useRef } from "react";
import NotificationService from "../api/NotificationService";
import { WebSocketClient } from "./websocket";

export default function useNotification({ role = "admin" } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const isInitialized = useRef(false);

  const loadNotifications = useCallback(
    async ({ reset = false } = {}) => {
      setLoading(true);
      try {
        const data = await NotificationService.getNotifications({
          cursor: reset ? null : cursor,
        });

        const items = data.items.map((n) => ({
          ...n,
          id: n._id,
        }));

        setNotifications((prev) => (reset ? items : [...prev, ...items]));
        setCursor(data.next_cursor || null);

        const unread = items.filter((n) => !n.is_read).length;
        setUnreadCount((prev) => (reset ? unread : prev + unread));
      } catch (err) {
        console.error("Load notifications error:", err);
      } finally {
        setLoading(false);
      }
    },
    [cursor]
  );

  const markAsRead = useCallback(async (notifId) => {
    try {
      await NotificationService.markAsRead(notifId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Mark as read failed:", err);
    }
  }, []);

  // WebSocket connection and subscription (once only)
  useEffect(() => {
    if (isInitialized.current) return;

    isInitialized.current = true;
    WebSocketClient.connect();

    const unsubscribe = WebSocketClient.subscribe("notification", (message) => {
      if (!message?.payload) return;

      const notif = {
        ...message.payload,
        id: message.payload._id,
      };

      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load initial notifications (once only)
  useEffect(() => {
    loadNotifications({ reset: true });
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore: !!cursor,
    loadNotifications,
    markAsRead,
  };
}
