import React from "react";
import "./SidebarBrand.scss";

const SidebarBrand = () => {
  return (
    <a href="#" className="sidebar__brand">
      <i className="bx bx-store sidebar__brand-icon"></i>
      <span className="sidebar__brand-text">SellerHub</span>
    </a>
  );
};

export default SidebarBrand;
