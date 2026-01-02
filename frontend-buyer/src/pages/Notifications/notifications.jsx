import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import api from "../../services/api";
import { useUser } from "../../context/UserContext";
import "../Profile/profile.css";
import "./notifications.css";

export default function Notifications() {
  const { user } = useUser();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  /* ================= FETCH NOTIFICATIONS ================= */
  const loadNotifications = async (reset = false) => {
    try {
      setLoading(true);

      const res = await api.notification.getAll({
        limit: 20,
        cursor: reset ? null : cursor, // Reset cursor khi filter thay đổi
        unread_only: unreadOnly,
      });

      const { items, next_cursor, has_more } = res;

      setNotifications(prev =>
        reset ? items : [...prev, ...items]
      );
      setCursor(next_cursor);
      setHasMore(has_more);

      // Đếm số thông báo chưa đọc
      if (reset) {
        const unreadItems = items.filter(n => !n.is_read);
        setUnreadCount(unreadItems.length);
      }

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

      // Giảm số lượng chưa đọc
      setUnreadCount(prev => Math.max(prev - 1, 0));

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

      setUnreadCount(0);

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
      <aside className="sidebar">
        <div className="user-info">
          <div className="user-avatar">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div className="avatar-fallback">👤</div>
            )}
          </div>
          <div>
            <div className="user-name">
              {user?.fullname || user?.fname || user?.email || "Người dùng"}
            </div>
            <Link to="/profile" className="user-edit">
              ✏️ Sửa Hồ Sơ
            </Link>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-menu__item">
            <Link to="/notifications" className="sidebar-menu__link sidebar-menu__link--active">
              <span>🔔</span>
              <span>Thông Báo</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </Link>
          </li>

          <li className="sidebar-menu__item">
            <Link to="/profile" className="sidebar-menu__link">
              <span>👤</span>
              <span>Tài Khoản Của Tôi</span>
            </Link>
          </li>

          <li className="sidebar-menu__item">
            <Link to="/tracking" className="sidebar-menu__link">
              <span>📄</span>
              <span>Đơn Mua</span>
            </Link>
          </li>
        </ul>
      </aside>

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