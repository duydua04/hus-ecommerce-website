import React from "react";
import { useLocation } from "react-router-dom";
import SidebarMenuItem from "./SidebarMenuItem";
import "./SidebarMenu.scss";

const SidebarMenu = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      id: "dashboard",
      icon: "bx bx-bar-chart",
      text: "Dashboard",
      href: "/dashboard",
    },
    {
      id: "category",
      icon: "bx bx-category",
      text: "Danh mục",
      href: "/category",
    },
    {
      id: "user",
      icon: "bx bx-user",
      text: "Người dùng",
      isDropdown: true,
      submenu: [
        { id: "buyer", text: "Người mua", href: "/buyer" },
        { id: "seller", text: "Người bán", href: "/seller" },
      ],
    },
    {
      id: "discount",
      icon: "bx bx-purchase-tag-alt",
      text: "Giảm giá",
      href: "/discount",
    },
    {
      id: "transport",
      icon: "bx bx-car",
      text: "Vận chuyển",
      href: "/transport",
    },
  ];

  return (
    <ul className="sidebar__menu">
      {menuItems.map((item) => {
        const isActive = item.href
          ? currentPath === item.href
          : item.submenu?.some((s) => s.href === currentPath);

        return (
          <SidebarMenuItem
            key={item.id}
            icon={item.icon}
            text={item.text}
            href={item.href}
            isDropdown={item.isDropdown}
            isActive={isActive}
          >
            {item.submenu &&
              item.submenu.map((subitem) => (
                <li key={subitem.id} className="sidebar__submenu-item">
                  <SidebarMenuItem
                    text={subitem.text}
                    href={subitem.href}
                    isActive={currentPath === subitem.href}
                  />
                </li>
              ))}
          </SidebarMenuItem>
        );
      })}
    </ul>
  );
};

export default SidebarMenu;
