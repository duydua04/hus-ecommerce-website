// src/pages/Payment/payment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/modal.jsx';
import './payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedItemIds = location.state?.selectedItems || [];

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [carriers, setCarriers] = useState([]);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [activeMethod, setActiveMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [totalWeight, setTotalWeight] = useState(0);

  const paymentMethods = [
    { id: 'cod', icon: '💵', title: 'Thanh toán khi nhận hàng', desc: 'Thanh toán bằng tiền mặt khi nhận hàng' },
    { id: 'bank_transfer', icon: '🏦', title: 'Chuyển khoản ngân hàng', desc: 'Thanh toán qua chuyển khoản' },
    { id: 'mim_pay', icon: '💳', title: 'Ví MiM Pay', desc: 'Thanh toán qua ví điện tử' }
  ];

  // ================= HÀM TIỆN ÍCH =================
  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }, []);

  const calculateSubtotal = useCallback(() => {
    if (!orderData || orderData.length === 0) return 0;
    return orderData.reduce((sum, seller) => {
      if (!seller.products || !Array.isArray(seller.products)) return sum;
      return sum + seller.products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0), 0);
    }, 0);
  }, [orderData]);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal + shippingFee - discountAmount);
  }, [calculateSubtotal, shippingFee, discountAmount]);

  const getTotalQuantity = useCallback(() => {
    if (!orderData || orderData.length === 0) return 0;
    return orderData.reduce((sum, seller) => {
      if (!seller.products || !Array.isArray(seller.products)) return sum;
      return sum + seller.products.reduce((s, p) => s + (p.quantity || 0), 0);
    }, 0);
  }, [orderData]);

  const calculateTotalWeight = useCallback(() => {
    if (!orderData || orderData.length === 0) return 0;
    const weight = orderData.reduce((sum, seller) => {
      if (!seller.products || !Array.isArray(seller.products)) return sum;
      return sum + seller.products.reduce((s, p) => s + (p.weight || 0.5) * (p.quantity || 1), 0);
    }, 0);
    setTotalWeight(weight);
    return weight;
  }, [orderData]);

  // ================= LOAD DỮ LIỆU BAN ĐẦU =================
  useEffect(() => {
    if (selectedItemIds.length === 0) {
      alert('Không có sản phẩm nào được chọn');
      navigate('/cart');
      return;
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrors({});

      const itemsData = await api.order.getSelectedItems(selectedItemIds);
      let formattedData = itemsData;

      if (Array.isArray(itemsData) && itemsData.length > 0 && itemsData[0].shopping_cart_item_id) {
        const groupedBySeller = itemsData.reduce((acc, item) => {
          const sellerId = item.seller_id;
          if (!acc[sellerId]) {
            acc[sellerId] = {
              seller_id: sellerId,
              shop_name: item.shop_name || 'Shop',
              shop_avatar: item.shop_avatar || null,
              products: []
            };
          }
          acc[sellerId].products.push(item);
          return acc;
        }, {});
        formattedData = Object.values(groupedBySeller);
      }
      setOrderData(formattedData);

      const addressData = await api.address.list();
      setAddresses(addressData);
      const defaultAddr = addressData.find(a => a.is_default);
      setSelectedAddress(defaultAddr || (addressData.length > 0 ? addressData[0] : null));

      const carriersData = await api.carrier.getAll();
      let carriersList = [];
      if (Array.isArray(carriersData)) carriersList = carriersData;
      else if (carriersData && carriersData.data) carriersList = carriersData.data;
      setCarriers(carriersList);
      if (carriersList.length > 0) setSelectedCarrier(carriersList[0]);

      calculateTotalWeight();

    } catch (err) {
      console.error('Load initial data error:', err);
      let errorMsg = 'Lỗi tải dữ liệu';
      try {
        const errorObj = JSON.parse(err.message);
        errorMsg = errorObj.detail || errorMsg;
      } catch { }
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // ================= TÍNH PHÍ VẬN CHUYỂN =================
  useEffect(() => {
    if (selectedCarrier && selectedAddress && orderData.length > 0) {
      calculateShippingFee();
    }
  }, [selectedCarrier, selectedAddress, orderData]);

  const calculateShippingFee = async () => {
    try {
      const weight = calculateTotalWeight();
      const subtotal = calculateSubtotal();

      if (weight <= 0 || subtotal <= 0) {
        throw new Error(JSON.stringify({ detail: 'Không thể tính phí vận chuyển' }));
      }

      const response = await api.carrier.calculateFee(
        selectedCarrier.carrier_id,
        selectedAddress.buyer_address_id,
        weight,
        subtotal
      );

      setShippingFee(response.shipping_fee || 0);
      setErrors(prev => ({ ...prev, shipping: undefined }));
    } catch (err) {
      console.error('Calculate shipping error:', err);
      setShippingFee(0);
      setErrors(prev => ({ ...prev, shipping: 'Không thể tính phí vận chuyển' }));
    }
  };

  // ================= LOAD VOUCHER KHẢ DỤNG =================
  const loadAvailableDiscounts = async () => {
    try {
      const subtotal = calculateSubtotal();
      if (subtotal <= 0) {
        setAvailableDiscounts([]);
        return;
      }

      const response = await api.discount.getAvailable({ cart_total: subtotal });
      let discounts = [];
      if (response && response.data) discounts = response.data;
      else if (Array.isArray(response)) discounts = response;
      setAvailableDiscounts(discounts);
    } catch (err) {
      console.error('Load discounts error:', err);
      setAvailableDiscounts([]);
    }
  };

  useEffect(() => {
    if (orderData.length > 0 && calculateSubtotal() > 0) {
      loadAvailableDiscounts();
    }
  }, [orderData]);

  // ================= VOUCHER HANDLERS =================
  const validateVoucher = async (code, cartTotal) => {
    const response = await api.discount.validateByCode(code, cartTotal);
    return response;
  };

  const applyVoucher = async (discount) => {
    try {
      const subtotal = calculateSubtotal();
      const validation = await validateVoucher(discount.code, subtotal);

      if (validation.valid) {
        setSelectedDiscount(discount);
        setDiscountAmount(validation.discount_amount);
        setVoucherCode(discount.code);
        setShowVoucherModal(false);
        alert(`✅ Áp dụng voucher "${discount.code}" thành công! Giảm ${formatCurrency(validation.discount_amount)}`);
      } else {
        alert(`❌ ${validation.message || 'Không thể áp dụng voucher này'}`);
      }
    } catch (err) {
      alert('❌ Áp dụng voucher thất bại');
    }
  };

  const applyVoucherByCode = async () => {
    if (!voucherCode.trim()) return alert('Vui lòng nhập mã voucher');

    try {
      const subtotal = calculateSubtotal();
      const validation = await validateVoucher(voucherCode.trim(), subtotal);

      if (validation.valid) {
        const discount = availableDiscounts.find(d => d.code === voucherCode.trim());
        setSelectedDiscount(discount || { code: voucherCode.trim(), discount_id: null });
        setDiscountAmount(validation.discount_amount);
        alert(`✅ Áp dụng voucher "${voucherCode.trim()}" thành công! Giảm ${formatCurrency(validation.discount_amount)}`);
      } else {
        alert(`❌ ${validation.message || 'Mã voucher không hợp lệ'}`);
      }
    } catch (err) {
      alert('❌ Áp dụng voucher thất bại');
    }
  };

  const removeVoucher = () => {
    setSelectedDiscount(null);
    setDiscountAmount(0);
    setVoucherCode('');
  };

  // ================= XỬ LÝ ĐẶT HÀNG =================
  const validateOrder = () => {
    const newErrors = {};
    if (!selectedAddress) newErrors.address = 'Vui lòng chọn địa chỉ giao hàng';
    if (!selectedCarrier) newErrors.carrier = 'Vui lòng chọn đơn vị vận chuyển';
    if (shippingFee <= 0) newErrors.shipping = 'Chưa tính được phí vận chuyển';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrderClick = () => {
    if (!validateOrder()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    try {
      setSubmitting(true);
      setErrors({});
      setShowConfirmModal(false);

      const payload = {
        cart_item_ids: selectedItemIds,
        buyer_address_id: selectedAddress.buyer_address_id,
        carrier_id: selectedCarrier.carrier_id,
        discount_id: selectedDiscount?.discount_id || null,
        payment_method: activeMethod,
        notes: notes.trim() || null
      };

      // ✅ [FIX] SỬ DỤNG api.order.createOrder ĐỂ GỌI API CHUẨN (CÓ COOKIE)
      const response = await api.order.createOrder(payload);

      // Clear cart items
      try {
        await Promise.all(
          selectedItemIds.map(itemId =>
            api.cart.removeItem(itemId).catch(console.warn)
          )
        );
      } catch (cartErr) {
        console.warn('Failed to clear cart:', cartErr);
      }

      navigate('/tracking', {
        state: {
          orderCreated: true,
          orderId: response.order_id || response.id,
          message: 'Đặt hàng thành công!'
        }
      });

    } catch (err) {
      console.error('Place order error:', err);
      let errorDetail = 'Đặt hàng thất bại';
      try {
        const errorObj = JSON.parse(err.message);
        errorDetail = errorObj.detail || errorDetail;
      } catch { }
      alert(`❌ ${errorDetail}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ================= RENDER =================
  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  if (errors.general) {
    return (
      <div className="checkout-error">
        <div className="error-icon">❌</div>
        <h3>Không thể tải trang thanh toán</h3>
        <p>{errors.general}</p>
        <button className="btn-retry" onClick={loadInitialData}>Thử lại</button>
        <button className="btn-back" onClick={() => navigate('/cart')}>Quay lại giỏ hàng</button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-layout">
        <div className="checkout-main">
          {/* ĐỊA CHỈ GIAO HÀNG */}
          <section className={`address-section ${errors.address ? 'error' : ''}`}>
            <div className="address-header">
              <span className="address-icon">📍</span>
              <span>Địa Chỉ Nhận Hàng</span>
              {errors.address && <span className="error-badge">!</span>}
            </div>
            {errors.address && <div className="error-message">{errors.address}</div>}

            {selectedAddress ? (
              <div className="address-info">
                <div className="address-label">
                  {selectedAddress.address.fullname} (+84) {selectedAddress.address.phone}
                </div>
                <div className="address-details">
                  {selectedAddress.address.street}, {selectedAddress.address.ward}, {selectedAddress.address.district}, {selectedAddress.address.province}
                  {selectedAddress.is_default && <span className="address-badge">Mặc Định</span>}
                </div>
                <a href="#" className="address-change" onClick={(e) => { e.preventDefault(); setShowAddressModal(true); }}>
                  Thay Đổi
                </a>
              </div>
            ) : (
              <div className="address-empty">
                <p>Chưa có địa chỉ giao hàng</p>
                <button className="btn-add-address" onClick={() => navigate('/addresses')}>Thêm địa chỉ</button>
              </div>
            )}
          </section>

          {/* DANH SÁCH SẢN PHẨM */}
          <section className="product-section">
            <div className="product-header">
              <div style={{ width: '40%' }}>Sản phẩm</div>
              <div style={{ textAlign: 'center', width: '15%' }}>Phân loại</div>
              <div style={{ textAlign: 'center', width: '15%' }}>Đơn giá</div>
              <div style={{ textAlign: 'center', width: '10%' }}>Số lượng</div>
              <div style={{ textAlign: 'center', width: '20%' }}>Thành tiền</div>
            </div>

            {orderData.length > 0 ? (
              orderData.flatMap((seller, idx) =>
                seller.products?.map((product) => (
                  <div key={`${idx}-${product.shopping_cart_item_id}`} className="product-item">
                    <div className="product-info" style={{ width: '40%' }}>
                      <div className="product-image-container">
                        <img
                          src={product.public_image_url || '/assets/products/default.png'}
                          alt={product.name}
                          className="product-image"
                          onError={(e) => e.target.src = '/assets/products/default.png'}
                        />
                      </div>
                      <div className="product-details">
                        <div className="product-name">{product.name}</div>
                      </div>
                    </div>
                    <div className="product-variant" style={{ width: '15%' }}>
                      {product.variant_name && <div>{product.variant_name}</div>}
                      {product.size_name && <div className="size-name">{product.size_name}</div>}
                    </div>
                    <div className="product-price" style={{ width: '15%' }}>{formatCurrency(product.price)}</div>
                    <div className="product-quantity" style={{ width: '10%' }}>{product.quantity}</div>
                    <div className="product-total" style={{ width: '20%' }}>{formatCurrency(product.price * product.quantity)}</div>
                  </div>
                ))
              )
            ) : (
              <div className="no-products">Không có sản phẩm nào</div>
            )}
          </section>

          {/* ĐƠN VỊ VẬN CHUYỂN */}
          <section className={`shipping-section ${errors.shipping || errors.carrier ? 'error' : ''}`}>
            <div className="shipping-header">
              <span>🚚</span>
              <span>Đơn vị vận chuyển</span>
              {(errors.shipping || errors.carrier) && <span className="error-badge">!</span>}
            </div>
            {errors.shipping && <div className="error-message">{errors.shipping}</div>}
            {errors.carrier && <div className="error-message">{errors.carrier}</div>}

            <div className="shipping-options">
              {carriers.length > 0 ? carriers.map((carrier) => (
                <label
                  key={carrier.carrier_id}
                  className={`shipping-option ${selectedCarrier?.carrier_id === carrier.carrier_id ? 'active' : ''}`}
                  onClick={() => setSelectedCarrier(carrier)}
                >
                  <input type="radio" name="carrier" checked={selectedCarrier?.carrier_id === carrier.carrier_id} readOnly />
                  <div className="shipping-info">
                    {carrier.carrier_avt_url && <img src={carrier.carrier_avt_url} alt={carrier.carrier_name} className="carrier-logo" />}
                    <span className="carrier-name">{carrier.carrier_name}</span>
                  </div>
                  {selectedCarrier?.carrier_id === carrier.carrier_id && <span className="shipping-fee">{formatCurrency(shippingFee)}</span>}
                </label>
              )) : <p className="no-carriers">Chưa có đơn vị vận chuyển</p>}
            </div>

            {totalWeight > 0 && (
              <div className="weight-info">
                <span>Tổng trọng lượng: {totalWeight.toFixed(2)} kg</span>
              </div>
            )}
          </section>

          {/* PHƯƠNG THỨC THANH TOÁN */}
          <section className="payment-section">
            <div className="payment-header">Phương thức thanh toán</div>
            <div className="payment-options">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`payment-option ${activeMethod === method.id ? 'active' : ''}`}
                  onClick={() => setActiveMethod(method.id)}
                >
                  <input type="radio" name="payment" checked={activeMethod === method.id} readOnly />
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

          {/* GHI CHÚ */}
          <section className="notes-section">
            <label className="notes-label">Ghi chú đơn hàng (không bắt buộc)</label>
            <textarea
              className="notes-textarea"
              placeholder="Nhập ghi chú cho đơn hàng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </section>
        </div>

        {/* TỔNG KẾT */}
        <aside className="summary-section">
          {/* VOUCHER */}
          <div className="voucher-section">
            <div className="voucher-header">
              <span>🎟️</span>
              <span>Mã giảm giá</span>
            </div>

            {selectedDiscount ? (
              <div className="voucher-applied">
                <div className="voucher-info">
                  <span className="voucher-code">{selectedDiscount.code}</span>
                  <span className="voucher-amount">-{formatCurrency(discountAmount)}</span>
                </div>
                <button className="voucher-remove" onClick={removeVoucher}>✕</button>
              </div>
            ) : (
              <>
                <div className="voucher-input-group">
                  <input
                    type="text"
                    placeholder="Nhập mã voucher"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="voucher-input"
                    onKeyPress={(e) => e.key === 'Enter' && applyVoucherByCode()}
                  />
                  <button className="voucher-apply" onClick={applyVoucherByCode} disabled={!voucherCode.trim()}>
                    Áp dụng
                  </button>
                </div>

                {availableDiscounts.length > 0 && (
                  <button className="voucher-select" onClick={() => setShowVoucherModal(true)}>
                    Chọn voucher có sẵn ({availableDiscounts.length})
                  </button>
                )}
              </>
            )}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row">
            <span>Tạm tính ({getTotalQuantity()} sản phẩm):</span>
            <span>{formatCurrency(calculateSubtotal())}</span>
          </div>

          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{formatCurrency(shippingFee)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="summary-row discount-row">
              <span>Giảm giá:</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span className="summary-total-label">Tổng thanh toán:</span>
            <span className="summary-total-amount">{formatCurrency(calculateTotal())}</span>
          </div>

          <button
            className="checkout-button"
            onClick={handlePlaceOrderClick}
            disabled={submitting || !selectedAddress || !selectedCarrier || shippingFee === 0}
          >
            {submitting ? (<><span className="spinner"></span>Đang xử lý...</>) : 'Đặt Hàng'}
          </button>
        </aside>
      </div>

      {/* MODAL XÁC NHẬN ĐẶT HÀNG */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !submitting && setShowConfirmModal(false)}
        title="Xác nhận đơn hàng"
        showCloseButton={!submitting}
        showOkButton={false}
        showCancelButton={false}
        size="medium"
      >
        <div className="confirm-order-modal">
          <p className="confirm-message">Bạn có chắc chắn muốn xác nhận đơn hàng này?</p>

          <div className="order-summary-details">
            <div className="summary-item">
              <span className="summary-label">Số lượng sản phẩm:</span>
              <span className="summary-value">{getTotalQuantity()} sản phẩm</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Tạm tính:</span>
              <span className="summary-value">{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Phí vận chuyển:</span>
              <span className="summary-value">{formatCurrency(shippingFee)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="summary-item discount">
                <span className="summary-label">Giảm giá:</span>
                <span className="summary-value">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="summary-divider-line"></div>
            <div className="summary-item total">
              <span className="summary-label">Tổng thanh toán:</span>
              <span className="summary-value">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div className="confirm-modal-actions">
            <button
              className="btn-cancel-confirm"
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn-ok-confirm"
              onClick={handleConfirmOrder}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Đang xử lý...
                </>
              ) : (
                'OK'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL CHỌN ĐỊA CHỈ */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn địa chỉ giao hàng</h3>
              <button onClick={() => setShowAddressModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {addresses.map((addr) => (
                <div
                  key={addr.buyer_address_id}
                  className={`address-card ${selectedAddress?.buyer_address_id === addr.buyer_address_id ? 'selected' : ''}`}
                  onClick={() => { setSelectedAddress(addr); setShowAddressModal(false); }}
                >
                  <div className="address-card-header">
                    <strong>{addr.address.fullname}</strong>
                    {addr.is_default && <span className="badge-default">Mặc định</span>}
                  </div>
                  <div className="address-card-body">
                    <p>{addr.address.phone}</p>
                    <p>{addr.address.street}, {addr.address.ward}, {addr.address.district}, {addr.address.province}</p>
                  </div>
                </div>
              ))}
              <button className="btn-add-new" onClick={() => { setShowAddressModal(false); navigate('/addresses'); }}>
                + Thêm địa chỉ mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỌN VOUCHER */}
      {showVoucherModal && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-container voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn voucher ({availableDiscounts.length} mã khả dụng)</h3>
              <button onClick={() => setShowVoucherModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="voucher-list">
                {availableDiscounts.map((discount) => (
                  <div key={discount.discount_id || discount.code} className="voucher-card" onClick={() => applyVoucher(discount)}>
                    <div className="voucher-card-header">
                      <span className="voucher-card-code">{discount.code}</span>
                      <span className="voucher-card-percent">
                        -{discount.discount_percent}%
                        {discount.max_discount && <span className="max-discount">(Tối đa: {formatCurrency(discount.max_discount)})</span>}
                      </span>
                    </div>
                    <div className="voucher-card-body">
                      <p className="min-order">Đơn tối thiểu: {formatCurrency(discount.min_order_value)}</p>
                      <p className="voucher-card-date">HSD: {new Date(discount.end_date).toLocaleDateString('vi-VN')}</p>
                      {discount.usage_limit && <p className="usage-limit">Còn lại: {Math.max(0, discount.usage_limit - discount.used_count)} lượt</p>}
                    </div>
                    <div className="voucher-card-footer">
                      <button className="btn-apply-voucher">Áp dụng</button>
                    </div>
                  </div>
                ))}
              </div>

              {availableDiscounts.length === 0 && (
                <div className="no-vouchers">
                  <div className="no-vouchers-icon">🎁</div>
                  <h4>Không có voucher khả dụng</h4>
                  <p>Hiện tại không có voucher nào có thể áp dụng cho đơn hàng của bạn</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-close-modal" onClick={() => setShowVoucherModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;