import React, { useEffect, useState } from "react";
import NavbarLeft from "./NavbarLeft";
import NavbarRight from "./NavbarRight";
import axios from "../../../utils/axiosConfig";
import "./Navbar.scss";
import profilePic from "../../../assets/images/camera-canon-eos-r5.jpeg";

const Navbar = ({ notificationCount = 0, onMenuClick }) => {
  const [profileImage, setProfileImage] = useState(profilePic);

  useEffect(() => {
    axios
      .get("/auth/me?role=admin")
      .then(({ data }) => {
        if (data.avt_url) setProfileImage(data.avt_url);
      })
      .catch((err) => console.error("Failed to fetch user:", err));
  }, []);

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
