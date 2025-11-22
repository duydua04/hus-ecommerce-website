import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import CategoryPage from "./pages/Category/CategoryPage";
import BuyerPage from "./pages/User/BuyerPage";
import SellerPage from "./pages/User/SellerPage";
import DiscountPage from "./pages/Discount/DiscountPage";
import TransportPage from "./pages/Transport/TransportPage";
import "./assets/styles/global.scss";
import "boxicons/css/boxicons.min.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TransportPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/buyer" element={<BuyerPage />} />
        <Route path="/seller" element={<SellerPage />} />
        <Route path="/discount" element={<DiscountPage />} />
        <Route path="/transport" element={<TransportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
