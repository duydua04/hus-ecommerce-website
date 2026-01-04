// src/components/NotificationSidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/useNotifications';
import './sidebar.css';

export default function NotificationSidebar({ user }) {
  const { unreadCount } = useNotifications();
  const location = useLocation();

  // Tự động xác định active section dựa trên URL
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/notifications') return 'notifications';
    if (path === '/profile') return 'profile';
    if (path === '/addresses') return 'address';
    if (path === '/tracking') return 'tracking';
    return 'profile';
  };

  const activeSection = getActiveSection();

  const getUserDisplayName = () => {
    if (user?.lname || user?.fname) {
      return `${user.lname || ''} ${user.fname || ''}`.trim();
    }
    return user?.email || 'Người dùng';
  };

  // Lấy avatar URL
  const getUserAvatar = () => {
    const avatarUrl = user?.avt_url;

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="avatar"
          onError={(e) => {
            console.error('Sidebar avatar load error');
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = '<div class="avatar-fallback">👤</div>';
          }}
        />
      );
    }

    return <div className="avatar-fallback">👤</div>;
  };

  return (
    <aside className="sidebar">
      <div className="user-info">
        <div className="user-avatar">
          {getUserAvatar()}
        </div>
        <div>
          <div className="user-name">{getUserDisplayName()}</div>
          <Link to="/profile" className="user-edit">
            ✏️ Sửa Hồ Sơ
          </Link>
        </div>
      </div>

      <ul className="sidebar-menu">
        <li className="sidebar-menu__item">
          <Link
            to="/notifications"
            className={`sidebar-menu__link ${location.pathname === '/notifications' ? 'sidebar-menu__link--active' : ''}`}
          >
            <span>🔔</span>
            <span>Thông Báo</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>
        </li>

        <li className="sidebar-menu__item">
          <Link
            to="/profile"
            className={`sidebar-menu__link ${activeSection === 'profile' ? 'sidebar-menu__link--active' : ''}`}
          >
            <span>👤</span>
            <span>Tài Khoản Của Tôi</span>
          </Link>
        </li>

        <li className="sidebar-menu__item">
          <Link
            to="/addresses"
            className={`sidebar-menu__link ${activeSection === 'address' ? 'sidebar-menu__link--active' : ''}`}
          >
            <span>🏠</span>
            <span>Địa Chỉ Của Tôi</span>
          </Link>
        </li>

        <li className="sidebar-menu__item">
          <Link
            to="/tracking"
            className={`sidebar-menu__link ${location.pathname === '/tracking' ? 'sidebar-menu__link--active' : ''}`}
          >
            <span>📄</span>
            <span>Đơn Mua</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
}