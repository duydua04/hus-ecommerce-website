import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProductPage from "./pages/Product/ProductPage";
import OrderPage from "./pages/Order/OrderPage";
import LocationPage from "./pages/Location/LocationPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import ReviewPage from "./pages/Review/ReviewPage";

import "./assets/styles/global.scss";
import "boxicons/css/boxicons.min.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/products" replace />} />

        {/* Main routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/locations" element={<LocationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reviews" element={<ReviewPage />} />

        {/* 404 - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
