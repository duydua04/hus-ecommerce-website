import React from "react";

const NotificationBadge = ({ count = 0 }) => {
  return (
    <a href="#" className="navbar__notification">
      <i className="bx bx-bell navbar__notification-icon"></i>
      {count > 0 && <span className="navbar__notification-badge">{count}</span>}
    </a>
  );
};

export default NotificationBadge;
