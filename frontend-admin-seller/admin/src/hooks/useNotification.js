import { useCallback, useEffect, useState } from "react";
import NotificationService from "../api/NotificationService";
import { WebSocketClient } from "./websocket";

const normalizeNotification = (n) => ({
  ...n,
  id: n._id,
});

export default function useNotification() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(
    async ({ reset = false } = {}) => {
      setLoading(true);
      try {
        const { items, next_cursor } =
          await NotificationService.getNotifications({
            cursor: reset ? null : cursor,
          });

        const normalized = items.map(normalizeNotification);
        const unread = normalized.filter((n) => !n.is_read).length;

        setNotifications((prev) =>
          reset ? normalized : [...prev, ...normalized]
        );
        setCursor(next_cursor || null);
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

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read failed:", err);
    }
  }, []);

  // WebSocket real-time notifications
  useEffect(() => {
    WebSocketClient.connect();

    const unsubscribe = WebSocketClient.subscribe("notification", (message) => {
      if (message?.type?.toUpperCase() !== "NOTIFICATION") return;

      const notif = {
        _id: message.id,
        id: message.id,
        title: message.title,
        message: message.message,
        data: message.data,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  // Load initial notifications
  useEffect(() => {
    loadNotifications({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore: !!cursor,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}
