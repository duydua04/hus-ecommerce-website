import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "../utils/axiosConfig";

/**
 * Component bảo vệ route, yêu cầu đăng nhập
 * @param {React.Component} children - Component con cần bảo vệ
 * @param {string[]} allowedRoles - Danh sách role được phép truy cập (vd: ["admin", "seller"])
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = đang check, true/false = kết quả
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Gọi API /auth/me để kiểm tra token từ cookies
      const response = await axios.get("/auth/me");

      if (response.data?.role) {
        setUserRole(response.data.role);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      // Token hết hạn hoặc không hợp lệ
      setIsAuthenticated(false);
      localStorage.removeItem("userRole");
    }
  };

  // Đang kiểm tra authentication
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="spinner">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // Chưa đăng nhập -> redirect về login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng không đủ quyền
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h2>Truy cập bị từ chối</h2>
        <p>Bạn không có quyền truy cập trang này.</p>
        <p>
          Role hiện tại: <strong>{userRole}</strong>
        </p>
        <button onClick={() => (window.location.href = "/")}>
          Quay về trang chủ
        </button>
      </div>
    );
  }

  // Đã đăng nhập và đủ quyền -> hiển thị component
  return children;
}

export default ProtectedRoute;
