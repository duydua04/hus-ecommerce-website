import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./home.css";

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newestProducts, setNewestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ================= Fetch 10 Random Categories =================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await api.category.getAll();

        console.log('All categories:', allCategories);

        // Lấy ngẫu nhiên 10 categories
        const shuffled = [...allCategories].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);

        setCategories(selected);
      } catch (err) {
        console.error("Categories fetch error:", err);
      }
    };

    fetchCategories();
  }, []);

  // ================= Fetch Top 10 Newest Products =================
  useEffect(() => {
    const fetchNewestProducts = async () => {
      try {
        const res = await api.product.getAll({
          sort: "newest",
          limit: 10,
          offset: 0,
        });

        console.log('Products response:', res);

        setNewestProducts(res.data || []);
      } catch (err) {
        console.error("Newest products fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNewestProducts();
  }, []);

  // ================= Handle Product Click =================
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // ================= Handle Category Click =================
  const handleCategoryClick = (categoryId) => {
    navigate(`/search?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <>
      {/* ================= BANNER (Static) ================= */}
      <section className="banner">
        <div className="banner__container">
          <div className="banner__row">
            <main className="banner__main">
              <article className="banner__large relative rounded overflow-hidden">
                <div className="banner__content">
                  <h2 className="banner__title">
                    New trending <br /> Interior decorations
                  </h2>
                  <p className="banner__subtitle">
                    Hot summer discounts ending soon
                  </p>
                  <a href="#deals" className="banner__button">
                    Get Deals Now &gt;
                  </a>
                </div>
                <img
                  src="/assets/banners/main-interior.png"
                  alt="Main banner"
                  className="banner__image"
                />
              </article>
            </main>

            <aside className="banner__small">
              <article className="banner__small-inner">
                <img
                  src="/assets/banners/small-interior.png"
                  alt="Small banner"
                  className="banner__bg-image"
                />
                <div className="banner__caption">
                  <h5 className="banner__caption-title">
                    Custom interiors
                  </h5>
                  <a href="#deals" className="banner__outline-button">
                    Order Now
                  </a>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>

      {/* ================= PRODUCT CATEGORIES ================= */}
      <section className="popular">
        <div className="popular__grid">
          <header className="popular__header">
            <h2 className="popular__title">Danh mục sản phẩm</h2>
          </header>

          {categories.length > 0 ? (
            categories.map((category) => (
              <article
                className="popular__card"
                key={category.category_id}
                onClick={() => handleCategoryClick(category.category_id)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={category.image_url || '/assets/placeholder-category.png'}
                  alt={category.category_name}
                  className="popular__image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/placeholder-category.png';
                  }}
                />
                <p className="popular__label">{category.category_name}</p>
              </article>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
              Không có danh mục nào
            </div>
          )}
        </div>
      </section>

      {/* ================= TOP 10 NEWEST PRODUCTS ================= */}
      <section className="deals" id="deals">
        <div className="deals__grid">
          <header className="deals__header">
            <h2 className="deals__title">Sản phẩm mới nhất</h2>
          </header>

          {newestProducts.length > 0 ? (
            newestProducts.map((product) => (
              <div
                className="product-card"
                key={product.product_id}
                onClick={() => handleProductClick(product.product_id)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={product.public_primary_image_url || '/assets/placeholder-product.png'}
                  alt={product.name}
                  className="product-card__image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/placeholder-product.png';
                  }}
                />

                <div className="product-card__info">
                  <p className="product-card__name">
                    {product.name}
                  </p>
                  {/* PRICE ROW */}
                <div className="product-card__price-row">
                  <p className="product-card__price">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(Number(product.sale_price))}
                  </p>

                  {Number(product.discount_percent) > 0 && (
                    <p className="product-card__originalprice">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(product.min_price)}
                    </p>
                  )}
                </div>

                {/* DISCOUNT BADGE */}
                {Number(product.discount_percent) > 0 && (
                  <p className="product-card__badge">
                    -{Number(product.discount_percent)}%
                  </p>
                )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
              Không có sản phẩm nào
            </div>
          )}
        </div>

        {newestProducts.length > 0 && (
          <div
            className="show-more"
            onClick={() => navigate('/search?sort=newest')}
            style={{ cursor: 'pointer' }}
          >
            Xem thêm sản phẩm
          </div>
        )}
      </section>

      {/* ================= VIDEO REVIEWS (Static) ================= */}
      <section className="video-reviews">
        <div className="video-reviews__container">
          <div className="video-reviews__grid">
            {/* Editors' Picks */}
            <div className="video-reviews__editors-pick">
              <article className="card card--editors-pick">
                <div className="card__body">
                  <p className="card__text-primary">Editors' Picks</p>
                  <h3 className="card__title">Video Reviews</h3>
                  <p className="card__description">
                    Want to add that personal touch? These sellers specialize in embroidery, engraving, illustrating, and more.
                  </p>
                  <a href="#" className="card__button">Shop these findings</a>
                </div>
              </article>
            </div>

            {/* Video Cards */}
            <div>
              <article className="video-thumbnail">
                <a href="#" className="video-thumbnail__link">
                  <img src="../../assets/product-interior/review-1.png" className="video-thumbnail__image" alt="" />
                  <button className="video-thumbnail__play-button">
                    ▶
                  </button>
                </a>
              </article>
            </div>
            <div>
              <article className="video-thumbnail">
                <a href="#" className="video-thumbnail__link">
                  <img src="../../assets/product-interior/review-2.png" className="video-thumbnail__image" alt="" />
                  <button className="video-thumbnail__play-button">
                    ▶
                  </button>
                </a>
              </article>
            </div>
            <div>
              <article className="video-thumbnail">
                <a href="#" className="video-thumbnail__link">
                  <img src="../../assets/product-interior/review-3.png" className="video-thumbnail__image" alt="" />
                  <button className="video-thumbnail__play-button">
                    ▶
                  </button>
                </a>
              </article>
            </div>
            <div>
              <article className="video-thumbnail">
                <a href="#" className="video-thumbnail__link">
                  <img src="../../assets/product-interior/review-4.png" className="video-thumbnail__image" alt="" />
                  <button className="video-thumbnail__play-button">
                    ▶
                  </button>
                </a>
              </article>
            </div>
            <div>
              <article className="video-thumbnail">
                <a href="#" className="video-thumbnail__link">
                  <img src="../../assets/product-interior/review-5.png" className="video-thumbnail__image" alt="" />
                  <button className="video-thumbnail__play-button">
                    ▶
                  </button>
                </a>
              </article>
            </div>
            <div>
              <article className="video-thumbnail">
                <a href="#" className="video-thumbnail__link">
                  <img src="../../assets/product-interior/review-6.png" className="video-thumbnail__image" alt="" />
                  <button className="video-thumbnail__play-button">
                    ▶
                  </button>
                </a>
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;