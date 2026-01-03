import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardPage from "./pages/Dashboard/DashboardPage";
import CategoryPage from "./pages/Category/CategoryPage";
import BuyerPage from "./pages/User/Buyer/BuyerPage";
import SellerPage from "./pages/User/Seller/SellerPage";
import DiscountPage from "./pages/Discount/DiscountPage";
import TransportPage from "./pages/Transport/TransportPage";
import LoginPage from "./pages/Login/LoginPage";

import ProtectedRoute from "./components/ProtectedRoute";
import { WebSocketClient } from "./hooks/websocket";

import "./assets/styles/global.scss";
import "boxicons/css/boxicons.min.css";

function App() {
  /* INIT WEBSOCKET */
  useEffect(() => {
    WebSocketClient.connect();

    return () => {
      WebSocketClient.disconnect();
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<LoginPage />} />

        {/* ROOT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ADMIN */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/category"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CategoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <BuyerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SellerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discount"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DiscountPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transport"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TransportPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

/* 404 PAGE */

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
