import React, { useState, useRef, useEffect, useMemo } from "react";
import NotificationBadge from "./NotificationBadge";
import api from "../../../utils/axiosConfig";
import useNotification from "../../../hooks/useNotification";
import { formatChatTime } from "../../../utils/timeUtils";
import "./Navbar.scss";

const NavbarRight = ({ profileImage = "" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const wrapperRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotification();

  /* SORT: unread => mới nhất*/
  const sortedNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];

    return [...notifications].sort((a, b) => {
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [notifications]);

  /* CLICK OUTSIDE */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications((prev) => !prev);
    setIsDropdownOpen(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="navbar__right" ref={wrapperRef}>
      <NotificationBadge
        count={unreadCount}
        onClick={handleNotificationClick}
      />

      {showNotifications && (
        <div className="navbar__notification-dropdown">
          <div className="navbar__notification-header">
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>Đánh dấu đã đọc</button>
            )}
          </div>

          <div className="navbar__notification-list">
            {sortedNotifications.length === 0 && (
              <div className="navbar__notification-empty">
                Không có thông báo
              </div>
            )}

            {sortedNotifications.map((n) => (
              <div
                key={n.id}
                className={`navbar__notification-item ${
                  !n.is_read ? "unread" : ""
                }`}
                onClick={() => {
                  if (!n.is_read) markAsRead(n.id);
                  setShowNotifications(false);
                }}
              >
                <div className="navbar__notification-content">
                  <div className="title">{n.title}</div>
                  <div className="notice-content">{n.message}</div>
                  <div className="notice-time">
                    {formatChatTime(n.created_at)}
                  </div>
                </div>

                <div
                  className={`navbar__notification-check ${
                    !n.is_read ? "unread" : ""
                  }`}
                >
                  ✓
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile */}
      <div className="navbar__profile-wrapper">
        <button
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
            setShowNotifications(false);
          }}
          className="navbar__profile-btn"
        >
          <img
            src={profileImage || "../img/camera-canon-eos-r5.jpeg"}
            alt="Profile"
            className="navbar__profile-img"
          />
        </button>

        {isDropdownOpen && (
          <div className="navbar__dropdown">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="navbar__dropdown-item navbar__dropdown-item--logout"
            >
              {isLoggingOut ? "Đang đăng xuất..." : "Logout"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavbarRight;
