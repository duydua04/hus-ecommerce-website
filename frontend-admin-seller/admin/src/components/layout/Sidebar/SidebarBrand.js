import React from "react";
import "./SidebarBrand.scss";

const SidebarBrand = () => {
  return (
    <a href="#" className="sidebar__brand">
      <i className="bx bx-cube-alt sidebar__brand-icon"></i>
      <span className="sidebar__brand-text">AdminHub</span>
    </a>
  );
};

export default SidebarBrand;
