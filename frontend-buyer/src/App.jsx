// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Components
import Header from './components/header.jsx';
import Footer from './components/footer.jsx';
import NotFound from './components/NotFound/notFound.jsx';

// Import Pages
import BuyerLogin from './pages/Login/BuyerLogin.jsx';
import BuyerRegister from './pages/Login/Register/Register.jsx';
import ForgotPassword from './pages/Login/ForgotPassword/ForgotPassword.jsx';
import Home from './pages/Home/home.jsx';
import Notifications from './pages/Notifications/notifications.jsx';
import Detail from './pages/Detail/detail.jsx';
import Cart from './pages/Cart/cart.jsx';
import Payment from './pages/Payment/payment.jsx';
import OrderTracking from './pages/OrderTracking/order_tracking.jsx';
import Profile from './pages/Profile/profile.jsx';
import SearchResult from './pages/Search/search.jsx';
import Addresses from './pages/Addresses/addresses.jsx';

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

// Layout cho các trang có Header/Footer
function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content" style={{ marginTop: '100px', minHeight: '80vh' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route - Login (không có Header/Footer) */}
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

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />

        {/* Protected Routes với Header/Footer*/}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Home />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SearchResult />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Detail />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Cart />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Payment />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking"
          element={
            <ProtectedRoute>
              <MainLayout>
                <OrderTracking />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Notifications />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/addresses"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Addresses />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;