import React from "react";
import { useLocation } from "react-router-dom";
import SidebarMenuItem from "./SidebarMenuItem";
import "./SidebarMenu.scss";

const SidebarMenu = () => {
  const { pathname } = useLocation();

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
        const isParentActive = item.isDropdown
          ? item.submenu?.some((s) => s.href === pathname)
          : pathname === item.href;

        return (
          <SidebarMenuItem
            key={item.id}
            icon={item.icon}
            text={item.text}
            href={item.href}
            isDropdown={item.isDropdown}
            isActive={isParentActive}
          >
            {item.submenu?.map((sub) => (
              <SidebarMenuItem
                key={sub.id}
                text={sub.text}
                href={sub.href}
                isActive={pathname === sub.href}
                isSubmenu
              />
            ))}
          </SidebarMenuItem>
        );
      })}
    </ul>
  );
};

export default SidebarMenu;
