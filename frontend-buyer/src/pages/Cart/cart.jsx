import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [summary, setSummary] = useState({ subtotal: 0, total_items: 0 });
  const [loading, setLoading] = useState(true);

  // ================= Fetch Cart Data =================
  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await api.cart.getCart();
      setCartData(data || []);
    } catch (err) {
      console.error("Cart fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ================= Calculate Summary =================
  useEffect(() => {
    const calculateSummary = async () => {
      if (selectedItems.size === 0) {
        setSummary({ subtotal: 0, total_items: 0 });
        return;
      }

      try {
        const result = await api.cart.calculateSummary({
          selected_item_ids: Array.from(selectedItems),
        });
        setSummary(result);
      } catch (err) {
        console.error("Summary calculation error:", err);
      }
    };

    calculateSummary();
  }, [selectedItems]);

  // ================= Toggle Item Selection =================
  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // ================= Toggle All Seller Items =================
  const toggleSellerItems = (sellerProducts) => {
    const sellerItemIds = sellerProducts.map((p) => p.shopping_cart_item_id);
    const allSelected = sellerItemIds.every((id) => selectedItems.has(id));

    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        sellerItemIds.forEach((id) => newSet.delete(id));
      } else {
        sellerItemIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  // ================= Update Quantity =================
  const updateQuantity = async (itemId, action, newQuantity = null) => {
    try {
      await api.cart.updateQuantity(itemId, {
        action,
        quantity: newQuantity,
      });
      await fetchCart();
    } catch (err) {
      console.error("Update quantity error:", err);
      alert(err.message || "Cập nhật số lượng thất bại");
    }
  };

  // ================= Delete Item =================
  const deleteItem = async (itemId) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await api.cart.removeItem(itemId);
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      await fetchCart();
    } catch (err) {
      console.error("Delete item error:", err);
      alert(err.message || "Xóa sản phẩm thất bại");
    }
  };

  // ================= Delete All Seller Items =================
  const deleteSellerItems = async (sellerProducts) => {
    if (!confirm(`Bạn có chắc muốn xóa tất cả sản phẩm của seller này?`))
      return;

    try {
      await Promise.all(
        sellerProducts.map((p) => api.cart.removeItem(p.shopping_cart_item_id))
      );
      await fetchCart();
    } catch (err) {
      console.error("Delete seller items error:", err);
      alert("Xóa sản phẩm thất bại");
    }
  };

  // ================= Update Variant/Size =================
  const updateVariantSize = async (itemId, variantId, sizeId) => {
    try {
      await api.cart.updateVariantSize(itemId, {
        new_variant_id: variantId,
        new_size_id: sizeId,
      });
      await fetchCart();
    } catch (err) {
      console.error("Update variant/size error:", err);
      alert(err.message || "Cập nhật thất bại");
    }
  };

  // ================= Checkout =================
  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert("Vui lòng chọn sản phẩm để thanh toán");
      return;
    }
    navigate("/payment", {
      state: { selectedItems: Array.from(selectedItems) },
    });
  };

  // ================= Get Total Products Count =================
  const getTotalProducts = () => {
    return cartData.reduce((sum, seller) => sum + seller.products.length, 0);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div className="loading-spinner"></div>
        <p>Đang tải giỏ hàng...</p>
      </div>
    );
  }

  return (
    <main className="cart">
      <div className="cart__header">
        <div className="cart__title-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M8 16L16.7201 15.2733C19.4486 15.046 20.0611 14.45 20.3635 11.7289L21 6"
              strokeLinecap="round"
            />
            <path d="M6 6H22" strokeLinecap="round" />
            <circle cx="6" cy="20" r="2" />
            <circle cx="17" cy="20" r="2" />
            <path d="M8 20L15 20" strokeLinecap="round" />
            <path
              d="M2 2H2.966C3.91068 2 4.73414 2.62459 4.96326 3.51493L7.93852 15.0765C8.08887 15.6608 7.9602 16.2797 7.58824 16.7616L6.63213 18"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="cart__title">| Giỏ Hàng</h1>
      </div>

      <div className="cart__layout">
        {/* Cart Items */}
        <div className="cart-items">
          <div className="toolbar">
            <div className="toolbar__header">
              <div className="toolbar__title-section">
                <h2 className="toolbar__title">Danh sách sản phẩm</h2>
                <p className="toolbar__subtitle">
                  Quản lý và theo dõi giỏ hàng của bạn:{" "}
                  <span style={{ color: "var(--orange-500)" }}>
                    {getTotalProducts()}
                  </span>{" "}
                  sản phẩm
                </p>
              </div>
            </div>

            {/* Table Header */}
            <div className="toolbar__table-header">
              <div className="toolbar__header-row">
                <div className="toolbar__header-cell">Ảnh</div>
                <div className="toolbar__header-cell">Tên sản phẩm</div>
                <div className="toolbar__header-cell">Phân loại</div>
                <div className="toolbar__header-cell toolbar__header-cell--center">
                  Số lượng
                </div>
                <div className="toolbar__header-cell toolbar__header-cell--center">
                  Giá
                </div>
                <div className="toolbar__header-cell toolbar__header-cell--center">
                  Hành động
                </div>
              </div>
            </div>

            {/* Seller Groups */}
            {cartData.length > 0 ? (
              cartData.map((sellerGroup, idx) => {
                const allSelected = sellerGroup.products.every((p) =>
                  selectedItems.has(p.shopping_cart_item_id)
                );

                return (
                  <div
                    className="seller-group"
                    key={idx}
                    data-seller-id={sellerGroup.seller.seller_id}
                  >
                    {/* Seller Header */}
                    <div className="seller-group__header">
                      <div className="seller-group__avatar">
                        <img
                          src={sellerGroup.seller.avt_url || "/assets/categories/default.png"}
                          alt={sellerGroup.seller.shop_name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/assets/categories/default.png";
                          }}
                        />
                      </div>
                      <div className="seller-group__info">
                        <div className="seller-group__name-wrapper">
                          <div className="seller-group__name">
                            {sellerGroup.seller.shop_name}
                          </div>
                        </div>
                      </div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div className="seller-group__actions">
                        <button
                          className={`seller-group__checkbox ${
                            allSelected ? "selected" : ""
                          }`}
                          title="Chọn tất cả"
                          onClick={() =>
                            toggleSellerItems(sellerGroup.products)
                          }
                        >
                          <svg
                            className="seller-group__checkbox-icon"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button
                          className="seller-group__remove"
                          title="Xóa seller"
                          onClick={() => deleteSellerItems(sellerGroup.products)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Product Rows */}
                    {sellerGroup.products.map((product) => {
                      const isSelected = selectedItems.has(
                        product.shopping_cart_item_id
                      );

                      return (
                        <div
                          className="product-row"
                          key={product.shopping_cart_item_id}
                        >
                          <div className="product__image">
                            <img
                              src={
                                product.public_image_url ||
                                "/assets/products/default.png"
                              }
                              alt={product.name}
                              onError={(e) => {
                                e.target.src = "/assets/products/default.png";
                              }}
                            />
                          </div>
                          <div className="product__name">{product.name}</div>
                          <div className="product__variant">
                            {product.variant_name && (
                              <div className="variant-select">
                                <span className="variant-select__label">
                                  Phân loại:
                                </span>
                                <span>{product.variant_name}</span>
                              </div>
                            )}
                            {product.size_name && (
                              <div className="variant-select">
                                <span className="variant-select__label">
                                  Size:
                                </span>
                                <span>{product.size_name}</span>
                              </div>
                            )}
                          </div>
                          <div className="product__quantity">
                            <button
                              className="quantity__btn"
                              onClick={() =>
                                updateQuantity(
                                  product.shopping_cart_item_id,
                                  null,
                                  product.quantity - 1
                                )
                              }
                              disabled={product.quantity <= 1}
                            >
                              −
                            </button>
                            <span className="quantity__value">
                              {product.quantity}
                            </span>
                            <button
                              className="quantity__btn"
                              onClick={() =>
                                updateQuantity(
                                  product.shopping_cart_item_id,
                                  "increase"
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                          <div className="product__price">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.price * product.quantity)}
                          </div>
                          <div className="product__actions">
                            <button
                              className={`action-btn action-btn--checkbox ${
                                isSelected ? "selected" : ""
                              }`}
                              title="Chọn"
                              onClick={() =>
                                toggleItemSelection(
                                  product.shopping_cart_item_id
                                )
                              }
                            >
                              <svg
                                className="action-btn__icon"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                            <button
                              className="action-btn action-btn--remove"
                              title="Xóa"
                              onClick={() =>
                                deleteItem(product.shopping_cart_item_id)
                              }
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#888",
                }}
              >
                <p style={{ fontSize: "18px", marginBottom: "10px" }}>
                  Giỏ hàng trống
                </p>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    padding: "10px 24px",
                    background: "var(--blue-600)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cart Summary - Đã xóa Voucher và Delivery */}
        <aside className="cart-summary">
          {/* Phần Input Voucher đã bị xóa ở đây */}

          <div className="cart-summary__row">
            <span className="cart-summary__label">
              <span style={{ color: "var(--blue-600)" }}>
                {selectedItems.size}
              </span>{" "}
              sản phẩm:
            </span>
            <span className="cart-summary__value">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(summary.subtotal)}
            </span>
          </div>

          <div className="cart-summary__divider"></div>

          <div className="cart-summary__row cart-summary__total">
            <span className="cart-summary__label">Thành tiền:</span>
            <span className="cart-summary__value">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(summary.subtotal)}
            </span>
          </div>

          <button
            className="cart-summary__checkout"
            onClick={handleCheckout}
            disabled={selectedItems.size === 0}
          >
            Mua Ngay
          </button>

          {/* Phần Đơn vị vận chuyển đã bị xóa ở đây */}
        </aside>
      </div>
    </main>
  );
};

export default Cart;