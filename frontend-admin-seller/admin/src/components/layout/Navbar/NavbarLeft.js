import React from "react";
import SearchBox from "../../common/SearchBox/SearchBox";

const NavbarLeft = ({ onMenuClick }) => {
  return (
    <div className="navbar__left">
      <i
        className="bx bx-menu navbar__menu-icon"
        onClick={onMenuClick}
        style={{ cursor: "pointer" }}
      ></i>
      <SearchBox placeholder="Tìm kiếm..." />
    </div>
  );
};

export default NavbarLeft;
