// src/pages/Payment/payment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewInfo, setPreviewInfo] = useState(null);
  const [totalWeight, setTotalWeight] = useState(0);

  const paymentMethods = [
    { id: 'cod', icon: '💵', title: 'Thanh toán khi nhận hàng', desc: 'Thanh toán bằng tiền mặt khi nhận hàng' },
    { id: 'bank_transfer', icon: '🏦', title: 'Chuyển khoản ngân hàng', desc: 'Thanh toán qua chuyển khoản' },
    { id: 'mim_pay', icon: '💳', title: 'Ví MiM Pay', desc: 'Thanh toán qua ví điện tử' }
  ];

  // ================= FORMAT CURRENCY =================
  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }, []);

  // ================= TÍNH TOÁN GIÁ =================
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

  // ================= TÍNH TỔNG TRỌNG LƯỢNG =================
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
    if (!selectedItemIds || selectedItemIds.length === 0) {
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

      // 1. Load selected items
      const itemsData = await api.order.getSelectedItems(selectedItemIds);
      console.log('Items data from API:', itemsData);

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

      // 2. Load addresses
      const addressData = await api.address.list();
      setAddresses(addressData);

      const defaultAddr = addressData.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      } else if (addressData.length > 0) {
        setSelectedAddress(addressData[0]);
      }

      // 3. Load carriers
      const carriersData = await api.carrier.getAll();
      console.log('Carriers data:', carriersData);

      // Kiểm tra nếu carriersData là array
      let carriersList = [];
      if (Array.isArray(carriersData)) {
        carriersList = carriersData;
      } else if (carriersData && carriersData.data) {
        // Nếu là Page response
        carriersList = carriersData.data;
      }

      setCarriers(carriersList);
      if (carriersList.length > 0) {
        setSelectedCarrier(carriersList[0]);
      }

      // 4. Tính tổng trọng lượng
      calculateTotalWeight();

      // 5. Load best discount suggestion
      const subtotal = formattedData.reduce((sum, seller) => {
        if (!seller.products || !Array.isArray(seller.products)) return sum;
        return sum + seller.products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0), 0);
      }, 0);

      if (subtotal > 0) {
        try {
          const bestDiscount = await api.discount.getBest(subtotal);
          if (bestDiscount && bestDiscount.discount_id) {
            setPreviewInfo({
              type: 'best',
              discount: bestDiscount,
              message: `Gợi ý: ${bestDiscount.code} - Giảm ${formatCurrency(bestDiscount.discount_amount || 0)}`
            });
          }
        } catch (bestErr) {
          console.log('No best discount available:', bestErr.message);
        }
      }

    } catch (err) {
      console.error('Load initial data error:', err);
      setErrors({ general: 'Không thể tải dữ liệu thanh toán' });

      try {
        const errorObj = JSON.parse(err.message);
        setErrors({ general: errorObj.detail || 'Lỗi tải dữ liệu' });
      } catch (parseErr) {
        setErrors({ general: err.message || 'Lỗi tải dữ liệu' });
      }

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

      // Validate dữ liệu
      if (weight <= 0) {
        throw new Error(JSON.stringify({
          detail: 'Không thể tính phí vận chuyển: Tổng trọng lượng phải lớn hơn 0'
        }));
      }

      if (subtotal <= 0) {
        throw new Error(JSON.stringify({
          detail: 'Không thể tính phí vận chuyển: Tổng tiền hàng phải lớn hơn 0'
        }));
      }

      if (!selectedCarrier || !selectedCarrier.carrier_id) {
        throw new Error(JSON.stringify({
          detail: 'Vui lòng chọn đơn vị vận chuyển'
        }));
      }

      if (!selectedAddress || !selectedAddress.buyer_address_id) {
        throw new Error(JSON.stringify({
          detail: 'Vui lòng chọn địa chỉ giao hàng'
        }));
      }

      console.log('Calculating shipping fee with:', {
        carrierId: selectedCarrier.carrier_id,
        addressId: selectedAddress.buyer_address_id,
        weight: weight,
        cartTotal: subtotal
      });

      const response = await api.carrier.calculateFee(
        selectedCarrier.carrier_id,
        selectedAddress.buyer_address_id,
        weight,
        subtotal
      );

      console.log('Shipping fee response:', response);
      setShippingFee(response.shipping_fee || 0);
      setErrors(prev => ({ ...prev, shipping: undefined, carrier: undefined }));

    } catch (err) {
      console.error('Calculate shipping error:', err);

      let errorDetail = 'Không thể tính phí vận chuyển';
      try {
        const errorObj = JSON.parse(err.message);
        errorDetail = errorObj.detail || JSON.stringify(errorObj);
      } catch (parseErr) {
        errorDetail = err.message || errorDetail;
      }

      setShippingFee(0);
      setErrors(prev => ({
        ...prev,
        shipping: errorDetail,
        carrier: errorDetail.includes('carrier') ? errorDetail : undefined
      }));
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

      // Xử lý response dựa trên cấu trúc
      let discounts = [];
      if (response && response.data) {
        discounts = response.data; // Page response
      } else if (Array.isArray(response)) {
        discounts = response; // Array response
      }

      setAvailableDiscounts(discounts);

    } catch (err) {
      console.error('Load discounts error:', err);
      setAvailableDiscounts([]);
    }
  };

  useEffect(() => {
    if (orderData && orderData.length > 0 && calculateSubtotal() > 0) {
      loadAvailableDiscounts();
    }
  }, [orderData]);

  // ================= PREVIEW VOUCHER =================
  const previewVoucher = async (discount) => {
    try {
      const subtotal = calculateSubtotal();

      if (!discount.discount_id) {
        console.log('No discount_id, using code to validate');
        return await validateVoucher(discount.code, subtotal);
      }

      const response = await api.discount.preview(discount.discount_id, subtotal);
      setPreviewInfo({
        type: 'preview',
        discount: discount,
        details: response,
        message: `Giảm ${formatCurrency(response.discount_amount || 0)} (${discount.discount_percent}%)`
      });

      return response;
    } catch (err) {
      console.error('Preview voucher error:', err);

      try {
        const errorObj = JSON.parse(err.message);
        setPreviewInfo({
          type: 'error',
          message: errorObj.detail || 'Không thể xem trước voucher'
        });
      } catch (parseErr) {
        setPreviewInfo({
          type: 'error',
          message: 'Không thể xem trước voucher'
        });
      }

      return null;
    }
  };

  // ================= VALIDATE VOUCHER =================
  const validateVoucher = async (code, cartTotal) => {
    try {
      const response = await api.discount.validateByCode(code, cartTotal);
      return response;
    } catch (err) {
      console.error('Validate voucher error:', err);
      throw err;
    }
  };

  // ================= ÁP DỤNG VOUCHER =================
  const applyVoucher = async (discount) => {
    try {
      const subtotal = calculateSubtotal();

      // Validate voucher
      const validation = await validateVoucher(discount.code, subtotal);

      if (validation.valid) {
        setSelectedDiscount(discount);
        setDiscountAmount(validation.discount_amount);
        setVoucherCode(discount.code);
        setShowVoucherModal(false);
        setPreviewInfo(null);

        alert(`✅ Áp dụng voucher "${discount.code}" thành công! Giảm ${formatCurrency(validation.discount_amount)}`);
      } else {
        alert(`❌ ${validation.message || 'Không thể áp dụng voucher này'}`);
      }
    } catch (err) {
      console.error('Apply voucher error:', err);

      let errorMsg = 'Áp dụng voucher thất bại';
      try {
        const errorObj = JSON.parse(err.message);
        errorMsg = errorObj.detail || errorMsg;
      } catch (parseErr) {
        // Không phải JSON
      }

      alert(`❌ ${errorMsg}`);
    }
  };

  const applyVoucherByCode = async () => {
    if (!voucherCode.trim()) {
      return alert('Vui lòng nhập mã voucher');
    }

    try {
      const subtotal = calculateSubtotal();
      const validation = await validateVoucher(voucherCode.trim(), subtotal);

      if (validation.valid) {
        // Tìm discount object từ availableDiscounts
        const discount = availableDiscounts.find(d => d.code === voucherCode.trim());

        setSelectedDiscount(discount || {
          code: voucherCode.trim(),
          discount_id: null
        });
        setDiscountAmount(validation.discount_amount);

        alert(`✅ Áp dụng voucher "${voucherCode.trim()}" thành công! Giảm ${formatCurrency(validation.discount_amount)}`);
      } else {
        alert(`❌ ${validation.message || 'Mã voucher không hợp lệ'}`);
      }
    } catch (err) {
      console.error('Apply voucher by code error:', err);

      let errorMsg = 'Áp dụng voucher thất bại';
      try {
        const errorObj = JSON.parse(err.message);
        errorMsg = errorObj.detail || errorMsg;
      } catch (parseErr) {
        // Không phải JSON
      }

      alert(`❌ ${errorMsg}`);
    }
  };

  const removeVoucher = () => {
    setSelectedDiscount(null);
    setDiscountAmount(0);
    setVoucherCode('');
    setPreviewInfo(null);
  };

  // ================= XỬ LÝ ĐẶT HÀNG =================
  const validateOrder = () => {
    const newErrors = {};

    if (!selectedAddress) {
      newErrors.address = 'Vui lòng chọn địa chỉ giao hàng';
    }

    if (!selectedCarrier) {
      newErrors.carrier = 'Vui lòng chọn đơn vị vận chuyển';
    }

    // Validate payment method
    const validPaymentMethods = ['bank_transfer', 'cod', 'mim_pay'];
    if (!validPaymentMethods.includes(activeMethod)) {
      newErrors.payment = 'Phương thức thanh toán không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) {
      return;
    }

    if (!window.confirm('Xác nhận đặt hàng?')) return;

    try {
      setSubmitting(true);
      setErrors({});

      // 🔥 Tạo payload đúng format với backend
      const payload = {
        shopping_cart_item_ids: selectedItemIds,
        buyer_address_id: selectedAddress.buyer_address_id,
        carrier_id: selectedCarrier.carrier_id,
        discount_id: selectedDiscount?.discount_id || null,
        payment_method: activeMethod,
        notes: notes.trim() || null
      };

      console.log('📦 Order payload:', JSON.stringify(payload, null, 2));

      // Validate discount trước khi đặt hàng
      if (payload.discount_id) {
        try {
          const subtotal = calculateSubtotal();
          const discountValidation = await api.discount.validateById(payload.discount_id, subtotal);

          if (!discountValidation.valid) {
            throw new Error(JSON.stringify({
              detail: `Voucher không hợp lệ: ${discountValidation.message}`
            }));
          }
        } catch (discountErr) {
          console.warn('Discount pre-validation failed:', discountErr);
          throw discountErr;
        }
      }

      // Tạo đơn hàng
      const response = await api.order.createOrder(payload);
      console.log('✅ Order created:', response);

      // Clear cart items đã đặt hàng
      try {
        await Promise.all(
          selectedItemIds.map(itemId =>
            api.cart.removeItem(itemId).catch(err => {
              console.warn(`Failed to remove cart item ${itemId}:`, err);
            })
          )
        );
      } catch (cartErr) {
        console.warn('Failed to clear cart:', cartErr);
      }

      // Chuyển hướng với thông tin đơn hàng
      navigate('/tracking', {
        state: {
          orderCreated: true,
          orderId: response.order_id,
          message: 'Đặt hàng thành công!'
        }
      });

    } catch (err) {
      console.error('❌ Place order error:', err);

      let errorDetail = 'Đặt hàng thất bại';
      let errorType = 'general';

      try {
        const errorObj = JSON.parse(err.message);
        errorDetail = errorObj.detail || JSON.stringify(errorObj);

        // Phân loại lỗi
        if (errorDetail.toLowerCase().includes('discount') || errorDetail.includes('voucher')) {
          errorType = 'discount';
        } else if (errorDetail.toLowerCase().includes('carrier') || errorDetail.includes('shipping')) {
          errorType = 'carrier';
        } else if (errorDetail.toLowerCase().includes('address')) {
          errorType = 'address';
        } else if (errorDetail.toLowerCase().includes('payment')) {
          errorType = 'payment';
        } else if (errorDetail.toLowerCase().includes('stock') || errorDetail.includes('inventory')) {
          errorType = 'stock';
        } else if (errorDetail.includes('cart_total') || errorDetail.includes('weight')) {
          errorType = 'shipping';
        }

      } catch (parseErr) {
        errorDetail = err.message || 'Đặt hàng thất bại';
      }

      // Hiển thị thông báo lỗi phù hợp
      const errorMessages = {
        discount: `Lỗi voucher: ${errorDetail}\n\nVui lòng chọn lại voucher hoặc bỏ chọn voucher.`,
        carrier: `Lỗi vận chuyển: ${errorDetail}\n\nVui lòng chọn lại đơn vị vận chuyển.`,
        shipping: `Lỗi tính phí vận chuyển: ${errorDetail}\n\nVui lòng kiểm tra lại thông tin vận chuyển.`,
        address: `Lỗi địa chỉ: ${errorDetail}\n\nVui lòng chọn lại địa chỉ giao hàng.`,
        payment: `Lỗi thanh toán: ${errorDetail}\n\nVui lòng chọn phương thức thanh toán khác.`,
        stock: `Lỗi tồn kho: ${errorDetail}\n\nSản phẩm không còn đủ số lượng. Vui lòng kiểm tra lại giỏ hàng.`,
        general: `Đặt hàng thất bại: ${errorDetail}`
      };

      alert(errorMessages[errorType] || errorMessages.general);

      // Set error state để highlight trên UI
      setErrors({ [errorType]: errorDetail });

    } finally {
      setSubmitting(false);
    }
  };

  // ================= RENDER LOADING =================
  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  // ================= RENDER ERROR =================
  if (errors.general) {
    return (
      <div className="checkout-error">
        <div className="error-icon">❌</div>
        <h3>Không thể tải trang thanh toán</h3>
        <p>{errors.general}</p>
        <button
          className="btn-retry"
          onClick={loadInitialData}
        >
          Thử lại
        </button>
        <button
          className="btn-back"
          onClick={() => navigate('/cart')}
        >
          Quay lại giỏ hàng
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-layout">
        <div className="checkout-main">
          {/* ========== ĐỊA CHỈ GIAO HÀNG ========== */}
          <section className={`address-section ${errors.address ? 'error' : ''}`}>
            <div className="address-header">
              <span className="address-icon">📍</span>
              <span>Địa Chỉ Nhận Hàng</span>
              {errors.address && <span className="error-badge">!</span>}
            </div>

            {errors.address && (
              <div className="error-message">{errors.address}</div>
            )}

            {selectedAddress ? (
              <div className="address-info">
                <div className="address-label">
                  {selectedAddress.address.fullname} (+84) {selectedAddress.address.phone}
                </div>
                <div className="address-details">
                  {selectedAddress.address.street}, {selectedAddress.address.ward}, {selectedAddress.address.district}, {selectedAddress.address.province}
                  {selectedAddress.is_default && (
                    <span className="address-badge">Mặc Định</span>
                  )}
                </div>
                <a
                  href="#"
                  className="address-change"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAddressModal(true);
                  }}
                >
                  Thay Đổi
                </a>
              </div>
            ) : (
              <div className="address-empty">
                <p>Chưa có địa chỉ giao hàng</p>
                <button
                  className="btn-add-address"
                  onClick={() => navigate('/addresses')}
                >
                  Thêm địa chỉ
                </button>
              </div>
            )}
          </section>

          {/* ========== DANH SÁCH SẢN PHẨM ========== */}
          <section className="product-section">
            <div className="product-header">
              <div style={{ width: '40%' }}>Sản phẩm</div>
              <div style={{ textAlign: 'center', width: '15%' }}>Phân loại</div>
              <div style={{ textAlign: 'center', width: '15%' }}>Đơn giá</div>
              <div style={{ textAlign: 'center', width: '10%' }}>Số lượng</div>
              <div style={{ textAlign: 'center', width: '20%' }}>Thành tiền</div>
            </div>

            {orderData && orderData.length > 0 ? (
              orderData.map((seller, idx) => (
                <div key={idx}>
                  <div className="store-info">
                    {seller.shop_avatar && (
                      <img
                        src={seller.shop_avatar}
                        alt={seller.shop_name}
                        className="store-avatar"
                      />
                    )}
                    <span className="store-name">{seller.shop_name}</span>
                  </div>

                  {seller.products && seller.products.length > 0 && seller.products.map((product) => (
                    <div key={product.shopping_cart_item_id} className="product-item">
                      <div className="product-info" style={{ width: '40%' }}>
                        <div className="product-image-container">
                          <img
                            src={product.public_image_url || '/assets/products/default.png'}
                            alt={product.name}
                            className="product-image"
                            onError={(e) => {
                              e.target.src = '/assets/products/default.png';
                            }}
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
                      <div className="product-price" style={{ width: '15%' }}>
                        {formatCurrency(product.price)}
                      </div>
                      <div className="product-quantity" style={{ width: '10%' }}>
                        {product.quantity}
                      </div>
                      <div className="product-total" style={{ width: '20%' }}>
                        {formatCurrency(product.price * product.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="no-products">
                Không có sản phẩm nào
              </div>
            )}
          </section>

          {/* ========== ĐƠN VỊ VẬN CHUYỂN ========== */}
          <section className={`shipping-section ${errors.shipping || errors.carrier ? 'error' : ''}`}>
            <div className="shipping-header">
              <span>🚚</span>
              <span>Đơn vị vận chuyển</span>
              {(errors.shipping || errors.carrier) && <span className="error-badge">!</span>}
            </div>

            {errors.shipping && (
              <div className="error-message">{errors.shipping}</div>
            )}

            {errors.carrier && (
              <div className="error-message">{errors.carrier}</div>
            )}

            <div className="shipping-options">
              {carriers && carriers.length > 0 ? (
                carriers.map((carrier) => (
                  <label
                    key={carrier.carrier_id}
                    className={`shipping-option ${selectedCarrier?.carrier_id === carrier.carrier_id ? 'active' : ''}`}
                    onClick={() => setSelectedCarrier(carrier)}
                  >
                    <input
                      type="radio"
                      name="carrier"
                      checked={selectedCarrier?.carrier_id === carrier.carrier_id}
                      readOnly
                    />
                    <div className="shipping-info">
                      {carrier.carrier_avt_url && (
                        <img src={carrier.carrier_avt_url} alt={carrier.carrier_name} className="carrier-logo" />
                      )}
                      <span className="carrier-name">{carrier.carrier_name}</span>
                    </div>
                    {selectedCarrier?.carrier_id === carrier.carrier_id && (
                      <span className="shipping-fee">{formatCurrency(shippingFee)}</span>
                    )}
                  </label>
                ))
              ) : (
                <p className="no-carriers">Chưa có đơn vị vận chuyển</p>
              )}
            </div>

            {/* Thông tin trọng lượng */}
            {totalWeight > 0 && (
              <div className="weight-info">
                <span>Tổng trọng lượng: {totalWeight.toFixed(2)} kg</span>
              </div>
            )}
          </section>

          {/* ========== PHƯƠNG THỨC THANH TOÁN ========== */}
          <section className={`payment-section ${errors.payment ? 'error' : ''}`}>
            <div className="payment-header">
              Phương thức thanh toán
              {errors.payment && <span className="error-badge">!</span>}
            </div>

            {errors.payment && (
              <div className="error-message">{errors.payment}</div>
            )}

            <div className="payment-options">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`payment-option ${activeMethod === method.id ? 'active' : ''}`}
                  onClick={() => setActiveMethod(method.id)}
                >
                  <input
                    type="radio"
                    name="payment"
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

          {/* ========== GHI CHÚ ========== */}
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

        {/* ========== TỔNG KẾT ========== */}
        <aside className="summary-section">
          {/* Voucher Preview Banner */}
          {previewInfo && previewInfo.type !== 'error' && (
            <div className={`preview-banner ${previewInfo.type}`}>
              <div className="preview-icon">
                {previewInfo.type === 'best' ? '🎁' : '👁️'}
              </div>
              <div className="preview-message">{previewInfo.message}</div>
              {previewInfo.type === 'preview' && (
                <button
                  className="btn-apply-preview"
                  onClick={() => applyVoucher(previewInfo.discount)}
                >
                  Áp dụng
                </button>
              )}
              <button
                className="btn-close-preview"
                onClick={() => setPreviewInfo(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Voucher Section */}
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
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') applyVoucherByCode();
                    }}
                  />
                  <button
                    className="voucher-apply"
                    onClick={applyVoucherByCode}
                    disabled={!voucherCode.trim()}
                  >
                    Áp dụng
                  </button>
                </div>

                {availableDiscounts.length > 0 && (
                  <button
                    className="voucher-select"
                    onClick={() => setShowVoucherModal(true)}
                  >
                    Chọn voucher có sẵn ({availableDiscounts.length})
                  </button>
                )}
              </>
            )}
          </div>

          <div className="summary-divider"></div>

          {/* Chi tiết giá */}
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
            onClick={handlePlaceOrder}
            disabled={submitting || !selectedAddress || !selectedCarrier || shippingFee === 0}
          >
            {submitting ? (
              <>
                <span className="spinner"></span>
                Đang xử lý...
              </>
            ) : (
              'Đặt Hàng'
            )}
          </button>
        </aside>
      </div>

      {/* ========== MODAL CHỌN ĐỊA CHỈ ========== */}
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
                  onClick={() => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                  }}
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

              <button
                className="btn-add-new"
                onClick={() => {
                  setShowAddressModal(false);
                  navigate('/addresses');
                }}
              >
                + Thêm địa chỉ mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL CHỌN VOUCHER ========== */}
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
                  <div
                    key={discount.discount_id || discount.code}
                    className="voucher-card"
                    onClick={() => applyVoucher(discount)}
                    onMouseEnter={() => previewVoucher(discount)}
                  >
                    <div className="voucher-card-header">
                      <span className="voucher-card-code">{discount.code}</span>
                      <span className="voucher-card-percent">
                        -{discount.discount_percent}%
                        {discount.max_discount && (
                          <span className="max-discount">
                            (Tối đa: {formatCurrency(discount.max_discount)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="voucher-card-body">
                      <p className="min-order">
                        Đơn tối thiểu: {formatCurrency(discount.min_order_value)}
                      </p>
                      <p className="voucher-card-date">
                        HSD: {new Date(discount.end_date).toLocaleDateString('vi-VN')}
                      </p>
                      {discount.usage_limit && (
                        <p className="usage-limit">
                          Còn lại: {Math.max(0, discount.usage_limit - discount.used_count)} lượt
                        </p>
                      )}
                    </div>
                    <div className="voucher-card-footer">
                      <button className="btn-apply-voucher">Áp dụng</button>
                      <button
                        className="btn-preview-voucher"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewVoucher(discount);
                        }}
                      >
                        Xem trước
                      </button>
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
              <button
                className="btn-close-modal"
                onClick={() => setShowVoucherModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;