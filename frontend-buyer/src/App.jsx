import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import các Component dùng chung
import Header from './components/header.jsx';
import Footer from './components/footer.jsx';

// Import các Trang
import Home from './pages/Home/home.jsx';
import Detail from './pages/Detail/detail.jsx';
import Cart from './pages/Cart/cart.jsx';
import Payment from './pages/Payment/payment.jsx';
import OrderTracking from './pages/OrderTracking/order_tracking.jsx';
import Profile from './pages/Profile/profile.jsx';
import SearchResult from './pages/Search/search.jsx';

// Import CSS dùng chung
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Header luôn hiển thị ở mọi trang */}
        <Header />

        {/* Nội dung thay đổi tùy theo đường dẫn URL */}
        <main className="main-content" style={{ marginTop: '100px', minHeight: '80vh' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResult />} />
            <Route path="/product/:id" element={<Detail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/tracking" element={<OrderTracking />} />
            <Route path="/profile" element={<Profile />} />

            {/* Trang 404 nếu không tìm thấy đường dẫn */}
            <Route path="*" element={<div style={{textAlign: 'center', padding: '50px'}}>404 - Không tìm thấy trang</div>} />
          </Routes>
        </main>

        {/* Footer luôn hiển thị ở cuối */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;