import React from "react";

const NotificationBadge = ({ count = 0, onClick }) => {
  return (
    <button type="button" className="navbar__notification" onClick={onClick}>
      <i className="bx bx-bell navbar__notification-icon"></i>
      {count > 0 && <span className="navbar__notification-badge">{count}</span>}
    </button>
  );
};

export default NotificationBadge;
