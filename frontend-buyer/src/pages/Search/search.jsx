import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  // Lấy các tham số từ URL
  const q = searchParams.get("q") || "";
  const categoryFromUrl = searchParams.get("category") || null;
  const categoryNameFromUrl = searchParams.get("categoryName") || "";
  const sortFromUrl = searchParams.get("sort") || "newest";

  // ===== Filters =====
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rating, setRating] = useState(null);
  const [sort, setSort] = useState(sortFromUrl);
  const [sortApplied, setSortApplied] = useState(false);

  // ===== Collapse States =====
  const [collapsedSections, setCollapsedSections] = useState({
    category: false,    // Mặc định mở
    price: false,       // Mặc định mở
    rating: false,      // Mặc định mở
  });

  // ===== Data =====
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, limit: 12, offset: 0 });
  const [loading, setLoading] = useState(false);

  // ================== API ==================
  const fetchCategories = async () => {
    try {
      const res = await api.category.getAll();
      setCategories(res || []);
    } catch (err) {
      console.error("Fetch categories failed", err);
    }
  };

  const fetchProducts = async (offset = 0) => {
    setLoading(true);
    try {
      let res;

      console.log("📊 Fetch params:", {
        selectedCategory,
        q,
        minPrice,
        maxPrice,
        rating,
        sort,
        offset
      });

      // Tạo query params chung
      const queryParams = {
        q: q || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        rating_filter: rating || undefined,
        sort: sort,
        limit: meta.limit,
        offset,
      };

      if (selectedCategory) {
        // Có chọn danh mục cụ thể
        console.log(`📦 Fetching products by category: ${selectedCategory}`);
        res = await api.product.getByCategory(selectedCategory, queryParams);
      } else {
        // Tất cả danh mục
        console.log("📦 Fetching all products");
        res = await api.product.getAll(queryParams);
      }

      setProducts(res.data || []);
      setMeta(res.meta || { total: 0, limit: 12, offset });
      setSortApplied(true);
    } catch (err) {
      console.error("❌ Search fetch failed", err);
      setProducts([]);
      setMeta({ total: 0, limit: 12, offset: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ================== Effects ==================
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products khi các filter thay đổi (kể cả sort)
  useEffect(() => {
    console.log("🔄 Triggering fetch due to filter change");
    console.log("🎯 Sort value:", sort);
    console.log("🎯 Selected category:", selectedCategory);

    // Reset về trang đầu tiên khi filter thay đổi
    setMeta(prev => ({ ...prev, offset: 0 }));

    // Thêm debounce để tránh fetch quá nhiều
    const timeoutId = setTimeout(() => {
      fetchProducts(0);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, minPrice, maxPrice, rating, sort, q]);

  // ================== Handlers ==================
  const changePage = (page) => {
    const offset = (page - 1) * meta.limit;
    fetchProducts(offset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (categoryId) => {
    console.log("🔄 Category changed to:", categoryId);

    // Tìm tên danh mục
    let newCategoryName = "";
    if (categoryId) {
      const categoryObj = categories.find(c => c.category_id.toString() === categoryId.toString());
      if (categoryObj) {
        newCategoryName = categoryObj.category_name;
      }
    }

    // Cập nhật URL
    const params = new URLSearchParams();

    if (categoryId) {
      params.set("category", categoryId);
      if (newCategoryName) {
        params.set("categoryName", encodeURIComponent(newCategoryName));
      }
    } else {
      // Nếu chọn "Tất cả danh mục", xóa category khỏi URL
      params.delete("category");
      params.delete("categoryName");
    }

    // Giữ sort hiện tại
    params.set("sort", sort);

    // Giữ query tìm kiếm nếu có
    if (q) {
      params.set("q", q);
    }

    navigate(`/search?${params.toString()}`);

    // Cập nhật state
    setSelectedCategory(categoryId);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    console.log("🎯 Sort changed to:", newSort);

    // Cập nhật state ngay lập tức
    setSort(newSort);
    setSortApplied(false);

    // Cập nhật URL
    const params = new URLSearchParams();

    if (selectedCategory) {
      params.set("category", selectedCategory);
      if (categoryNameFromUrl) {
        params.set("categoryName", categoryNameFromUrl);
      }
    }

    params.set("sort", newSort);

    if (q) {
      params.set("q", q);
    }

    navigate(`/search?${params.toString()}`);
  };

  const handlePriceFilterApply = () => {
    console.log("💰 Price filter applied");
    setMinPrice(minPriceInput);
    setMaxPrice(maxPriceInput);
  };

  const handleRatingChange = (ratingValue) => {
    console.log("⭐ Rating changed to:", ratingValue);
    setRating(ratingValue);
  };

  const handleClearAllFilters = () => {
    console.log("🗑️ Clearing all filters");

    // Reset tất cả filters
    setSelectedCategory(null);
    setMinPrice("");
    setMaxPrice("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setRating(null);
    setSort("newest");
    setSortApplied(false);

    // Cập nhật URL
    const params = new URLSearchParams();
    if (q) {
      params.set("q", q);
    }

    navigate(`/search?${params.toString()}`);
  };

  // Toggle collapse section khi click vào tiêu đề
  const handleTitleClick = (section, e) => {
    e.stopPropagation(); // Ngăn sự kiện lan ra ngoài
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Hàm sắp xếp sản phẩm client-side nếu API không hỗ trợ
  const getSortedProducts = (products) => {
    if (!sortApplied || !products.length) return products;

    const sortedProducts = [...products];

    switch (sort) {
      case "price_asc":
        return sortedProducts.sort((a, b) =>
          parseFloat(a.sale_price || 0) - parseFloat(b.sale_price || 0)
        );

      case "price_desc":
        return sortedProducts.sort((a, b) =>
          parseFloat(b.sale_price || 0) - parseFloat(a.sale_price || 0)
        );

      case "best_seller":
        return sortedProducts.sort((a, b) =>
          parseInt(b.sold_quantity || 0) - parseInt(a.sold_quantity || 0)
        );

      case "newest":
      default:
        // Mặc định sắp xếp theo created_at (mới nhất)
        return sortedProducts.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);
  const currentPage = Math.floor(meta.offset / meta.limit) + 1;

  // Lấy tên danh mục hiện tại
  const getCurrentCategoryName = () => {
    if (categoryNameFromUrl) {
      return decodeURIComponent(categoryNameFromUrl);
    }
    if (selectedCategory) {
      const categoryObj = categories.find(c =>
        c.category_id.toString() === selectedCategory.toString()
      );
      return categoryObj ? categoryObj.category_name : "";
    }
    return "";
  };

  // Lấy sản phẩm đã sắp xếp
  const sortedProducts = getSortedProducts(products);

  // ================== Render ==================
  return (
    <div className="products-section">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        {/* Category Section với clickable title */}
        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <h3
              className="sidebar__title clickable-title"
              onClick={(e) => handleTitleClick('category', e)}
            >
              Danh mục
              <span className="title-chevron">
                {collapsedSections.category}
              </span>
            </h3>
          </div>

          {!collapsedSections.category && (
            <div className="sidebar__section-content">
              {selectedCategory && (
                <div className="current-category">
                  <strong>Đang xem:</strong> {getCurrentCategoryName()}
                </div>
              )}

              <ul className="sidebar__list">
                <li className="sidebar__item">
                  <label className="sidebar__label">
                    <input
                      type="radio"
                      name="category"
                      checked={!selectedCategory}
                      onChange={() => handleCategoryChange(null)}
                    />
                    <span className="sidebar__label-text">Tất cả danh mục</span>
                  </label>
                </li>

                {/* Các danh mục từ database */}
                {categories.map((c) => (
                  <li key={c.category_id} className="sidebar__item">
                    <label className="sidebar__label">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === c.category_id.toString()}
                        onChange={() => handleCategoryChange(c.category_id)}
                      />
                      <span className="sidebar__label-text">{c.category_name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Price Section với clickable title */}
        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <h3
              className="sidebar__title clickable-title"
              onClick={(e) => handleTitleClick('price', e)}
            >
              Khoảng giá
              <span className="title-chevron">
                {collapsedSections.price}
              </span>
            </h3>
          </div>

          {!collapsedSections.price && (
            <div className="sidebar__section-content">
              <div className="sidebar__price-inputs">
                <input
                  className="sidebar__input"
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePriceFilterApply()}
                />
                <input
                  className="sidebar__input"
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePriceFilterApply()}
                />
              </div>

              <button
                className="sidebar__button"
                onClick={handlePriceFilterApply}
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>

        {/* Rating Section với clickable title */}
        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <h3
              className="sidebar__title clickable-title"
              onClick={(e) => handleTitleClick('rating', e)}
            >
              Đánh giá
              <span className="title-chevron">
                {collapsedSections.rating}
              </span>
            </h3>
          </div>

          {!collapsedSections.rating && (
            <div className="sidebar__section-content">
              <ul className="sidebar__list">
                <li className="sidebar__item">
                  <label className="sidebar__label">
                    <input
                      type="radio"
                      name="rating"
                      checked={!rating}
                      onChange={() => handleRatingChange(null)}
                    />
                    <span className="sidebar__label-text">Tất cả đánh giá</span>
                  </label>
                </li>
                {RATING_OPTIONS.map((r) => (
                  <li key={r.value} className="sidebar__item">
                    <label className="sidebar__label">
                      <input
                        type="radio"
                        name="rating"
                        checked={rating === r.value}
                        onChange={() => handleRatingChange(r.value)}
                      />
                      <span className="sidebar__label-text">{r.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Clear All Filters Button - Luôn hiển thị */}
        {(selectedCategory || minPrice || maxPrice || rating || sort !== "newest") && (
          <div className="sidebar__section">
            <button
              className="sidebar__button sidebar__button--clear"
              onClick={handleClearAllFilters}
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </aside>

      {/* ===== Main content ===== */}
      <main className="main-content">
        {/* Header với tiêu đề tìm kiếm */}
        <div className="main-content__header">
          <div className="search-header">
            {q ? (
              <h2 className="search-title">Kết quả tìm kiếm cho: "{q}"</h2>
            ) : selectedCategory ? (
              <h2 className="search-title">Danh mục: {getCurrentCategoryName()}</h2>
            ) : (
              <h2 className="search-title">Tất cả sản phẩm</h2>
            )}
            {meta.total > 0 && (
              <p className="search-count">{meta.total} sản phẩm</p>
            )}
          </div>

          {/* Sort */}
          <select
            className="main-content__sort"
            value={sort}
            onChange={handleSortChange}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Đang tải sản phẩm...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && sortedProducts.length === 0 && (
          <div className="no-products">
            <div className="no-products-icon">😔</div>
            <h3>Không tìm thấy sản phẩm phù hợp</h3>
            <p>Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
            <button
              className="reset-filters-btn"
              onClick={handleClearAllFilters}
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* Product grid */}
        {!loading && sortedProducts.length > 0 && (
          <>
            <div className="product-grid">
              {sortedProducts.map((p) => (
                <div
                  key={p.product_id}
                  className="product-card"
                  onClick={() => navigate(`/product/${p.product_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="product-card__image-wrapper">
                    <img
                      className="product-card__image"
                      src={p.public_primary_image_url || '/assets/placeholder-product.png'}
                      alt={p.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/placeholder-product.png';
                      }}
                    />
                  </div>

                  <div className="product-card__info">
                    <h3 className="product-card__name">{p.name}</h3>

                    <div className="product-card__rating">
                      <span className="product-card__stars">★ {p.rating || 0}</span>
                      <span className="product-card__reviews">
                        ({p.review_count || 0})
                      </span>
                    </div>

                    <div className="product-card__price">
                      {Number(p.sale_price || 0).toLocaleString()} ₫
                      {p.discount_percent && parseFloat(p.discount_percent) > 0 && (
                        <span className="discount-badge">
                          -{parseFloat(p.discount_percent)}%
                        </span>
                      )}
                    </div>

                    {p.sold_quantity >= 0 && (
                      <div className="sold-count">
                        Đã bán: {p.sold_quantity}
                      </div>
                    )}

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
                {currentPage > 1 && (
                  <button
                    className="pagination__button pagination__button--prev"
                    onClick={() => changePage(currentPage - 1)}
                  >
                    ← Trước
                  </button>
                )}

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

                {currentPage < totalPages && (
                  <button
                    className="pagination__button pagination__button--next"
                    onClick={() => changePage(currentPage + 1)}
                  >
                    Sau →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}