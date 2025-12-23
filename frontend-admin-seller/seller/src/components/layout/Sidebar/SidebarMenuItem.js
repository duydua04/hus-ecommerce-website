import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./SidebarMenuItem.scss";

const SidebarMenuItem = ({
  icon,
  text,
  href,
  isActive,
  isDropdown,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mở dropdown nếu active
  useEffect(() => {
    if (isActive && isDropdown) setIsOpen(true);
  }, [isActive, isDropdown]);

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <li
      className={`sidebar__menu-item ${
        isActive ? "sidebar__menu-item--active" : ""
      }`}
    >
      {isDropdown ? (
        <a
          href="#"
          className="sidebar__menu-link sidebar__menu-link--dropdown"
          onClick={toggleDropdown}
        >
          {icon && <i className={`${icon} sidebar__menu-icon`}></i>}
          <span className="sidebar__menu-text">{text}</span>
          <i className="bx bx-chevron-down sidebar__menu-arrow"></i>
        </a>
      ) : (
        <Link to={href} className="sidebar__menu-link">
          {icon && <i className={`${icon} sidebar__menu-icon`}></i>}
          <span className="sidebar__menu-text">{text}</span>
        </Link>
      )}

      {isDropdown && children && (
        <ul
          className={`sidebar__submenu ${
            isOpen ? "sidebar__submenu--open" : ""
          }`}
        >
          {children}
        </ul>
      )}
    </li>
  );
};

export default SidebarMenuItem;
