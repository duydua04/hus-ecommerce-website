import React from 'react';
import './home.css'

const Home = () => {
  const productCatalog = [
    { label: 'Thời trang', alt: 'Thời trang' },
    { label: 'Đồ gia dụng', alt: 'Đồ gia dụng' },
    { label: 'Điện tử', alt: 'Điện tử' },
    { label: 'Văn phòng phẩm', alt: 'Văn phòng phẩm' },
    { label: 'Mẹ và bé', alt: 'Mẹ và bé' },
    { label: 'Sức khỏe và làm đẹp', alt: 'Sức khỏe và làm đẹp' }
  ];

  const popularCategories = Array(10).fill(null).map((_, i) => ({
    label: `Category ${String.fromCharCode(65 + Math.min(i, 3))}`,
    alt: `Popular ${i + 1}`
  }));

  const bigDeals = [
    { name: 'Coffee and Tea Cup with Plate', price: 50, originalPrice: 128 },
    { name: 'Name of the product', price: 60, originalPrice: 92 },
    { name: 'Name of the product', price: 79, originalPrice: 121 },
    { name: 'Name of the product', price: 12, originalPrice: 81 },
    { name: 'Name of the product', price: 77, originalPrice: 158 },
    { name: 'Name of the product', price: 93, originalPrice: 152 },
    { name: 'Name of the product', price: 85, originalPrice: 182 },
    { name: 'Name of the product', price: 7, originalPrice: 24 },
    { name: 'Name of the product', price: 63, originalPrice: 88 },
    { name: 'Name of the product', price: 63, originalPrice: 72 }
  ];

  const videoReviews = Array(6).fill(null);

  return (
    <>
      {/* Product Catalog */}
      <section className="product-catalog" aria-label="Product categories">
        <header className="product-catalog__header">
          <h2>Dạnh mục sản phẩm</h2>
        </header>
        <div className="product-catalog__row">
          {productCatalog.map((item, index) => (
            <a key={index} className="product-catalog__item" href="#">
              <div className="product-catalog__image" />
              <p className="product-catalog__label">{item.label}</p>
            </a>
          ))}
        </div>
      </section>

      {/* New Trending Banner */}
      <section className="banner">
        <div className="banner__container">
          <div className="banner__row">
            <main className="banner__main">
              <article className="banner__large">
                <div className="banner__content">
                  <h2 className="banner__title">New trending <br/> Interior decorations</h2>
                  <p className="banner__subtitle">Hot summer discounts ending soon</p>
                  <a href="#" className="banner__button">Get Deals Now &gt;</a>
                </div>
                </article>
            </main>

            <aside className="banner__small">
              <article className="banner__small-inner">
                <div className="banner__caption">
                  <h5 className="banner__caption-title">Custom interiors</h5>
                  <a href="#" className="banner__outline-button">Order Now</a>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>

      {/* Most Popular Categories */}
      <section className="popular" aria-label="Most popular categories">
        <div className="popular__grid">
          <header className="popular__header">
            <h2 className="popular__title">Most Popular Categories</h2>
          </header>

          {popularCategories.map((item, index) => (
            <article key={index} className="popular__card">
              <div className="popular__image" />
              <p className="popular__label">{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Today's Big Deals */}
      <section className="deals" aria-label="Today's big deals">
        <div className="deals__grid">
          <header className="deals__header">
            <h2 className="deals__title">Today's big deals</h2>
          </header>

          {bigDeals.map((product, index) => (
            <div key={index} className="product-card">
              <div className="product-card__image" />
              <button className="product-card__heart" aria-label="Add to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20.5C12 20.5 2 14.5 2 8.7C2 5.8 4.1 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.9 3.5 22 5.8 22 8.7C22 14.5 12 20.5 12 20.5Z"/>
                </svg>
              </button>
              <div className="product-card__info">
                <p className="product-card__name">{product.name}</p>
                <p className="product-card__price">
                  ${product.price}.00 <span className="product-card__originalprice">${product.originalPrice}.00</span>
                </p>
                <p className="product-card__badge">freeship</p>
              </div>
            </div>
          ))}
        </div>

        <button className="show-more">Show More Products</button>
      </section>

      {/* Video Reviews */}
      <section className="video-reviews">
        <div className="video-reviews__container">
          <div className="video-reviews__grid">
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

            {videoReviews.map((_, index) => (
              <div key={index}>
                <article className="video-thumbnail">
                  <a href="#" className="video-thumbnail__link">
                    <button className="video-thumbnail__play-button">
                      <svg width="15" height="20" viewBox="0 0 15 20">
                        <path d="M0 0V20L15 10L0 0Z" />
                      </svg>
                    </button>
                  </a>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;