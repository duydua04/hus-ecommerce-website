import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Chat from "../../components/Chat/Chat";
import "./detail.css";
import useTime from "../../context/useTime";

const Detail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [variants, setVariants] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [price, setPrice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ total: 0, limit: 5, offset: 0 });
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [filterMediaOnly, setFilterMediaOnly] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [replies, setReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const { formatRelativeTime, formatVietnameseDateTime } = useTime();

  // Chat ref
  const chatRef = useRef(null);

  // Fetch replies
  const fetchReplies = async (reviewId) => {
    try {
      setLoadingReplies(prev => ({ ...prev, [reviewId]: true }));
      const response = await api.review.getReplies(reviewId);
      setReplies(prev => ({ ...prev, [reviewId]: response }));
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  useEffect(() => {
    if (reviews.length > 0) {
      reviews.forEach(review => {
        if (review.replies && review.replies.length > 0) {
          setReplies(prev => ({ ...prev, [review.id]: review.replies }));
        }
      });
    }
  }, [reviews]);

  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      const primaryIndex = product.images.findIndex(img => img.is_primary);
      setSelectedImageIndex(primaryIndex >= 0 ? primaryIndex : 0);
    }
  }, [product]);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const productRes = await api.product.getById(productId);
        setProduct(productRes);

        const shopRes = await api.product.getShopInfo(productId);
        setShop(shopRes);

        const variantRes = await api.product.getVariants(productId);
        const variantArray = Array.isArray(variantRes) ? variantRes : [];
        setVariants(variantArray);
        if (variantArray.length > 0) setSelectedVariant(variantArray[0]);

        const reviewRes = await api.review.getByProduct(productId, {
          page: 1,
          limit: 5,
        });

        const reviewData = reviewRes?.data || [];
        setReviews(Array.isArray(reviewData) ? reviewData : []);
        setReviewMeta({
          total: reviewRes?.meta?.total || 0,
          limit: 5,
          offset: 0
        });
      } catch (err) {
        console.error("Fetch error:", err);
        alert("Không thể tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [productId]);

  /* ================= FETCH SIZE ================= */
  useEffect(() => {
    if (!selectedVariant) return;

    const fetchSizes = async () => {
      try {
        const sizeRes = await api.product.getSizes(
          productId,
          selectedVariant.variant_id
        );

        const sizeArray = sizeRes?.sizes || [];
        setSizes(sizeArray);
        setSelectedSize(null);
        setPrice(null);
      } catch (e) {
        console.error(e);
        setSizes([]);
      }
    };

    fetchSizes();
  }, [selectedVariant, productId]);

  /* ================= FETCH PRICE ================= */
  useEffect(() => {
    if (!selectedVariant || !selectedSize) {
      setPrice(null);
      return;
    }

    const fetchPrice = async () => {
      try {
        const priceRes = await api.product.getPrice(
          productId,
          selectedVariant.variant_id,
          selectedSize.size_id
        );
        setPrice(priceRes?.sale_price || priceRes?.price || null);
      } catch (e) {
        console.error(e);
        setPrice(null);
      }
    };

    fetchPrice();
  }, [selectedVariant, selectedSize, productId]);

  /* ================= LOAD MORE REVIEWS ================= */
  const loadMoreReviews = async () => {
    try {
      setLoadingReviews(true);
      const reviewRes = await api.review.getByProduct(productId, {
        page: 1,
        limit: reviewMeta.limit + 20,
      });
      setReviews(reviewRes?.data || []);
      setReviewMeta({
        total: reviewRes?.meta?.total || 0,
        limit: reviewMeta.limit + 20,
        offset: 0
      });
      setShowAllReviews(true);
    } catch (err) {
      console.error("Load reviews error:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  /* ================= HANDLERS ================= */
  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedSize) {
      alert("Vui lòng chọn phân loại và kích thước");
      return;
    }

    try {
      setAddingToCart(true);
      await api.cart.addItem(
        productId,
        selectedVariant.variant_id,
        selectedSize.size_id,
        quantity
      );
    } catch (e) {
      alert(e.message || "Không thể thêm vào giỏ");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || !selectedSize) {
      alert("Vui lòng chọn phân loại và kích thước");
      return;
    }

    try {
      setAddingToCart(true);

      await api.cart.addItem(
        productId,
        selectedVariant.variant_id,
        selectedSize.size_id,
        quantity
      );

      const cartData = await api.cart.getCart();

      let itemId = null;
      for (const seller of cartData) {
        for (const item of seller.products) {
          if (
            item.product_id === parseInt(productId) &&
            item.variant_id === selectedVariant.variant_id &&
            item.size_id === selectedSize.size_id
          ) {
            itemId = item.shopping_cart_item_id;
            break;
          }
        }
        if (itemId) break;
      }

      if (itemId) {
        navigate("/payment", {
          state: { selectedItems: [itemId] }
        });
      } else {
        navigate("/cart");
      }
    } catch (e) {
      alert(e.message || "Không thể mua hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  /* ================= CHAT HANDLER ================= */
  const handleOpenChat = () => {
    if (!shop) return;

    // Use Chat component's method to open with seller
    chatRef.current?.openWithSeller(
      shop.seller_id,
      shop.shop_name,
      shop.avt_url
    );
  };

  const filteredReviews = filterMediaOnly
    ? reviews.filter(
        r =>
          (r.images && r.images.length > 0) ||
          (r.videos && r.videos.length > 0)
      )
    : reviews;

  if (loading) return <div className="loading">Đang tải...</div>;
  if (!product) return null;

  return (
    <>
      {/* Chat Component */}
      <Chat ref={chatRef} />

      <div className="product">
        <div className="product__container">
          {/* ========== GALLERY ========== */}
          <div className="product__gallery">
            <div className="gallery__main">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImageIndex].public_image_url || product.images[selectedImageIndex].image_url}
                  alt={product.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                  }}
                />
              ) : (
                <div className="gallery__placeholder">📷</div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="gallery__thumbnails">
                {product.images.map((img, index) => (
                  <div
                    key={img.product_image_id || index}
                    className={`gallery__thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={img.public_image_url || img.image_url}
                      alt={`${product.name} - ${index + 1}`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/80x80?text=No+Image";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========== INFO ========== */}
          <div className="product__info">
            <h1>{product.name}</h1>

            <div className="product-stats">
              <div className="product-stats__rating">
                <span className="stars">{"★".repeat(Math.round(product.rating))}</span>
                <span className="rating-score">{product.rating?.toFixed(1) || "0.0"}</span>
              </div>
              <div className="product-stats__divider">|</div>
              <div className="product-stats__reviews">
                {product.review_count || 0} Đánh giá
              </div>
              <div className="product-stats__divider">|</div>
              <div className="product-stats__sold">
                {product.sold_quantity || 0} Đã bán
              </div>
            </div>

            {product.description && (
              <div className="product-description">
                <p>{product.description}</p>
              </div>
            )}

            <div className="product-option">
              <label>Phân loại</label>
              <div className="product-option__buttons">
                {variants && variants.length > 0 ? (
                  variants.map(v => (
                    <button
                      key={v.variant_id}
                      className={`product-option__button ${
                        selectedVariant?.variant_id === v.variant_id ? "active" : ""
                      }`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.variant_name}
                    </button>
                  ))
                ) : (
                  <p style={{ color: '#999', fontSize: '14px' }}>Không có phân loại</p>
                )}
              </div>
            </div>

            <div className="product-option">
              <label>Kích thước</label>
              <div className="product-option__buttons">
                {sizes && sizes.length > 0 ? (
                  sizes.map(s => (
                    <button
                      key={s.size_id}
                      className={`product-option__button ${
                        selectedSize?.size_id === s.size_id ? "active" : ""
                      }`}
                      disabled={!s.in_stock}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s.size_name}
                    </button>
                  ))
                ) : (
                  <p style={{ color: '#999', fontSize: '14px' }}>Vui lòng chọn phân loại trước</p>
                )}
              </div>
            </div>

            {/* Shop Info */}
            {shop && (
              <div className="shop-info">
                <div className="shop-info__header">
                  <div className="shop-info__avatar">
                    {shop.avt_url ? (
                      <img src={shop.avt_url} alt={shop.shop_name} />
                    ) : (
                      <div className="shop-info__avatar-fallback">🏪</div>
                    )}
                  </div>
                  <div className="shop-info__details">
                    <h3 className="shop-info__name">{shop.shop_name}</h3>
                    <div className="shop-info__rating">
                      <span className="shop-info__stars">★</span>
                      <span className="shop-info__score">{shop.average_rating?.toFixed(1) || "0.0"}</span>
                      <span className="shop-info__reviews">({shop.rating_count || 0} đánh giá)</span>
                    </div>
                  </div>
                  <button className="shop-info__chat" aria-label="Chat với shop" onClick={handleOpenChat}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Chat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========== PURCHASE ========== */}
          <div className="product__purchase">
            <div className="purchase__price">
              {price && quantity ? (
                <>
                  <div style={{ fontSize: '16px', color: '#999', fontWeight: 'normal', marginBottom: '8px' }}>
                    Đơn giá: {price.toLocaleString()}₫
                  </div>
                  <div>
                    Tổng: {(price * quantity).toLocaleString()}₫
                  </div>
                </>
              ) : (
                "Chọn phân loại"
              )}
            </div>

            <div className="quantity">
              <label>Số lượng:</label>
              <div className="quantity__controls">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  −
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
            </div>

            <button
              className="btn-add-cart"
              onClick={handleAddToCart}
              disabled={!selectedVariant || !selectedSize || addingToCart}
            >
              {addingToCart ? "Đang thêm..." : "🛒 Thêm vào giỏ hàng"}
            </button>

            <button
              className="btn-buy-now"
              onClick={handleBuyNow}
              disabled={!selectedVariant || !selectedSize || addingToCart}
            >
              {addingToCart ? "Đang xử lý..." : "Mua ngay"}
            </button>
          </div>
        </div>

        {/* ========== PRODUCT DETAILS ========== */}
        <section className="product-details">
          <h2>Thông tin sản phẩm</h2>
          <div className="product-details__content">
            <p>{product.description || "Chưa có mô tả chi tiết"}</p>
            {product.weight && (
              <p><strong>Cân nặng:</strong> {product.weight} kg</p>
            )}
          </div>
        </section>

        {/* ========== REVIEWS ========== */}
        <section className="reviews">
          <h2>Đánh giá sản phẩm ({reviewMeta.total})</h2>

          <label className="review-filter">
            <input
              type="checkbox"
              checked={filterMediaOnly}
              onChange={e => setFilterMediaOnly(e.target.checked)}
            />
            Chỉ xem đánh giá có ảnh / video
          </label>

          {filteredReviews.length === 0 ? (
            <p>Chưa có đánh giá</p>
          ) : (
            <>
              {filteredReviews.map(r => (
                <div
                  key={`${r.product_id}-${r.order_id || r._id}`}
                  className="review"
                >
                  <div className="review__header">
                    <div className="review__avatar">
                      {r.reviewer?.avatar ? (
                        <img src={r.reviewer.avatar} alt={r.reviewer.name} />
                      ) : (
                        <div className="review__avatar-fallback">
                          {r.reviewer?.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <div className="review__info">
                      <strong>{r.reviewer?.name || "Người dùng"}</strong>
                      <div className="stars">
                        {"★".repeat(Number(r.rating || 0))}
                        {"☆".repeat(5 - Number(r.rating || 0))}
                      </div>
                    </div>
                  </div>

                  <p className="review__content">{r.review_text || r.content}</p>

                  {r.images?.length > 0 && (
                    <div className="review__media">
                      {r.images.map((img, i) => (
                        <img key={i} src={img} alt="" />
                      ))}
                    </div>
                  )}

                  {r.videos?.length > 0 && (
                    <div className="review__media">
                      {r.videos.map((vid, i) => (
                        <video key={i} src={vid} controls />
                      ))}
                    </div>
                  )}

                  {replies[r.id] && replies[r.id].length > 0 && (
                    <div className="seller-replies">
                      <div className="seller-replies__header">
                        <span className="seller-replies__icon">💬</span>
                        <span className="seller-replies__title">Phản hồi từ người bán:</span>
                      </div>
                      {replies[r.id].map((reply, idx) => (
                        <div key={idx} className="seller-reply">
                          <div className="seller-reply__text">{reply.reply_text}</div>
                          <div className="seller-reply__date" title={formatVietnameseDateTime(reply.reply_date)}>
                            {formatRelativeTime(reply.reply_date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="review__date" title={formatVietnameseDateTime(r.created_at)}>
                    {formatRelativeTime(r.created_at)}
                  </div>
                </div>
              ))}

              {!showAllReviews && reviewMeta.total > reviewMeta.limit && (
                <button
                  className="reviews__view-all"
                  onClick={loadMoreReviews}
                  disabled={loadingReviews}
                >
                  {loadingReviews ? "Đang tải..." : `Xem thêm ${Math.min(20, reviewMeta.total - reviewMeta.limit)} đánh giá`}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
};

export default Detail;