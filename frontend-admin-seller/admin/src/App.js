import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import CategoryPage from "./pages/Category/CategoryPage";
import BuyerPage from "./pages/User/BuyerPage";
import SellerPage from "./pages/User/SellerPage";
import DiscountPage from "./pages/Discount/DiscountPage";
import TransportPage from "./pages/Transport/TransportPage";
import LoginPage from "./pages/Login/LoginPage";

import ProtectedRoute from "./components/ProtectedRoute";

import "./assets/styles/global.scss";
import "boxicons/css/boxicons.min.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC ROUTE ===== */}
        <Route path="/login" element={<LoginPage />} />

        {/* ===== PROTECTED ROUTES - CHỈ ADMIN ===== */}

        {/* Dashboard - Trang chủ */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý danh mục */}
        <Route
          path="/category"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CategoryPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý người mua */}
        <Route
          path="/buyer"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <BuyerPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý người bán */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SellerPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý khuyến mãi */}
        <Route
          path="/discount"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DiscountPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý vận chuyển */}
        <Route
          path="/transport"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TransportPage />
            </ProtectedRoute>
          }
        />

        {/* Root path "/" redirect về dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/*404 NOT FOUND*/}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

// Component 404
function NotFoundPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "6rem", margin: 0 }}>404</h1>
      <h2 style={{ fontSize: "2rem", margin: "1rem 0" }}>
        Trang không tồn tại
      </h2>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
        URL bạn truy cập không tồn tại trong hệ thống
      </p>
      <button
        onClick={() => (window.location.href = "/")}
        style={{
          background: "white",
          color: "#667eea",
          border: "none",
          padding: "1rem 2rem",
          borderRadius: "25px",
          fontSize: "1rem",
          fontWeight: "600",
          cursor: "pointer",
          transition: "transform 0.2s",
        }}
        onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
        onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
      >
        <i className="bx bx-home"></i> Về trang chủ
      </button>
    </div>
  );
}

export default App;
