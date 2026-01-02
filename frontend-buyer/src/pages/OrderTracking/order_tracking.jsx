// src/pages/OrderTracking/order_tracking.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import api from '../../services/api';
import './order_tracking.css';

export default function OrderTracking() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'processing', label: 'Đang xử lý' },
    { key: 'shipped', label: 'Đang giao' },
    { key: 'delivered', label: 'Hoàn thành' },
    { key: 'cancelled', label: 'Đã hủy' }
  ];

  // Load user info if not available
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Error loading user info:', error);
          if (error.message.includes('401')) {
            navigate('/login');
          }
        }
      }
    };

    loadUserInfo();
  }, [user, setUser, navigate]);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const tabParam = activeTab === 'all' ? null : activeTab;

      // Gọi API tracking mới
      const data = await api.order.getOrdersTracking(tabParam);
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);

      if (error.message.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetail = async (orderId) => {
    try {
      setDetailLoading(true);
      const detail = await api.order.getById(orderId);
      setOrderDetail(detail);
    } catch (error) {
      console.error('Error loading order detail:', error);
      alert('Không thể tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOrderClick = async (order) => {
    setSelectedOrder(order);
    await loadOrderDetail(order.order_id);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    try {
      await api.order.cancelOrder(orderId);
      alert('Hủy đơn hàng thành công');
      setSelectedOrder(null);
      setOrderDetail(null);
      loadOrders();
    } catch (error) {
      alert('Không thể hủy đơn hàng: ' + error.message);
    }
  };

  const handleConfirmReceived = async (orderId) => {
    if (!window.confirm('Xác nhận bạn đã nhận được hàng?')) return;

    try {
      await api.order.confirmReceived(orderId);
      alert('Xác nhận đơn hàng thành công');
      setSelectedOrder(null);
      setOrderDetail(null);
      loadOrders();
    } catch (error) {
      alert('Không thể xác nhận đơn hàng: ' + error.message);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.shop_name?.toLowerCase().includes(query) ||
      order.order_id.toString().includes(query) ||
      order.first_item?.product_name?.toLowerCase().includes(query)
    );
  });

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: '#ff9800',
      processing: '#2196f3',
      shipped: '#9c27b0',
      delivered: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#757575';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      processing: 'Đang xử lý',
      shipped: 'Đang giao',
      delivered: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get display name for user
  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.fullname || user.fname || user.email?.split('@')[0] || 'User';
  };

  // Get user avatar
  const getUserAvatar = () => {
    if (user?.avatar_url) {
      return (
        <img
          src={user.avatar_url}
          alt="avatar"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
        />
      );
    }
    return '👤';
  };

  return (
    <div className="order-tracking-page">
      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="user-info">
            <div className="user-avatar">
              {getUserAvatar()}
            </div>
            <div>
              <div className="user-name">{getUserDisplayName()}</div>
              <a href="#" className="user-edit" onClick={(e) => {
                e.preventDefault();
                navigate('/profile');
              }}>✏️ Sửa Hồ Sơ</a>
            </div>
          </div>
          <ul className="sidebar-menu">
            <li className="sidebar-menu__item">
              <a href="#" className="sidebar-menu__link" onClick={(e) => {
                e.preventDefault();
                navigate('/notifications');
              }}>
                <span>🔔</span>
                <span>Thông Báo</span>
              </a>
            </li>
            <li className="sidebar-menu__item">
              <a href="#" className="sidebar-menu__link" onClick={(e) => {
                e.preventDefault();
                navigate('/profile');
              }}>
                <span>👤</span>
                <span>Hồ sơ của tôi</span>
              </a>
            </li>
            <li className="sidebar-menu__item">
              <a href="#" className="sidebar-menu__link active">
                <span>📄</span>
                <span>Đơn Mua</span>
              </a>
            </li>
          </ul>
        </aside>

        {/* Content */}
        <main className="content">
          {/* Tabs */}
          <div className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar__input"
              placeholder="Bạn có thể tìm kiếm theo tên Shop, Mã đơn hàng hoặc Tên Sản phẩm"
            />
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state" id="emptyState">
              <div className="empty-state__icon">📦</div>
              <div className="empty-state__text">Chưa có đơn hàng</div>
            </div>
          ) : (
            <div className="orders-container" id="ordersContainer">
              {filteredOrders.map(order => (
                <div
                  key={order.order_id}
                  className="order-card"
                  onClick={() => handleOrderClick(order)}
                >
                  {/* Order Header */}
                  <div className="order-header">
                    <div className="order-shop">
                      <span className="shop-icon">🏪</span>
                      <span className="shop-name">{order.shop_name}</span>
                    </div>
                    <div className="order-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusBadgeColor(order.order_status) }}
                      >
                        {getStatusText(order.order_status)}
                      </span>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="order-content">
                    <div className="order-image">
                      {order.first_item?.public_url ? (
                        <img
                          src={order.first_item.public_url}
                          alt={order.first_item.product_name}
                          className="product-image"
                        />
                      ) : (
                        <div className="no-image">📷</div>
                      )}
                    </div>
                    <div className="order-info">
                      <h4 className="product-name">
                        {order.first_item?.product_name}
                      </h4>
                      {order.first_item?.variant_name && (
                        <p className="variant-info">
                          Phân loại: {order.first_item.variant_name}
                          {order.first_item?.size_name && ` - ${order.first_item.size_name}`}
                        </p>
                      )}
                      <p className="quantity">x{order.first_item?.quantity}</p>
                      {order.total_items > 1 && (
                        <p className="more-items">
                          +{order.total_items - 1} sản phẩm khác
                        </p>
                      )}
                    </div>
                    <div className="order-price">
                      <div className="price-label">Tổng tiền:</div>
                      <div className="price-value">
                        {formatCurrency(order.total_price)}
                      </div>
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="order-footer">
                    <div className="order-date">
                      Đặt hàng: {formatDate(order.order_date)}
                    </div>
                    <div className="order-actions">
                      <button
                        className="btn-detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderClick(order);
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>Đang tải chi tiết...</p>
              </div>
            ) : orderDetail ? (
              <>
                {/* Modal Header */}
                <div className="modal-header">
                  <h3 className="modal-title">
                    Chi tiết đơn hàng #{orderDetail.order.order_id}
                  </h3>
                  <button className="close-button" onClick={closeModal}>
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                  {/* Order Status */}
                  <div className="detail-section">
                    <div className="detail-row">
                      <span className="detail-label">Trạng thái:</span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusBadgeColor(orderDetail.order.order_status) }}
                      >
                        {getStatusText(orderDetail.order.order_status)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Ngày đặt:</span>
                      <span>{formatDate(orderDetail.order.order_date)}</span>
                    </div>
                    {orderDetail.order.delivery_date && (
                      <div className="detail-row">
                        <span className="detail-label">Ngày giao:</span>
                        <span>{formatDate(orderDetail.order.delivery_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div className="detail-section">
                    <h4 className="section-title">Địa chỉ giao hàng</h4>
                    <div className="address-box">
                      <p><strong>{orderDetail.shipping_address.fullname}</strong></p>
                      <p>{orderDetail.shipping_address.phone}</p>
                      <p>
                        {orderDetail.shipping_address.street}, {orderDetail.shipping_address.ward}, {orderDetail.shipping_address.district}, {orderDetail.shipping_address.province}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="detail-section">
                    <h4 className="section-title">Sản phẩm</h4>
                    {orderDetail.items.map(item => (
                      <div key={item.order_item_id} className="item-row">
                        <div className="item-image">
                          {item.public_image_url ? (
                            <img
                              src={item.public_image_url}
                              alt={item.product_id_name}
                              className="item-img"
                            />
                          ) : (
                            <div className="no-image">📷</div>
                          )}
                        </div>
                        <div className="item-info">
                          <div className="item-name">{item.product_id_name}</div>
                          {item.variant_name && (
                            <div className="item-variant">
                              {item.variant_name}{item.size_name && ` - ${item.size_name}`}
                            </div>
                          )}
                          <div className="item-seller">Shop: {item.seller}</div>
                        </div>
                        <div className="item-quantity">x{item.quantity}</div>
                        <div className="item-price">
                          {formatCurrency(item.unit_price)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Carrier Info */}
                  <div className="detail-section">
                    <h4 className="section-title">Vận chuyển</h4>
                    <div className="carrier-box">
                      <div className="carrier-name">
                        {orderDetail.carrier.carrier_name}
                      </div>
                      <div className="carrier-fee">
                        {formatCurrency(orderDetail.carrier.shipping_fee)}
                      </div>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="detail-section">
                    <div className="summary-row">
                      <span>Tạm tính:</span>
                      <span>{formatCurrency(orderDetail.order.subtotal)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Phí vận chuyển:</span>
                      <span>{formatCurrency(orderDetail.order.shipping_price)}</span>
                    </div>
                    {orderDetail.order.discount_amount > 0 && (
                      <div className="summary-row">
                        <span>Giảm giá:</span>
                        <span className="discount-amount">
                          -{formatCurrency(orderDetail.order.discount_amount)}
                        </span>
                      </div>
                    )}
                    <div className="summary-row summary-total">
                      <span>Tổng cộng:</span>
                      <span>{formatCurrency(orderDetail.order.total_price)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {orderDetail.order.notes && (
                    <div className="detail-section">
                      <h4 className="section-title">Ghi chú</h4>
                      <p className="notes-text">{orderDetail.order.notes}</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                  {orderDetail.order.order_status === 'pending' && (
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancelOrder(orderDetail.order.order_id)}
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                  {orderDetail.order.order_status === 'shipped' && (
                    <button
                      className="btn-confirm"
                      onClick={() => handleConfirmReceived(orderDetail.order.order_id)}
                    >
                      Đã nhận hàng
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}