import React from "react";
import NavbarLeft from "./NavbarLeft";
import NavbarRight from "./NavbarRight";
import "./Navbar.scss";
import profilePic from "../../../assets/images/camera-canon-eos-r5.jpeg";

const Navbar = ({
  notificationCount = 55,
  profileImage = profilePic,
  onMenuClick,
}) => {
  return (
    <nav className="navbar">
      <NavbarLeft onMenuClick={onMenuClick} />
      <NavbarRight
        notificationCount={notificationCount}
        profileImage={profileImage}
      />
    </nav>
  );
};

export default Navbar;
