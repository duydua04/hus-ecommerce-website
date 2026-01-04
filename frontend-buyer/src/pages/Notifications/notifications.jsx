import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import api from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/useNotifications";
import NotificationSidebar from "../../components/notificationSidebar";
import "../Profile/profile.css";
import "./notifications.css";
import useTime from "../../context/useTime";

export default function Notifications() {
  const { user } = useUser();
  const { unreadCount, incrementUnread, decrementUnread, resetUnread } = useNotifications();

  const {
    formatRelativeTime,
    formatVietnameseDateTime,
    sortByNewest,
    getTimeInfo
  } = useTime();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  /* ================= FETCH NOTIFICATIONS ================= */
  const loadNotifications = async (reset = false) => {
    try {
      setLoading(true);

      const res = await api.notification.getAll({
        limit: 20,
        cursor: reset ? null : cursor,
        unread_only: false, // Luôn load tất cả
      });

      const { items, next_cursor, has_more } = res;

      // Thêm thông tin thời gian đã chuyển đổi cho mỗi notification
      const itemsWithTimeInfo = items.map(item => ({
        ...item,
        ...getTimeInfo(item.created_at)
      }));

      // Sắp xếp theo thời gian mới nhất lên đầu
      const sortedItems = sortByNewest(itemsWithTimeInfo);

      setNotifications(prev =>
        reset ? sortedItems : [...prev, ...sortedItems]
      );
      setCursor(next_cursor);
      setHasMore(has_more);

    } catch (err) {
      console.error("Load notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load lần đầu
  useEffect(() => {
    loadNotifications(true);
  }, []);

  /* ================= WEBSOCKET REALTIME ================= */
  useEffect(() => {
    // Lắng nghe thông báo mới qua WebSocket
    const unsubscribe = api.websocket.onMessage('NOTIFICATION', (payload) => {
      console.log('📨 New notification received:', payload);

      const timeInfo = getTimeInfo(new Date().toISOString());

      const newNotif = {
        _id: payload.id,
        title: payload.title,
        message: payload.message,
        event_type: payload.data?.event_type || 'general',
        is_read: false,
        created_at: new Date().toISOString(),
        ...timeInfo,
        ...payload.data
      };

      setNotifications(prev => [newNotif, ...prev]);
      incrementUnread();

      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.message,
          icon: '/notification-icon.png'
        });
      }
    });

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  /* ================= HANDLERS ================= */
  const handleMarkRead = async (notifId) => {
    try {
      await api.notification.markAsRead(notifId);

      setNotifications(prev =>
        prev.map(n =>
          n._id === notifId ? { ...n, is_read: true } : n
        )
      );

      decrementUnread();

    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAllRead(true);
      await api.notification.markAllAsRead();

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      resetUnread();

    } catch (err) {
      console.error("Mark all read error:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  /* ================= GROUP BY TIME ================= */
  const groupNotificationsByTime = () => {
    const now = new Date();
    const groups = {
      new: [],
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    // Sắp xếp: chưa đọc trước, đã đọc sau, trong mỗi nhóm sắp xếp theo thời gian mới nhất
    const sortedNotifications = [...notifications].sort((a, b) => {
      // Ưu tiên chưa đọc
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1;
      }
      // Cùng trạng thái đọc thì sắp xếp theo thời gian mới nhất
      return new Date(b.created_at) - new Date(a.created_at);
    });

    sortedNotifications.forEach(n => {
      const notifDate = new Date(n.created_at);
      const diffHours = (now - notifDate) / (1000 * 60 * 60);
      const diffDays = (now - notifDate) / (1000 * 60 * 60 * 24);

      if (diffHours < 2) {
        groups.new.push(n);
      } else if (diffDays < 1) {
        groups.today.push(n);
      } else if (diffDays < 2) {
        groups.yesterday.push(n);
      } else if (diffDays < 7) {
        groups.thisWeek.push(n);
      } else {
        groups.older.push(n);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByTime();

  const getGroupLabel = (groupKey) => {
    const labels = {
      new: 'Đơn hàng mới',
      today: 'Hôm nay',
      yesterday: '1 ngày trước',
      thisWeek: 'Tuần này',
      older: 'Cũ hơn'
    };
    return labels[groupKey];
  };

  /* ================= INFINITE SCROLL ================= */
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadNotifications(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, cursor]);

  /* ================= UI ================= */
  return (
    <div className="main-container">
      {/* ================= SIDEBAR ================= */}
      <NotificationSidebar user={user} />

      {/* ============ CONTENT ============ */}
      <main className="content">
        <div className="notification-header-section">
          <h2>Thông báo</h2>

          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? "Đang xử lý..." : "Đánh dấu đã đọc"}
            </button>
          )}
        </div>

        {/* LIST WITH TIME GROUPS */}
        {loading && notifications.length === 0 ? (
          <div className="notification-loading">
            <div className="spinner"></div>
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <span className="empty-icon">🔔</span>
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedNotifications).map(([groupKey, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={groupKey} className="time-group">
                  <h3 className="time-group-header">{getGroupLabel(groupKey)}</h3>

                  <ul className="notification-list">
                    {items.map((n) => (
                      <li
                        key={n._id}
                        className={`notification-item ${n.is_read ? "" : "unread"}`}
                        onClick={() => !n.is_read && handleMarkRead(n._id)}
                      >
                        <div className="notification-content">
                          <span className="notification-title">{n.title}</span>
                          <p className="notification-message">{n.message}</p>
                          <span className="notification-time">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>

                        <div className={`notification-icon ${n.is_read ? 'read-check' : 'unread-dot'}`}>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </>
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