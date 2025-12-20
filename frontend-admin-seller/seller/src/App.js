import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Auth Pages
import SellerLogin from "./pages/Login/SellerLogin";
import SellerRegister from "./pages/Login/Register/Register";
import SellerForgotPassword from "./pages/Login/ForgotPassword/ForgotPassword";

// Main Pages
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProductPage from "./pages/Product/ProductPage";
import OrderPage from "./pages/Order/OrderPage";
import LocationPage from "./pages/Location/LocationPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import ReviewPage from "./pages/Review/ReviewPage";

// Protected Route Component
import ProtectedRoute from "./components/ProtectedRoute";

// Global Styles
import "./assets/styles/global.scss";
import "./assets/styles/react-select.scss";
import "boxicons/css/boxicons.min.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC ROUTES - Authentication ===== */}
        <Route path="/login" element={<SellerLogin />} />
        <Route path="/register" element={<SellerRegister />} />
        <Route path="/forgot-password" element={<SellerForgotPassword />} />

        {/* ===== PROTECTED ROUTES - CHỈ SELLER ===== */}

        {/* Dashboard - Tổng quan */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý sản phẩm */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <ProductPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý đơn hàng */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <OrderPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý địa điểm/kho hàng */}
        <Route
          path="/locations"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <LocationPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý đánh giá */}
        <Route
          path="/reviews"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <ReviewPage />
            </ProtectedRoute>
          }
        />

        {/* Hồ sơ cửa hàng */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Root path "/" redirect về login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 NOT FOUND - Phải đặt cuối cùng */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

// Component 404 - Not Found Page
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
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ fontSize: "8rem", marginBottom: "1rem" }}>🏪</div>
      <h1 style={{ fontSize: "6rem", margin: 0, fontWeight: "bold" }}>404</h1>
      <h2 style={{ fontSize: "2rem", margin: "1rem 0", fontWeight: "600" }}>
        Trang không tồn tại
      </h2>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.9 }}>
        URL bạn truy cập không tồn tại trong hệ thống
      </p>
      <button
        onClick={() => (window.location.href = "/login")}
        style={{
          background: "white",
          color: "#667eea",
          border: "none",
          padding: "1rem 2rem",
          borderRadius: "25px",
          fontSize: "1rem",
          fontWeight: "600",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        }}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.05)";
          e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
        }}
      >
        <i className="bx bx-store" style={{ marginRight: "8px" }}></i>
        Về trang đăng nhập
      </button>
    </div>
  );
}

export default App;
