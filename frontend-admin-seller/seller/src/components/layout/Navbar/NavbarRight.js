import React, { useState, useRef, useEffect } from "react";
import NotificationBadge from "./NotificationBadge";
import api from "../../../utils/axiosConfig";
import useSellerNotification from "../../../hooks/useNotification";
import "./Navbar.scss";

const NavbarRight = ({ profileImage = "" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Bao cả notification + profile
  const wrapperRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useSellerNotification();

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
      window.location.href = "/seller/login";
    }
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setShowNotifications(false);
    window.location.href = "/seller/profile";
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

                {/* Tick đánh dấu đã đọc */}
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
            src={profileImage || "../img/default-seller-avatar.jpeg"}
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Hồ sơ</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="navbar__dropdown-item navbar__dropdown-item--logout"
            >
              {isLoggingOut ? (
                <>
                  <svg
                    className="navbar__logout-spinner"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="32"
                      strokeDashoffset="32"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        dur="1s"
                        repeatCount="indefinite"
                        from="32"
                        to="0"
                      />
                    </circle>
                  </svg>
                  <span>Đang đăng xuất...</span>
                </>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Đăng xuất</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavbarRight;
