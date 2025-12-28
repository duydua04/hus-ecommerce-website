// src/pages/Search/Search.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './search.css';

const API_BASE = 'http://localhost:8000';

const SearchResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // filters
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000000 });
  const [selectedRatings, setSelectedRatings] = useState([]);

  // pagination
  const [page, setPage] = useState(1);
  const limit = 12;

  const q = searchParams.get('q') || '';

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        q,
        min_price: priceRange.min,
        max_price: priceRange.max,
        limit,
        offset: (page - 1) * limit,
      });

      if (selectedRatings.length === 1) {
        params.append('rating_filter', selectedRatings[0]);
      }

      const res = await fetch(
        `${API_BASE}/buyer/products/products?${params.toString()}`
      );

      if (!res.ok) throw new Error('Không tải được sản phẩm');

      const data = await res.json();
      setProducts(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [q, priceRange, selectedRatings, page]);

  // ================= UI HELPERS =================
  const renderStars = (rating = 0) => {
    const full = '★'.repeat(Math.round(rating));
    const empty = '☆'.repeat(5 - Math.round(rating));
    return (
      <>
        <span className="product-card__stars">{full}</span>
        {empty}
      </>
    );
  };

  const handleRatingChange = (rating) => {
    setSelectedRatings((prev) =>
      prev.includes(rating)
        ? prev.filter((r) => r !== rating)
        : [rating] // backend chỉ nhận 1 rating_filter
    );
  };

  // ================= RENDER =================
  return (
    <div className="products-section">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar__section">
          <h3 className="sidebar__title">Mức giá</h3>
          <input
            type="number"
            className="sidebar__input"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange({ ...priceRange, min: Number(e.target.value) })
            }
          />
          <input
            type="number"
            className="sidebar__input"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: Number(e.target.value) })
            }
          />
        </div>

        <div className="sidebar__section">
          <h3 className="sidebar__title">Đánh giá</h3>
          {[5, 4, 3, 2, 1].map((r) => (
            <label key={r} className="sidebar__label">
              <input
                type="checkbox"
                checked={selectedRatings.includes(r)}
                onChange={() => handleRatingChange(r)}
              />
              {renderStars(r)}
            </label>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {loading && <p>Đang tải sản phẩm...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="product-grid">
          {products.map((p) => (
            <div
              key={p.product_id}
              className="product-card"
              onClick={() => navigate(`/product/${p.product_id}`)}
            >
              <img
                src={
                  p.images?.[0]?.image_url ||
                  'https://via.placeholder.com/300x300?text=Product'
                }
                alt={p.name}
                className="product-card__image"
              />

              <div className="product-card__info">
                <h3 className="product-card__name">{p.name}</h3>

                <div className="product-card__rating">
                  {renderStars(p.rating || 0)}
                  <span>
                    ({p.review_count || 0})
                  </span>
                </div>

                <div className="product-card__price">
                  {Number(p.base_price).toLocaleString('vi-VN')}₫
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span>Trang {page}</span>
          <button onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </main>
    </div>
  );
};

export default SearchResult;
