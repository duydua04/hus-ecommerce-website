import React, { useState } from 'react';
import './search.css';

import imgSanpham1 from '../../assets/categories/sanpham1.png';
import imgSanpham2 from '../../assets/categories/sanpham2.png';
import imgSanpham3 from '../../assets/categories/sanpham3.png';
import imgSanpham4 from '../../assets/categories/sanpham4.png';
import imgSanpham5 from '../../assets/categories/sanpham5.png';
import imgSanpham6 from '../../assets/categories/sanpham6.png';
import imgSanpham7 from '../../assets/categories/sanpham7.png';
import imgSanpham8 from '../../assets/categories/sanpham8.png';
import imgSanpham9 from '../../assets/categories/sanpham9.png';

const SearchResult = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedRatings, setSelectedRatings] = useState([]);

  // Sản phẩm mẫu
  const products = [
    {
      id: 1,
      name: "Smart watch with the sleek and stylish your perfect assistant.",
      image: imgSanpham1,
      rating: 4,
      reviews: 12,
      price: 376.00
    },
    {
      id: 2,
      name: "Xiaomi Smartphone Pro Max 256GB memory and Ultra display",
      image: imgSanpham2,
      rating: 4,
      reviews: 5,
      price: 99.50
    },
    {
      id: 3,
      name: "Smart watch with the sleek and stylish your perfect assistant.",
      image: imgSanpham3,
      rating: 4,
      reviews: 12,
      price: 376.00
    },
    {
      id: 4,
      name: "Galaxy Tab: designed for both work and play with its stunning display.",
      image: imgSanpham4,
      rating: 4,
      reviews: 12,
      price: 56.00
    },
    {
      id: 5,
      name: "Wacom Intuo Pro tablet: perfect for artists and designers alike.",
      image: imgSanpham5,
      rating: 4,
      reviews: 12,
      price: 12.99
    },
    {
      id: 6,
      name: "Smart watch with the sleek and stylish your perfect assistant.",
      image: imgSanpham6,
      rating: 4,
      reviews: 12,
      price: 376.00
    }
  ];

  const categories = [
    'Máy tính', 'Đồng hồ thông minh', 'Mini Cameras', 'Accessories'
  ];

  const brands = [
    'Apple', 'Asus', 'DELL', 'Lenovo', 'Panasonic', 'Samsung', 'Xiaomi'
  ];

  const categoryIcons = [
    { name: 'Điện thoại', icon: '📱' },
    { name: 'Tai nghe', icon: '🎧' },
    { name: 'Máy tính', icon: '💻' },
    { name: 'TV', icon: '📺' },
    { name: 'Đồng hồ', icon: '⌚' }
  ];

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleBrandChange = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleRatingChange = (rating) => {
    setSelectedRatings(prev =>
      prev.includes(rating)
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  const renderStars = (rating) => {
    const fullStars = '★'.repeat(rating);
    const emptyStars = '☆'.repeat(5 - rating);
    return (
      <>
        <span className="product-card__stars">{fullStars}</span>
        {emptyStars}
      </>
    );
  };

  return (
    <div>
      {/* Category Icons Section */}
      <section className="category-icons">
        <div className="category-icons__container">
          <h1 className="category-icons__title">Đồ điện tử</h1>
          <div className="category-icons__grid">
            {categoryIcons.map((item, index) => (
              <a href="#" key={index} className="category-icons__item">
                <div className="category-icons__icon-wrapper">
                  <span style={{ fontSize: '50px' }}>{item.icon}</span>
                </div>
                <span className="category-icons__label">{item.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Lọc sản phẩm */}
      <div className="products-section">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          <input
            type="checkbox"
            id="sidebar-toggle"
            className="sidebar__toggle"
            checked={sidebarOpen}
            onChange={(e) => setSidebarOpen(e.target.checked)}
          />
          <label htmlFor="sidebar-toggle" className="sidebar__menu-icon">
            ☰ Filters
          </label>

          {/* Categories Filter */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">Phân loại</h3>
            <ul className="sidebar__list">
              {categories.map((category, index) => (
                <li key={index} className="sidebar__item">
                  <label className="sidebar__label">
                    <input
                      type="checkbox"
                      className="sidebar__checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                    />
                    {category}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands Filter */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">Nhãn hàng</h3>
            <ul className="sidebar__list">
              {brands.map((brand, index) => (
                <li key={index} className="sidebar__item">
                  <label className="sidebar__label">
                    <input
                      type="checkbox"
                      className="sidebar__checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
                    />
                    {brand}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range Filter */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">Mức giá</h3>
            <div className="sidebar__price-inputs">
              <input
                type="text"
                placeholder="$0"
                className="sidebar__input"
                value={`$${priceRange.min}`}
                onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value.replace('$', '')) || 0 })}
              />
              <input
                type="text"
                placeholder="$10,000"
                className="sidebar__input"
                value={`$${priceRange.max}`}
                onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value.replace('$', '')) || 10000 })}
              />
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              value={priceRange.max}
              className="sidebar__slider"
              onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
            />
            <button className="sidebar__button">Áp dụng</button>
          </div>

          {/* Rating Filter */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">Đánh giá</h3>
            <ul className="sidebar__list">
              {[5, 4, 3, 2, 1].map((rating) => (
                <li key={rating} className="sidebar__item">
                  <label className="sidebar__label">
                    <input
                      type="checkbox"
                      className="sidebar__checkbox"
                      checked={selectedRatings.includes(rating)}
                      onChange={() => handleRatingChange(rating)}
                    />
                    <span className="sidebar__star-rating">
                      {renderStars(rating)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <div className="product-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-card__image-wrapper">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-card__image"
                  />
                  <div className="product-card__wishlist">♡</div>
                </div>
                <div className="product-card__info">
                  <h3 className="product-card__name">{product.name}</h3>
                  <div className="product-card__rating">
                    {renderStars(product.rating)}
                    <span className="product-card__reviews">
                      {product.rating}.0 ({product.reviews} orders)
                    </span>
                  </div>
                  <div className="product-card__price">${product.price.toFixed(2)}</div>
                  <button className="product-card__button">
                    <span>🛒</span> Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="pagination__back">« Go back</button>
        <div className="pagination__numbers">
          <button className="pagination__button">Prev</button>
          <button className="pagination__button pagination__button--active">1</button>
          <button className="pagination__button">2</button>
          <button className="pagination__button">3</button>
          <button className="pagination__button">Next</button>
        </div>
      </div>
    </div>
  );
};

export default SearchResult;