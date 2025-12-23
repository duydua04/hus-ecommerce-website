import React, { useState } from 'react';
import './payment.css';

const Payment = () => {
  // Logic xử lý chọn phương thức thanh toán (thay thế order-payment.js)
  const [activeMethod, setActiveMethod] = useState('cod');

  const methods = [
    { id: 'cod', icon: '💵', title: 'Thanh toán khi nhận hàng', desc: 'Thanh toán bằng tiền mặt khi nhận hàng' },
    { id: 'card', icon: '💳', title: 'Thẻ Tín dụng/Ghi nợ', desc: 'Thanh toán qua thẻ ngân hàng' },
    { id: 'bank', icon: '🏦', title: 'Chuyển khoản ngân hàng', desc: 'Thanh toán qua chuyển khoản' }
  ];

  return (
    <div className="checkout-container">
      <div className="checkout-layout">
        <div className="checkout-main">
          {/* Section: Địa chỉ */}
          <section className="address-section">
            <div className="address-header">
              <span className="address-icon">📍</span>
              <span>Địa Chỉ Nhận Hàng</span>
            </div>
            <div className="address-info">
              <div className="address-label">Trang Thu (+84) 896 581 162</div>
              <div className="address-details">
                334 Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội
                <span className="address-badge">Mặc Định</span>
              </div>
              <a href="#" className="address-change">Thay Đổi</a>
            </div>
          </section>

          {/* Section: Sản phẩm */}
          <section className="product-section">
            <div className="product-header">
              <div>Sản phẩm</div>
              <div style={{ textAlign: 'center' }}>Đơn giá</div>
              <div style={{ textAlign: 'center' }}>Số lượng</div>
              <div style={{ textAlign: 'center' }}>Thành tiền</div>
            </div>
            <div className="store-info">
              <span className="store-name">Bo Decor</span>
              <a href="#" className="chat-button">💬 Chat ngay</a>
            </div>
            <div className="product-item">
              <div className="product-info">
                <img src="/accets/product-catalog/fashion.jpg" alt="Product" className="product-image" />
                <div className="product-details">
                  <div className="product-name">Bộ ga gối 3 món poly coton Bo decor 1m6x2m và</div>
                  <div className="product-variant">Phân loại: Thổ lim,1m6x2m</div>
                </div>
              </div>
              <div className="product-price">59.000₫</div>
              <div className="product-quantity">1</div>
              <div className="product-total">59.000₫</div>
            </div>
          </section>

          {/* Thanh toán */}
          <section className="payment-section">
            <div className="payment-header">Phương thức thanh toán</div>
            <div className="payment-options">
              {methods.map((method) => (
                <label
                  key={method.id}
                  className={`payment-option ${activeMethod === method.id ? 'active' : ''}`}
                  onClick={() => setActiveMethod(method.id)}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="payment-radio"
                    checked={activeMethod === method.id}
                    readOnly
                  />
                  <div className="payment-info">
                    <div className="payment-icon">{method.icon}</div>
                    <div className="payment-details">
                      <div className="payment-name">{method.title}</div>
                      <div className="payment-description">{method.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Tóm tắt */}
        <aside className="summary-section">
          <div className="summary-row">
            <span>Tổng số tiền (1 sản phẩm):</span>
            <span>71.800₫</span>
          </div>
          <div className="summary-total">
            <span className="summary-total-label">Tổng thanh toán:</span>
            <span className="summary-total-amount">71.800₫</span>
          </div>
          <button className="checkout-button">Đặt Hàng</button>
        </aside>
      </div>
    </div>
  );
};

export default Payment;