// src/App.jsx
import React, { createContext, useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Components
import Header from './components/header.jsx';
import Footer from './components/footer.jsx';
import NotFound from './components/NotFound/notFound.jsx';
import Chat from './components/Chat/chat.jsx';

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

// Tạo ChatContext
export const ChatContext = createContext(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [chatState, setChatState] = useState({
    isOpen: false,
    defaultPartner: null
  });

  const openChatWithPartner = (partner) => {
    setChatState({ isOpen: true, defaultPartner: partner });
  };

  const closeChat = () => {
    setChatState({ isOpen: false, defaultPartner: null });
  };

  return (
    <ChatContext.Provider value={{ chatState, openChatWithPartner, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
};

// ==========================================
// [FIXED] Protected Route Component
// ==========================================
function ProtectedRoute({ children }) {
  const isAuthenticated = () => {
    // ✅ CHỈ KIỂM TRA ROLE (Vì token đã nằm trong Cookie ẩn)
    const role = localStorage.getItem('userRole');
    return role === 'buyer';
  };

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ==========================================
// [FIXED] Public Route Component
// ==========================================
function PublicRoute({ children }) {
  const isAuthenticated = () => {
    // ✅ CHỈ KIỂM TRA ROLE
    const role = localStorage.getItem('userRole');
    return role === 'buyer';
  };

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content" style={{ marginTop: '100px', minHeight: '80vh' }}>
        {children}
      </main>
      <Chat />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ChatProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><BuyerLogin /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><BuyerRegister /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><MainLayout><Home /></MainLayout></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><MainLayout><SearchResult /></MainLayout></ProtectedRoute>} />
          <Route path="/product/:productId" element={<ProtectedRoute><MainLayout><Detail /></MainLayout></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><MainLayout><Cart /></MainLayout></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><MainLayout><Payment /></MainLayout></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><MainLayout><OrderTracking /></MainLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><MainLayout><Notifications /></MainLayout></ProtectedRoute>} />
          <Route path="/addresses" element={<ProtectedRoute><MainLayout><Addresses /></MainLayout></ProtectedRoute>} />
        </Routes>
      </ChatProvider>
    </Router>
  );
}

export default App;