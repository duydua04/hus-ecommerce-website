import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // 1. Thêm useNavigate
import api from "../../services/api";
import "./search.css";

// ================== Helpers ==================
const SORT_OPTIONS = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá tăng dần", value: "price_asc" },
  { label: "Giá giảm dần", value: "price_desc" },
  { label: "Bán chạy", value: "best_seller" },
];

const RATING_OPTIONS = [
  { label: "★★★★★", value: "5" },
  { label: "★★★★✩", value: "4plus" },
  { label: "★★★✩✩", value: "3plus" },
  { label: "★★✩✩✩", value: "2plus" },
  { label: "★✩✩✩✩", value: "1plus" },
];

// ================== Component ==================
export default function SearchResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // 2. Khởi tạo hook điều hướng
  const q = searchParams.get("q") || "";

  // ===== Filters =====
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rating, setRating] = useState(null);
  const [sort, setSort] = useState("newest");

  // ===== Data =====
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, limit: 12, offset: 0 });
  const [loading, setLoading] = useState(false);

  // ================== API ==================
  const fetchCategories = async () => {
    try {
      const res = await api.category.getAll();
      setCategories(res.data || []);
    } catch (err) {
      console.error("Fetch categories failed", err);
    }
  };

  const fetchProducts = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await api.product.getAll({
        q: q || undefined,
        category_id: selectedCategory || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        rating_filter: rating || undefined,
        sort,
        limit: meta.limit,
        offset,
      });

      setProducts(res.data || []);
      setMeta(res.meta || { total: 0, limit: 12, offset });
    } catch (err) {
      console.error("Search fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  // ================== Effects ==================
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selectedCategory, minPrice, maxPrice, rating, sort]);

  // ================== Handlers ==================
  const changePage = (page) => {
    const offset = (page - 1) * meta.limit;
    fetchProducts(offset);
  };

  const totalPages = Math.ceil(meta.total / meta.limit);
  const currentPage = Math.floor(meta.offset / meta.limit) + 1;

  // ================== Render ==================
  return (
    <div className="products-section">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        {/* Category */}
        <div className="sidebar__section">
          <h3 className="sidebar__title">Danh mục</h3>
          <ul className="sidebar__list">
            <li className="sidebar__item">
              <label className="sidebar__label">
                <input
                  type="radio"
                  checked={selectedCategory === null}
                  onChange={() => setSelectedCategory(null)}
                />
                Tất cả
              </label>
            </li>

            {categories.map((c) => (
              <li key={c.category_id} className="sidebar__item">
                <label className="sidebar__label">
                  <input
                    type="radio"
                    checked={selectedCategory === c.category_id}
                    onChange={() => setSelectedCategory(c.category_id)}
                  />
                  {c.name}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Price */}
        <div className="sidebar__section">
          <h3 className="sidebar__title">Khoảng giá</h3>
          <div className="sidebar__price-inputs">
            <input
              className="sidebar__input"
              type="number"
              placeholder="Min"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
            />
            <input
              className="sidebar__input"
              type="number"
              placeholder="Max"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
            />
          </div>

          <button
            className="sidebar__button"
            onClick={() => {
              setMinPrice(minPriceInput);
              setMaxPrice(maxPriceInput);
            }}
          >
            Áp dụng
          </button>
        </div>

        {/* Rating */}
        <div className="sidebar__section">
          <h3 className="sidebar__title">Đánh giá</h3>
          <ul className="sidebar__list">
            {RATING_OPTIONS.map((r) => (
              <li key={r.value} className="sidebar__item">
                <label className="sidebar__label">
                  <input
                    type="radio"
                    name="rating"
                    checked={rating === r.value}
                    onChange={() => setRating(r.value)}
                  />
                  {r.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ===== Main content ===== */}
      <main className="main-content">
        {/* Sort */}
        <div className="main-content__header">
          <select className="main-content__sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading / Empty */}
        {loading && <p>Đang tải…</p>}
        {!loading && products.length === 0 && (
          <p>Không tìm thấy sản phẩm phù hợp</p>
        )}

        {/* Product grid */}
        <div className="product-grid">
          {products.map((p) => (
            <div
              key={p.product_id}
              className="product-card"
              // 3. Thêm sự kiện click để chuyển hướng
              onClick={() => navigate(`/product/${p.product_id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="product-card__image-wrapper">
                <img
                  className="product-card__image"
                  src={p.public_primary_image_url}
                  alt={p.name}
                />
              </div>

              <div className="product-card__info">
                <h3 className="product-card__name">{p.name}</h3>

                <div className="product-card__rating">
                  <span className="product-card__stars">★ {p.rating}</span>
                  <span className="product-card__reviews">
                    ({p.review_count})
                  </span>
                </div>

                <div className="product-card__price">
                  {Number(p.sale_price).toLocaleString()} ₫
                </div>

                <button className="product-card__button">
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`pagination__button ${
                        page === currentPage
                          ? "pagination__button--active"
                          : ""
                      }`}
                      onClick={() => changePage(page)}
                    >
                      {page}
                    </button>
                  )
                )}
          </div>
        )}
      </main>
    </div>
  );
}