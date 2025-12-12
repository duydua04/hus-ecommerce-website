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
      icon: "bx bx-grid-alt",
      text: "Dashboard",
      href: "/dashboard",
    },
    {
      id: "products",
      icon: "bx bx-box",
      text: "Sản phẩm",
      href: "/products",
    },
    {
      id: "orders",
      icon: "bx bx-shopping-bag",
      text: "Đơn hàng",
      href: "/orders",
    },
    {
      id: "locations",
      icon: "bx bx-map",
      text: "Địa chỉ",
      href: "/locations",
    },
    {
      id: "profile",
      icon: "bx bx-user-circle",
      text: "Hồ sơ",
      href: "/profile",
    },
    {
      id: "reviews",
      icon: "bx bx-star",
      text: "Đánh giá",
      href: "/reviews",
    },
  ];

  return (
    <ul className="sidebar__menu">
      {menuItems.map((item) => {
        const isActive = currentPath === item.href;

        return (
          <SidebarMenuItem
            key={item.id}
            icon={item.icon}
            text={item.text}
            href={item.href}
            isActive={isActive}
          />
        );
      })}
    </ul>
  );
};

export default SidebarMenu;
