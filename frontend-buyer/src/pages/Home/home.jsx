// src/pages/Home/Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

const API_BASE = 'http://localhost:8000';

const DEFAULT_CATEGORY_IMAGE =
  'https://via.placeholder.com/200x150?text=Category';
const DEFAULT_PRODUCT_IMAGE =
  'https://via.placeholder.com/300x200?text=Product';

const Home = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== helper =====
  const getCategoryImage = (cat) =>
    cat?.image_url || DEFAULT_CATEGORY_IMAGE;

  const getPrimaryImage = (product) =>
    product?.images?.[0]?.image_url || DEFAULT_PRODUCT_IMAGE;

  const getDiscountedPrice = (price, discount = 0) =>
    Math.round(price * (1 - discount / 100));

  // ===== load data =====
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);

        const [catRes, productRes] = await Promise.all([
          fetch(`${API_BASE}/buyer/products/categories?limit=6`),
          fetch(`${API_BASE}/buyer/products/latest_products?limit=10`)
        ]);

        if (!catRes.ok) {
          throw new Error('Không tải được danh mục');
        }
        if (!productRes.ok) {
          throw new Error('Không tải được sản phẩm');
        }

        const catData = await catRes.json();
        const productData = await productRes.json();

        setCategories(catData.items || []);
        setProducts(productData.items || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (loading) {
    return <p style={{ textAlign: 'center' }}>Đang tải...</p>;
  }

  if (error) {
    return (
      <p style={{ color: 'red', textAlign: 'center' }}>
        {error}
      </p>
    );
  }

  return (
    <div className="home">
      {/* ===== CATEGORIES ===== */}
      <section className="product-catalog">
        <h2>Danh mục sản phẩm</h2>

        <div className="product-catalog__row">
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              className="product-catalog__item"
              onClick={() =>
                navigate(`/search?category=${cat.category_id}`)
              }
            >
              <div
                className="product-catalog__image"
                style={{
                  backgroundImage: `url(${getCategoryImage(cat)})`
                }}
              />
              <p>{cat.category_name}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ===== PRODUCTS ===== */}
      <section className="deals">
        <h2>Sản phẩm mới nhất</h2>

        <div className="deals__grid">
          {products.map((product) => {
            const finalPrice = getDiscountedPrice(
              product.base_price,
              product.discount_percent
            );

            return (
              <article
                key={product.product_id}
                className="product-card"
                onClick={() =>
                  navigate(`/product/${product.product_id}`)
                }
              >
                <div
                  className="product-card__image"
                  style={{
                    backgroundImage: `url(${getPrimaryImage(product)})`
                  }}
                />

                <div className="product-card__info">
                  <h3>{product.name}</h3>

                  <div className="product-card__price">
                    <span>
                      {finalPrice.toLocaleString('vi-VN')}₫
                    </span>

                    {product.discount_percent > 0 && (
                      <span className="discount">
                        -{product.discount_percent}%
                      </span>
                    )}
                  </div>

                  <div className="product-card__meta">
                    ⭐ {product.rating || 0} (
                    {product.review_count || 0})
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <button onClick={() => navigate('/search')}>
          Xem thêm sản phẩm
        </button>
      </section>
    </div>
  );
};

export default Home;
