import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import CategoryPage from "./pages/Category/CategoryPage";
import BuyerPage from "./pages/User/BuyerPage";
import SellerPage from "./pages/User/SellerPage";
import DiscountPage from "./pages/Discount/DiscountPage";
import TransportPage from "./pages/Transport/TransportPage";
import LoginPage from "./pages/Login/LoginPage";

import PrivateRoute from "./components/PrivateRoute";

import "./assets/styles/global.scss";
import "boxicons/css/boxicons.min.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/category"
          element={
            <PrivateRoute>
              <CategoryPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/buyer"
          element={
            <PrivateRoute>
              <BuyerPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/seller"
          element={
            <PrivateRoute>
              <SellerPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/discount"
          element={
            <PrivateRoute>
              <DiscountPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/transport"
          element={
            <PrivateRoute>
              <TransportPage />
            </PrivateRoute>
          }
        />

        {/* Default */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
