import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./SidebarMenuItem.scss";

const SidebarMenuItem = ({
  icon,
  text,
  href,
  isActive = false,
  isDropdown = false,
  isSubmenu = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Tự mở dropdown khi route con active
  useEffect(() => {
    if (isDropdown && isActive) {
      setIsOpen(true);
    }
  }, [isDropdown, isActive]);

  const handleToggle = (e) => {
    if (!isDropdown) return;
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  return (
    <li
      className={[
        "sidebar__menu-item",
        isActive && "sidebar__menu-item--active",
        isSubmenu && "sidebar__menu-item--sub",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isDropdown ? (
        <a
          href="#"
          className="sidebar__menu-link sidebar__menu-link--dropdown"
          onClick={handleToggle}
        >
          {icon && <i className={`${icon} sidebar__menu-icon`} />}
          <span className="sidebar__menu-text">{text}</span>
          <i
            className={`bx bx-chevron-down sidebar__menu-arrow ${
              isOpen ? "sidebar__menu-arrow--open" : ""
            }`}
          />
        </a>
      ) : (
        <Link to={href} className="sidebar__menu-link">
          {icon && <i className={`${icon} sidebar__menu-icon`} />}
          <span className="sidebar__menu-text">{text}</span>
        </Link>
      )}

      {isDropdown && (
        <ul
          className={["sidebar__submenu", isOpen && "sidebar__submenu--open"]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </ul>
      )}
    </li>
  );
};

export default SidebarMenuItem;
