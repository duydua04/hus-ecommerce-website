// src/pages/OrderTracking/order_tracking.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import api from '../../services/api';
import NotificationSidebar from "../../components/notificationSidebar";
import Modal from "../../components/modal";
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
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsMeta, setReviewsMeta] = useState({ total: 0, limit: 10, offset: 0 });
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewDetail, setReviewDetail] = useState(null);
  const location = useLocation();
  const [reviewedOrderIds, setReviewedOrderIds] = useState([]);
  const [loadingReviewedIds, setLoadingReviewedIds] = useState(false);

  // Modal states
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    showCancelButton: false
  });

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    content: '',
    images: [],
    videos: []
  });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'processing', label: 'Đang xử lý' },
    { key: 'shipped', label: 'Đang giao' },
    { key: 'delivered', label: 'Hoàn thành' },
    { key: 'cancelled', label: 'Đã hủy' },
    { key: 'reviews', label: 'Đánh giá của tôi' }
  ];

  // Helper functions for modal
  const showModal = (config) => {
    setModal({
      isOpen: true,
      ...config
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const showSuccessModal = (message, title = "Thành công") => {
    showModal({
      type: 'success',
      title,
      message,
      showCancelButton: false
    });
  };

  const showErrorModal = (message, title = "Lỗi") => {
    showModal({
      type: 'error',
      title,
      message,
      showCancelButton: false
    });
  };

  const showConfirmModal = (message, onConfirm, title = "Xác nhận") => {
    showModal({
      type: 'confirm',
      title,
      message,
      showCancelButton: true,
      onConfirm,
      okText: 'Đồng ý',
      cancelText: 'Hủy'
    });
  };

  const openReviewDetailModal = async (review) => {
      setSelectedReview(review);
      try {

        const detail = await api.review.getReviewDetail(review.id);
        setReviewDetail(detail);
      } catch (error) {
        console.error('Error loading review detail:', error);

        setReviewDetail(review);
      }
      setShowReviewDetailModal(true);
  };

  const closeReviewDetailModal = () => {
      setShowReviewDetailModal(false);
      setSelectedReview(null);
      setReviewDetail(null);
  };

  // useEffect để tab thẳng đến tab cụ thể mà không cần qua all
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');

    if (tabParam && tabs.find(tab => tab.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const loadReviewedOrderIds = async () => {
    if (!user) return;

    try {
      setLoadingReviewedIds(true);
      const response = await api.review.getReviewedOrderIds();
      setReviewedOrderIds(response.reviewed_order_ids || []);
    } catch (error) {
      console.error('Error loading reviewed order ids:', error);
      setReviewedOrderIds([]);
    } finally {
      setLoadingReviewedIds(false);
    }
  };

  // Load reviewd order_id
  useEffect(() => {
      loadReviewedOrderIds();
    }, [user]);

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
      if (activeTab === 'reviews') {
        loadMyReviews();
      } else {
        loadOrders();
      }
    }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const tabParam = activeTab === 'all' ? null : activeTab;
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
      showErrorModal('Không thể tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const loadMyReviews = async (page = 1) => {
      try {
        setReviewsLoading(true);
        const response = await api.review.getMyReviews({ page, limit: 10 });
        setMyReviews(response.data || []);
        setReviewsMeta(response.meta || { total: 0, limit: 10, offset: 0 });
      } catch (error) {
        console.error('Error loading reviews:', error);
        setMyReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

  const handleOrderClick = async (order) => {
    setSelectedOrder(order);
    await loadOrderDetail(order.order_id);
  };

  const handleCancelOrder = async (orderId) => {
    showConfirmModal(
      'Bạn có chắc muốn hủy đơn hàng này?',
      async () => {
        try {
          await api.order.cancelOrder(orderId);
          showSuccessModal('Hủy đơn hàng thành công');
          setSelectedOrder(null);
          setOrderDetail(null);
          loadOrders();
        } catch (error) {
          showErrorModal('Không thể hủy đơn hàng: ' + error.message);
        }
      },
      'Xác nhận hủy đơn'
    );
  };

  const handleConfirmReceived = async (orderId) => {
    showConfirmModal(
      'Xác nhận bạn đã nhận được hàng?',
      async () => {
        try {
          await api.order.confirmReceived(orderId);
          showSuccessModal('Xác nhận đơn hàng thành công');
          setSelectedOrder(null);
          setOrderDetail(null);
          loadOrders();
        } catch (error) {
          showErrorModal('Không thể xác nhận đơn hàng: ' + error.message);
        }
      },
      'Xác nhận đã nhận hàng'
    );
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  // Review handlers
  const openReviewModal = (item) => {
    setReviewItem(item);
    setReviewData({
      rating: 5,
      content: '',
      images: [],
      videos: []
    });
    setPreviewFiles([]);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewItem(null);
    setReviewData({
      rating: 5,
      content: '',
      images: [],
      videos: []
    });
    setPreviewFiles([]);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        showErrorModal(`File ${file.name} quá lớn. Tối đa 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setUploadingFiles(true);

      const newPreviews = validFiles.map(file => ({
        file,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        preview: URL.createObjectURL(file)
      }));

      setPreviewFiles(prev => [...prev, ...newPreviews]);

      const response = await api.review.uploadFiles(validFiles);
      const uploadedFiles = response.files || [];

      const newImages = [];
      const newVideos = [];

      uploadedFiles.forEach(fileData => {
        const url = fileData.public_url;
        if (fileData.content_type.startsWith('image/')) {
          newImages.push(url);
        } else if (fileData.content_type.startsWith('video/')) {
          newVideos.push(url);
        }
      });

      setReviewData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
        videos: [...prev.videos, ...newVideos]
      }));

    } catch (error) {
      console.error('Upload error:', error);
      showErrorModal('Không thể upload file: ' + error.message);
      setPreviewFiles(prev => prev.slice(0, prev.length - validFiles.length));
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeMedia = (index) => {
    const preview = previewFiles[index];

    if (preview) {
      URL.revokeObjectURL(preview.preview);
      setPreviewFiles(prev => prev.filter((_, i) => i !== index));

      if (preview.type === 'image') {
        setReviewData(prev => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        }));
      } else {
        setReviewData(prev => ({
          ...prev,
          videos: prev.videos.filter((_, i) => i !== index)
        }));
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.content.trim()) {
      showErrorModal('Vui lòng nhập nội dung đánh giá');
      return;
    }

    if (reviewData.rating < 1 || reviewData.rating > 5) {
      showErrorModal('Vui lòng chọn số sao từ 1 đến 5');
      return;
    }

    try {
      setSubmittingReview(true);

      await api.review.create({
        product_id: reviewItem.product_id,
        order_id: orderDetail.order.order_id,
        rating: reviewData.rating,
        content: reviewData.content,
        images: reviewData.images,
        videos: reviewData.videos
      });

      showSuccessModal('Đánh giá thành công!');
      closeReviewModal();

      await loadReviewedOrderIds();

      setReviewedOrderIds(prev => [...prev, orderDetail.order.order_id]);

      await loadOrderDetail(orderDetail.order.order_id);
    } catch (error) {
      console.error('Submit review error:', error);

      let errorMsg = 'Không thể gửi đánh giá';
      try {
        const errorData = JSON.parse(error.message);
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        errorMsg = error.message || errorMsg;
      }

      showErrorModal(errorMsg);
    } finally {
      setSubmittingReview(false);
    }
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

  const hasReviewed = (orderId) => {
    return reviewedOrderIds.includes(orderId);
  };

  const handleDeleteReview = async (productId, orderId) => {
      showConfirmModal(
        'Bạn có chắc muốn xóa đánh giá này?',
        async () => {
          try {
            await api.review.deleteReview(productId, orderId);
            showSuccessModal('Xóa đánh giá thành công');
            loadMyReviews();
          } catch (error) {
            showErrorModal('Không thể xóa đánh giá: ' + error.message);
          }
        },
        'Xác nhận xóa đánh giá'
      );
    };

  return (
    <div className="order-tracking-page">
      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar */}
        <NotificationSidebar user={user} />

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
          {loading || reviewsLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : activeTab === 'reviews' ? (
              // Reviews List
              myReviews.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon">⭐</div>
                    <div className="empty-state__text">Chưa có đánh giá nào</div>
                  </div>
                ) : (
                  <div className="review-table-container">
                    <table className="review-table">
                      <thead>
                        <tr>
                          <th>SẢN PHẨM</th>
                          <th>THỜI GIAN</th>
                          <th>ĐÁNH GIÁ</th>
                          <th>NỘI DUNG</th>
                          <th>PHẢN HỒI</th>
                          <th>HÀNH ĐỘNG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myReviews.map(review => (
                          <tr key={review.id}>
                            {/* Cột SẢN PHẨM */}
                            <td className="review-product-cell">
                              <div className="review-product-name">
                                  Sản phẩm #{review.product_id}
                              </div>
                            </td>

                            {/* Cột THỜI GIAN */}
                            <td className="review-customer-cell">
                              <div className="review-date">
                                  {formatDate(review.created_at)}
                              </div>
                            </td>

                            {/* Cột ĐÁNH GIÁ */}
                            <td className="review-rating-cell">
                              <div className="review-stars-display">
                                <span className="stars" className="review-score">
                                  {'⭐'.repeat(review.rating)}
                                  {' '}
                                  {review.rating}/5
                                </span>
                              </div>
                            </td>

                            {/* Cột NỘI DUNG */}
                            <td className="review-content-cell">
                              <p className="review-text-content">
                                {review.review_text || review.content || "Không có nội dung"}
                              </p>
                            </td>

                            {/* Cột PHẢN HỒI */}
                            <td className="review-response-cell">
                              {review.has_response ? (
                                <span className="review-response-badge responded">
                                  {review.response_count || 1} phản hồi
                                </span>
                              ) : (
                                <span className="review-response-badge pending">
                                  Chưa phản hồi
                                </span>
                              )}
                            </td>

                            {/* Cột HÀNH ĐỘNG */}
                            <td className="review-actions-cell">
                              <div className="review-actions-buttons">
                                <button
                                    className="btn-action btn-detail"
                                    onClick={() => openReviewDetailModal(review)}
                                    title="Xem chi tiết"
                                    >
                                    👁
                                </button>
                                <button
                                  className="btn-action btn-delete"
                                  onClick={() => handleDeleteReview(review.product_id, review.order_id)}
                                  title="Xóa đánh giá"
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📦</div>
              <div className="empty-state__text">Chưa có đơn hàng</div>
            </div>
          ) : (
            <div className="orders-container">
              {filteredOrders.map(order => (
                <div
                  key={order.order_id}
                  className="order-card"
                  onClick={() => handleOrderClick(order)}
                >
                  {/* Order Header */}
                  <div className="order-header">
                    <div className="order-shop">
                      <img
                        className="shop-image"
                        src={order.shop_url}
                      />
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
                        className="btn-detail__order"
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
        <div className="modal-overlay" onClick={closeOrderModal}>
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
                  <button className="close-button" onClick={closeOrderModal}>
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
                      <p>Tên người nhận: <strong>{orderDetail.shipping_address.fullname}</strong></p>
                      <p>Số điện thoại: {orderDetail.shipping_address.phone}</p>
                      <p>Địa chỉ: {orderDetail.shipping_address.street}, {orderDetail.shipping_address.ward}, {orderDetail.shipping_address.district}, {orderDetail.shipping_address.province}
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
                          <div className="item-quantity-info">Số lượng: x{item.quantity}</div>
                        </div>
                        <div className="item-price">
                          {formatCurrency(item.unit_price)}
                        </div>

                        {/* Review button for delivered orders - Only show if not reviewed */}
                        {orderDetail.order.order_status === 'delivered' && !hasReviewed(orderDetail.order.order_id) && (
                          <div className="item-review-action">
                            <button
                              className="btn-review"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReviewModal(item);
                              }}
                            >
                             Đánh giá sản phẩm
                            </button>
                          </div>
                        )}

                        {/* Show reviewed badge if already reviewed */}
                        {hasReviewed(orderDetail.order.order_id) && (
                          <div className="item-review-action">
                            <span className="reviewed-badge">✓ Đã đánh giá</span>
                          </div>
                        )}
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

      {/* Write Review Modal */}
      {showReviewModal && reviewItem && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content review-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Đánh giá sản phẩm</h3>
              <button className="close-button" onClick={closeReviewModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Product Info */}
              <div className="review-product-info">
                <div className="review-product-image">
                  {reviewItem.public_image_url ? (
                    <img src={reviewItem.public_image_url} alt={reviewItem.product_id_name} />
                  ) : (
                    <div className="no-image">📷</div>
                  )}
                </div>
                <div className="review-product-details">
                  <div className="review-product-name">{reviewItem.product_id_name}</div>
                  {reviewItem.variant_name && (
                    <div className="review-product-variant">
                      {reviewItem.variant_name}{reviewItem.size_name && ` - ${reviewItem.size_name}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="review-section">
                <label className="review-label">Chất lượng sản phẩm</label>
                <div className="review-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${star <= reviewData.rating ? 'active' : ''}`}
                      onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="review-section">
                <label className="review-label">Nhận xét</label>
                <textarea
                  className="review-textarea"
                  placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé"
                  value={reviewData.content}
                  onChange={(e) => setReviewData(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                />
              </div>

              {/* Media Upload */}
              <div className="review-section">
                <label className="review-label">Thêm hình ảnh/video</label>
                <div className="review-media-upload">
                  <div className="review-media-preview">
                    {/* Preview uploaded media */}
                    {previewFiles.map((preview, index) => (
                      <div key={index} className="review-media-item">
                        {preview.type === 'image' ? (
                          <img src={preview.preview} alt={`Preview ${index + 1}`} />
                        ) : (
                          <video src={preview.preview} controls />
                        )}
                        <button
                          className="remove-media-btn"
                          onClick={() => removeMedia(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Upload button */}
                    <label className="review-upload-btn">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        disabled={uploadingFiles}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-icon">
                        {uploadingFiles ? '⏳' : '📷'}
                      </div>
                      <div className="upload-text">
                        {uploadingFiles ? 'Đang tải...' : 'Thêm ảnh/video'}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={closeReviewModal}
                disabled={submittingReview}
              >
                Hủy
              </button>
              <button
                className="btn-submit-review"
                onClick={handleSubmitReview}
                disabled={submittingReview || !reviewData.content.trim()}
              >
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
        {showReviewDetailModal && selectedReview && (
          <div className="modal-overlay" onClick={closeReviewDetailModal}>
            <div className="modal-content review-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Chi tiết đánh giá</h3>
                <button className="close-button" onClick={closeReviewDetailModal}>✕</button>
              </div>

              <div className="modal-body">
                {/* Thông tin sản phẩm */}
                <div className="review-detail-section">
                  <h4 className="review-detail-section-title">Thông tin sản phẩm</h4>
                  <div className="product-info-box">
                    <div className="product-info-with-image">
                      {/* Ảnh sản phẩm */}
                      <div className="product-image-container">
                        {(() => {
                          const order = orders.find(o => o.order_id === selectedReview.order_id);
                          const productImage = order?.first_item?.public_url ||
                                              order?.first_item?.product_image ||
                                              null;

                          return productImage ? (
                            <img src={productImage} alt="Sản phẩm" className="product-image" />
                          ) : (
                            <div className="no-product-image">📷</div>
                          );
                        })()}
                      </div>

                      <div className="product-name">
                      <div className="info-label">Sản Phẩm: </div>
                      <div className="info-value">
                          {(() => {
                            const order = orders.find(o => o.order_id === selectedReview.order_id);
                            return order.first_item?.product_name
                          })()}
                      </div>
                      <div className="info-row">
                          <div className="info-label">Phân loại:</div>
                          <div className="info-text_value">
                              {(() => {
                                  const order = orders.find(o => o.order_id === selectedReview.order_id);
                                  return order.first_item?.variant_name || null;
                              })()}
                          </div>
                          <div className="info-text_value">
                                  {(() => {
                                      const order = orders.find(o => o.order_id === selectedReview.order_id);
                                      return order.first_item?.size_name || null;
                                  })()}
                              </div>
                        </div>
                      </div>
                  </div>
                </div>
                </div>

                <div className="review-detail-divider"></div>

                {/* Thông tin người bán */}
                <div className="review-detail-section">
                  <h4 className="review-detail-section-title">Thông tin người bán</h4>
                  <div className="seller-info-box">
                    <div className="seller-info-with-image">
                      {/* Ảnh shop*/}
                      <div className="seller-image-container">
                        {(() => {
                          const order = orders.find(o => o.order_id === selectedReview.order_id);

                          const shopImage = order?.shop_url || null;
                          return shopImage ? (
                            <img
                              src={shopImage}
                              alt="Shop"
                              className="seller-image"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="no-seller-image">🏪</div>';
                              }}
                            />
                          ) : (
                            <div className="no-seller-image">🏪</div>
                          );
                        })()}
                      </div>

                    <div className="seller-info-text">
                        <div className="info-row">
                          <span className="info-label">Tên shop:</span>
                          <span className="info-value">
                            {(() => {
                                const order = orders.find(o => o.order_id === selectedReview.order_id);
                                return order?.shop_name || "My Shop";
                              })()}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Mã đơn hàng:</span>
                          <span className="info-value">
                            #{selectedReview.order_id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="review-detail-divider"></div>

                {/* Đánh giá chi tiết */}
                <div className="review-detail-section">
                  <h4 className="review-detail-section-title">Đánh giá</h4>
                  <div className="review-detail-rating">
                    <div className="stars-large">
                      {'⭐'.repeat(selectedReview.rating)}
                    </div>
                    <div className="rating-score-large">{selectedReview.rating}/5</div>
                  </div>
                  <div className="review-detail-time">
                    {formatDate(selectedReview.created_at)}
                  </div>
                  <div className="review-detail-content">
                    {selectedReview.review_text || selectedReview.content || "tuyệt vời"}
                  </div>
                </div>

                {/* Hình ảnh đính kèm */}
                {((selectedReview.images && selectedReview.images.length > 0) ||
                  (selectedReview.videos && selectedReview.videos.length > 0)) && (
                  <div className="review-detail-section">
                    <h4 className="review-detail-section-title">
                      Hình ảnh đính kèm ({selectedReview.images?.length || 0})
                    </h4>
                    <div className="review-detail-media">
                      {selectedReview.images?.map((img, idx) => (
                        <div key={idx} className="review-detail-media-item">
                          <img src={img} alt={`Hình ${idx + 1}`} />
                        </div>
                      ))}
                      {selectedReview.videos?.map((vid, idx) => (
                        <div key={idx} className="review-detail-media-item">
                          <video src={vid} controls />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="review-detail-divider"></div>

                {/* Phản hồi */}
                <div className="review-detail-section">
                  <h4 className="review-detail-section-title">Phản hồi</h4>
                  {selectedReview.has_response ? (
                    <div className="review-response-container">
                      {reviewDetail?.responses?.map((response, idx) => (
                        <div key={idx} className="review-response-item">
                          <div className="response-header">
                            <span className="response-sender">Người bán</span>
                            <span className="response-time">
                              {formatDate(response.created_at)}
                            </span>
                          </div>
                          <div className="response-content">
                            {response.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-response">
                      *Chưa có phản hồi nào*
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-close-modal" onClick={closeReviewDetailModal}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Global Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        showCancelButton={modal.showCancelButton}
        onOk={modal.onConfirm}
        okText={modal.okText}
        cancelText={modal.cancelText}
      />
    </div>
  );
}