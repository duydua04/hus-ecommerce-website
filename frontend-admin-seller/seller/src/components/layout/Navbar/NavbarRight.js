import React, { useState, useRef, useEffect } from "react";
import NotificationBadge from "./NotificationBadge";
import api from "../../../utils/axiosConfig"; // Import axios instance
import "./Navbar.scss";

const NavbarRight = ({ notificationCount = 55, profileImage = "" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setIsDropdownOpen(false);

    try {
      const response = await api.post("/auth/logout");

      console.log("Logout response:", response.status, response.data);

      if (response.status === 200) {
        // Xóa cookies phía client (nếu cần)
        document.cookie =
          "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // Chuyển hướng về trang login
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);

      // Nếu lỗi vẫn redirect về login (vì có thể cookie đã xóa)
      if (error.response) {
        console.error(
          "Error response:",
          error.response.status,
          error.response.data
        );
        alert(
          `Đăng xuất thất bại: ${
            error.response.data?.detail || "Unknown error"
          }`
        );
      } else {
        alert(`Có lỗi xảy ra: ${error.message}`);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    window.location.href = "/profile";
  };

  return (
    <div className="navbar__right">
      <NotificationBadge count={notificationCount} />

      <div className="navbar__profile-wrapper" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="navbar__profile-btn"
        >
          <img
            src={profileImage || "../img/camera-canon-eos-r5.jpeg"}
            alt="Profile"
            className="navbar__profile-img"
          />
          <svg
            className={`navbar__dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="navbar__dropdown">
            <button
              onClick={handleProfileClick}
              className="navbar__dropdown-item"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Hồ sơ</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="navbar__dropdown-item navbar__dropdown-item--logout"
            >
              {isLoggingOut ? (
                <>
                  <svg
                    className="navbar__logout-spinner"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="32"
                      strokeDashoffset="32"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        dur="1s"
                        repeatCount="indefinite"
                        from="32"
                        to="0"
                      />
                    </circle>
                  </svg>
                  <span>Đang đăng xuất...</span>
                </>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Đăng xuất</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavbarRight;
