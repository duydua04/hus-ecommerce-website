// src/components/NotFound/NotFound.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './notFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to search page or implement search functionality
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleBack = () => {
    navigate(-1); // Quay lại trang trước
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Số 404 lớn */}
        <h1 className="not-found-number">404</h1>

        {/* Tiêu đề */}
        <h2 className="not-found-title">Trang Không tồn tại</h2>

        {/* Thông báo */}
        <p className="not-found-message">
          URL bạn truy cập không tồn tại trong hệ thống rồi!
          <br />
          Đừng lo, hãy quay lại trang Home đê tiếp tục mua sắm nhé!
        </p>

        {/* Search box (optional) */}
        <div className="not-found-search">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Bạn có đang quan tâm đến sản phẩm nào không?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Các nút hành động */}
        <div className="not-found-buttons">
          <Link to="/" className="home-button">
            Go Home
          </Link>

          <button onClick={handleBack} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;