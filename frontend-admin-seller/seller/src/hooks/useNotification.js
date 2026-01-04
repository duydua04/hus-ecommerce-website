import { useCallback, useEffect, useState } from "react";
import SellerNotificationService from "../api/NotificationService";
import { WebSocketClient } from "./websocket";

export default function useSellerNotification() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  /* LOAD HISTORY */
  const loadNotifications = useCallback(
    async ({ reset = false } = {}) => {
      setLoading(true);
      try {
        const data = await SellerNotificationService.getNotifications({
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
        console.error("Load seller notifications error:", err);
      } finally {
        setLoading(false);
      }
    },
    [cursor]
  );

  /* MARK ONE AS READ */
  const markAsRead = useCallback(async (notifId) => {
    try {
      await SellerNotificationService.markAsRead(notifId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  }, []);

  /* MARK ALL AS READ */
  const markAllAsRead = useCallback(async () => {
    try {
      await SellerNotificationService.markAllAsRead();

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  }, []);

  /* WEBSOCKET REALTIME - {type, id, title, message, data} */
  useEffect(() => {
    WebSocketClient.connect();

    const unsubscribe = WebSocketClient.subscribe("notification", (message) => {
      // message = {type: "NOTIFICATION", id, title, message, data}
      if (message?.type !== "NOTIFICATION") return;

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

    return () => {
      unsubscribe();
    };
  }, []);

  /* INIT LOAD */
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
    markAllAsRead,
  };
}
