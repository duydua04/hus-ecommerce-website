import React from "react";
import SidebarBrand from "./SidebarBrand";
import SidebarMenu from "./SidebarMenu";
import "./Sidebar.scss";

const Sidebar = ({ currentPage = "discount", isOpen = true }) => {
  return (
    <section className={`sidebar ${isOpen ? "" : "sidebar--collapsed"}`}>
      <SidebarBrand isOpen={isOpen} />
      <SidebarMenu currentPage={currentPage} isOpen={isOpen} />
    </section>
  );
};

export default Sidebar;
