import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./home.css";

import mainBannerImg from "../../assets/banners/main-interior.png";
import smallBannerImg from "../../assets/banners/small-interior.png";
import nullImage from "../../assets/confligloading/null.png";

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newestProducts, setNewestProducts] = useState([]);
  const [reviewMedias, setReviewMedias] = useState([]);
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

  // ================= Fetch 6 Random Media Reviews =================
  useEffect(() => {
      const fetchMedia = async () => {
        try {
          const res = await api.review.getAllMedia();
          // res: [{ review_id, rating, images, videos, ... }]

          // 1. Chỉ lấy rating = 5
          const rating5Reviews = res.filter(r => r.rating === 5);

          // 2. Gom images + videos thành 1 mảng media
          const medias = rating5Reviews.flatMap(r => {
            const images = (r.images || []).map(url => ({
              type: 'image',
              url,
              product_id: r.product_id,
            }));

            const videos = (r.videos || []).map(url => ({
              type: 'video',
              url,
              product_id: r.product_id,
            }));

            return [...images, ...videos];
          });

          // 3. Random & lấy 6 media
          const shuffled = medias.sort(() => 0.5 - Math.random());
          setReviewMedias(shuffled.slice(0, 6));

        } catch (err) {
          console.error('Fetch media reviews error:', err);
        }
      };

      fetchMedia();
    }, []);

  // ================= Handle Product Click =================
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // ================= Handle Category Click - SỬA LẠI =================
  const handleCategoryClick = (categoryId, categoryName) => {
    // Chuyển đến trang search với điều kiện lọc: mới nhất + danh mục đã chọn
    navigate(`/search?sort=newest&category=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`);
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
                  src={mainBannerImg}
                  alt="Main banner"
                  className="banner__image"
                />
              </article>
            </main>

            <aside className="banner__small">
              <article className="banner__small-inner">
                <img
                  src={smallBannerImg}
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
                onClick={() => handleCategoryClick(category.category_id, category.category_name)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={category.image_url || nullImage}
                  alt={category.category_name}
                  className="popular__image"
                  onError={(e) => {
                    e.target.onerror = null;
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
                  src={product.public_primary_image_url || nullImage}
                  alt={product.name}
                  className="product-card__image"
                  onError={(e) => {
                    e.target.onerror = null;
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
                  <p className="card__text-primary">Ảnh và Video phản hồi</p>
                  <h3 className="card__title">Video đánh giá sản phẩm</h3>
                  <p className="card__description">
                    Mua sắm uy tín, hàng thật, chất lượng thật!
                  </p>
                  <a href="#" className="card__button">Phản hồi chân thật</a>
                </div>
              </article>
            </div>
            {/* ----------------------Video card -----------------*/}
            {reviewMedias.length > 0 ? (
              reviewMedias.map((media, index) => (
                <div key={index}>
                  <article className="video-thumbnail">
                    <a
                      className="video-thumbnail__link"
                      onClick={() => navigate(`/product/${media.product_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {media.type === 'video' ? (
                        <>
                          <video
                            src={media.url}
                            className="video-thumbnail__image"
                            muted
                            preload="metadata"
                          />
                          <button className="video-thumbnail__play-button">▶</button>
                        </>
                      ) : (
                        <img
                          src={media.url}
                          className="video-thumbnail__image"
                          alt="Review media"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/placeholder-product.png';
                          }}
                        />
                      )}
                    </a>
                  </article>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888' }}>
                Chưa có phản hồi 5 sao
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
};

export default Home;