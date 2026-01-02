import { useCallback, useEffect, useState } from "react";
import NotificationService from "../api/NotificationService";
import { WebSocketClient } from "./websocket";

export default function useNotification({ role = "admin" } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  /* LOAD HISTORY */
  const loadNotifications = useCallback(
    async ({ reset = false } = {}) => {
      setLoading(true);
      try {
        const data = await NotificationService.getNotifications({
          cursor: reset ? null : cursor,
        });

        const items = data.items.map((n) => ({
          ...n,
          id: n._id, // map _id → id
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

  /* MARK ONE AS READ */
  const markAsRead = useCallback(async (notifId) => {
    try {
      await NotificationService.markAsRead(notifId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  }, []);

  /* MARK ALL AS READ */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  /* WEBSOCKET REALTIME */
  useEffect(() => {
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
  }, [role]);

  /* INIT LOAD */
  useEffect(() => {
    loadNotifications({ reset: true });
  }, [loadNotifications]);

  /* PUBLIC API */
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
