import React from "react";
import NotificationBadge from "./NotificationBadge";

const NavbarRight = ({ notificationCount = 55, profileImage = "" }) => {
  return (
    <div className="navbar__right">
      <NotificationBadge count={notificationCount} />
      <a href="#" className="navbar__profile">
        <img
          src={profileImage || "../img/camera-canon-eos-r5.jpeg"}
          alt="Profile"
          className="navbar__profile-img"
        />
      </a>
    </div>
  );
};

export default NavbarRight;
