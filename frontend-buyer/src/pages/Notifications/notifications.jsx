import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import api from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/useNotifications";
import NotificationSidebar from "../../components/notificationSidebar";
import "../Profile/profile.css";
import "./notifications.css";

export default function Notifications() {
  const { user } = useUser();
  const { unreadCount, incrementUnread, decrementUnread, resetUnread } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  /* ================= FETCH NOTIFICATIONS ================= */
  const loadNotifications = async (reset = false) => {
    try {
      setLoading(true);

      const res = await api.notification.getAll({
        limit: 20,
        cursor: reset ? null : cursor,
        unread_only: unreadOnly,
      });

      const { items, next_cursor, has_more } = res;

      setNotifications(prev =>
        reset ? items : [...prev, ...items]
      );
      setCursor(next_cursor);
      setHasMore(has_more);

      // Đếm sẽ được quản lý bởi useNotifications hook

    } catch (err) {
      console.error("Load notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load lại khi filter thay đổi
  useEffect(() => {
    loadNotifications(true);
  }, [unreadOnly]);

  /* ================= WEBSOCKET REALTIME ================= */
  useEffect(() => {
    // Lắng nghe thông báo mới qua WebSocket
    const unsubscribe = api.websocket.onMessage('NOTIFICATION', (payload) => {
      console.log('📨 New notification received:', payload);

      // Tạo notification object từ payload
      const newNotif = {
        _id: payload.id,
        title: payload.title,
        message: payload.message,
        event_type: payload.data?.event_type || 'general',
        is_read: false,
        created_at: new Date().toISOString(),
        ...payload.data
      };

      // Thêm vào đầu danh sách
      setNotifications(prev => [newNotif, ...prev]);

      // Count sẽ tự động tăng qua hook

      // Hiển thị toast hoặc notification browser (optional)
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.message,
          icon: '/notification-icon.png'
        });
      }
    });

    // Request permission cho browser notifications (optional)
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup khi unmount
    return () => {
      unsubscribe();
    };
  }, []);

  /* ================= HANDLERS ================= */
  const handleMarkRead = async (notifId) => {
    try {
      await api.notification.markAsRead(notifId);

      // Update state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notifId ? { ...n, is_read: true } : n
        )
      );

      // Giảm unread count qua hook
      decrementUnread();

    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAllRead(true);
      await api.notification.markAllAsRead();

      // Update tất cả thông báo thành đã đọc
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      // Reset unread count qua hook
      resetUnread();

    } catch (err) {
      console.error("Mark all read error:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="main-container">
      {/* ================= SIDEBAR ================= */}
      <NotificationSidebar user={user} />

      {/* ============ CONTENT ============ */}
      <main className="content">
        <div className="notification-header-section">
          <div>
            <h2 className="section-title">Thông Báo</h2>
            <p className="section-subtitle">
              Quản lý và theo dõi các thông báo của bạn
            </p>
          </div>

          {/* Nút đánh dấu tất cả đã đọc */}
          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
            </button>
          )}
        </div>

        {/* FILTER */}
        <div className="notification-filter">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            <span>Chỉ hiển thị chưa đọc ({unreadCount})</span>
          </label>
        </div>

        {/* LIST */}
        {loading && notifications.length === 0 ? (
          <div className="notification-loading">
            <div className="spinner"></div>
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <span className="empty-icon">🔔</span>
            <p>Không có thông báo nào</p>
            {unreadOnly && (
              <button
                className="show-all-btn"
                onClick={() => setUnreadOnly(false)}
              >
                Hiển thị tất cả thông báo
              </button>
            )}
          </div>
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`notification-item ${
                  n.is_read ? "" : "unread"
                }`}
                onClick={() => !n.is_read && handleMarkRead(n._id)}
              >
                <div className="notification-header">
                  <span className="notification-title">{n.title}</span>
                  {!n.is_read && <span className="dot"></span>}
                </div>

                <p className="notification-message">{n.message}</p>

                <div className="notification-footer">
                  <span className="notification-time">
                    {new Date(n.created_at).toLocaleString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>

                  {n.event_type && (
                    <span className="notification-type">
                      {n.event_type}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* LOAD MORE */}
        {hasMore && !loading && (
          <div className="load-more-section">
            <button
              className="load-more-btn"
              onClick={() => loadNotifications(false)}
            >
              Tải thêm
            </button>
          </div>
        )}

        {/* Loading indicator khi load more */}
        {loading && notifications.length > 0 && (
          <div className="loading-more">
            <div className="spinner-small"></div>
            <span>Đang tải...</span>
          </div>
        )}
      </main>
    </div>
  );
}