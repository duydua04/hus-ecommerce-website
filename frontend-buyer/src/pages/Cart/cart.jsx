import React, { useState, useEffect } from 'react';
import './cart.css';

const Cart = () => {
  // Mock data từ HTML của bạn
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Móc khóa trái tim', price: 72000, quantity: 1, seller: 'Pagasa', selected: false, image: 'sanpham1.png' },
    { id: 2, name: 'Ván trượt Lining', price: 92000, quantity: 1, seller: 'Pagasa', selected: false, image: 'sanpham2.png' },
    { id: 3, name: 'Kẹo dẻo mix vị', price: 39000, quantity: 1, seller: 'Pagasa', selected: false, image: 'sanpham3.png' }
  ]);

  // Logic tăng giảm số lượng
  const updateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  // Tính toán tổng tiền
  const selectedItems = cartItems.filter(item => item.selected);
  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 1000000 ? 0 : 15000) : 0;
  const total = subtotal + shipping;

  return (
    <main className="cart">
      <div className="cart__header">
        <h1 className="cart__title">| Giỏ Hàng</h1>
      </div>

      <div className="cart__layout">
        <div className="cart-items">
          <div className="toolbar">
            <div className="toolbar__header">
              <div className="toolbar__title-section">
                <h2 className="toolbar__title">Danh sách sản phẩm</h2>
                <p className="toolbar__subtitle">Bạn có {cartItems.length} sản phẩm</p>
              </div>
            </div>

            {/* Render danh sách sản phẩm theo Seller */}
            <div className="seller-group">
              {cartItems.map(item => (
                <div className="product-row" key={item.id}>
                  <div className="product__image">📦</div>
                  <div className="product__name">{item.name}</div>
                  <div className="product__quantity">
                    <button className="quantity__btn" onClick={() => updateQuantity(item.id, -1)}>−</button>
                    <span className="quantity__value">{item.quantity}</span>
                    <button className="quantity__btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                  <div className="product__price">{(item.price * item.quantity).toLocaleString()}₫</div>
                  <div className="product__actions">
                    <button
                      className={`action-btn action-btn--checkbox ${item.selected ? 'selected' : ''}`}
                      onClick={() => {
                        setCartItems(prev => prev.map(i => i.id === item.id ? {...i, selected: !i.selected} : i))
                      }}
                    >
                      {item.selected && "✓"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="cart-summary">
          <div className="cart-summary__row">
            <span>Tạm tính:</span>
            <span>{subtotal.toLocaleString()}₫</span>
          </div>
          <div className="cart-summary__row">
            <span>Phí vận chuyển:</span>
            <span>{shipping.toLocaleString()}₫</span>
          </div>
          <div className="cart-summary__divider"></div>
          <div className="cart-summary__total">
            <span>Tổng cộng:</span>
            <span>{total.toLocaleString()}₫</span>
          </div>
          <button className="cart-summary__checkout">Mua Ngay</button>
        </aside>
      </div>
    </main>
  );
};

export default Cart;