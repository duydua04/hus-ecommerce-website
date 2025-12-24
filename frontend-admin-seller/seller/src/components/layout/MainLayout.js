import React, { useState } from "react";
import Sidebar from "./Sidebar/Sidebar";
import Navbar from "./Navbar/Navbar";
import "./MainLayout.scss";

const MainLayout = ({
  currentPage = "discount",
  children,
  notificationCount = 0,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // true = mở

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} currentPage={currentPage} />

      <section
        className={`content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        <Navbar
          onMenuClick={handleMenuClick}
          notificationCount={notificationCount}
        />
        {children}
      </section>
    </div>
  );
};

export default MainLayout;
