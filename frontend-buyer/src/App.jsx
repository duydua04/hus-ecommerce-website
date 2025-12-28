// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Components
import Header from './components/header.jsx';
import Footer from './components/footer.jsx';

// Import Pages
import BuyerLogin from './pages/Login/Buyerlogin.jsx';
import BuyerRegister from './pages/Login/Register/Register.jsx';
import ForgotPassword from './pages/Login/ForgotPassword/ForgotPassword.jsx';
import Home from './pages/Home/home.jsx';
import Detail from './pages/Detail/detail.jsx';
import Cart from './pages/Cart/cart.jsx';
import Payment from './pages/Payment/payment.jsx';
import OrderTracking from './pages/OrderTracking/order_tracking.jsx';
import Profile from './pages/Profile/profile.jsx';
import SearchResult from './pages/Search/search.jsx';

// Import CSS
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('userRole');
    return token && role === 'buyer';
  };

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirect to home if already logged in)
function PublicRoute({ children }) {
  const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('userRole');
    return token && role === 'buyer';
  };

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route - Login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <BuyerLogin />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <BuyerRegister />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        {/* Protected Routes - Require Authentication */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Header />
                <main className="main-content" style={{ marginTop: '100px', minHeight: '80vh' }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<SearchResult />} />
                    <Route path="/product/:id" element={<Detail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/tracking" element={<OrderTracking />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* 404 Page */}
                    <Route path="*" element={
                      <div style={{ textAlign: 'center', padding: '50px' }}>
                        404 - Không tìm thấy trang
                      </div>
                    } />
                  </Routes>
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;