import React, { useState, useRef, useEffect } from "react";
import NotificationBadge from "./NotificationBadge";
import api from "../../../utils/axiosConfig";
import useNotification from "../../../hooks/useNotification";
import "./Navbar.scss";

const NavbarRight = ({ profileImage = "" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // bao cả notification + profile
  const wrapperRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotification();

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

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setShowNotifications(false);
    window.location.href = "/profile";
  };

  // Format thời gian thông báo
  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return "";

    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="navbar__right" ref={wrapperRef}>
      {/* Notification */}
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
            {notifications.length === 0 && (
              <div className="navbar__notification-empty">
                Không có thông báo
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                className={`navbar__notification-item ${
                  !n.is_read ? "unread" : ""
                }`}
                onClick={() => {
                  markAsRead(n.id);
                  setShowNotifications(false);
                }}
              >
                <div className="navbar__notification-content">
                  <div className="title">{n.title}</div>
                  <div className="notice-content">{n.message}</div>
                  <div className="notice-time">
                    {formatNotificationTime(n.created_at)}
                  </div>
                </div>

                {/*Tick đánh dấu đã đọc */}
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
          <svg
            className={`navbar__dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="navbar__dropdown">
            <button
              onClick={handleProfileClick}
              className="navbar__dropdown-item"
            >
              Profile
            </button>

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
