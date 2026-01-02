import React, { useEffect, useState } from "react";
import {Link} from 'react-router-dom';
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

  /* ================= FETCH NOTIFICATIONS ================= */
  const loadNotifications = async (reset = false) => {
    try {
      setLoading(true);

      const res = await api.notification.getAll({
        limit: 20,
        cursor,
        unread_only: unreadOnly,
      });

      const { items, next_cursor, has_more } = res;

      setNotifications(prev =>
        reset ? items : [...prev, ...items]
      );
      setCursor(next_cursor);
      setHasMore(has_more);

    } catch (err) {
      console.error("Load notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(true);
  }, [unreadOnly]);

  /* ================= HANDLERS ================= */
  const handleMarkRead = async (notifId) => {
    try {
      await api.notification.markAsRead(notifId);

      setNotifications(prev =>
        prev.map(n =>
          n._id === notifId ? { ...n, is_read: true } : n
        )
      );

    setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="main-container">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="user-info">
          <div className="user-avatar">
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
          </div>
          <div>
            <div className="user-name">
              {user?.fullname || user?.fname || user?.email || "Người dùng"}
            </div>
            <a
              href="#"
              className="user-edit"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("profile");
              }}
            >
              ✏️ Sửa Hồ Sơ
            </a>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-menu__item">
            <Link to="/notifications" className="sidebar-menu__link">
              <span>🔔</span>
              <span>Thông Báo</span>
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
        <h2 className="section-title">Thông Báo</h2>
        <p className="section-subtitle">
          Quản lý và theo dõi các thông báo của bạn
        </p>

        {/* FILTER */}
        <div className="notification-filter">
          <label>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Chỉ hiển thị chưa đọc
          </label>
        </div>

        {/* LIST */}
        {loading && notifications.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40 }}>
            Đang tải thông báo...
          </p>
        ) : notifications.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, color: "#888" }}>
            Không có thông báo nào
          </p>
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

                <span className="notification-time">
                  {new Date(n.created_at).toLocaleString("vi-VN")}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* LOAD MORE */}
        {hasMore && !loading && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              className="avatar-button"
              onClick={() => loadNotifications()}
            >
              Tải thêm
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
