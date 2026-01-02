import React from "react";
import { X, MapPin, CreditCard, User, Phone, Mail } from "lucide-react";

import "../../../assets/styles/modal.scss";
import "./OrderDetail.scss";

// Map trạng thái
const ORDER_STATUS = {
  pending: "Chờ xác nhận",
  processing: "Đang chuẩn bị",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const PAYMENT_STATUS = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
};

const PAYMENT_METHOD = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản ngân hàng",
  mim_pay: "Ví Mim Pay",
};

export default function OrderDetailModal({
  isOpen,
  orderId,
  orderDetail,
  onClose,
  onConfirm,
  onShip,
  onCancel,
}) {
  if (!isOpen || !orderDetail) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return `${Number(price).toLocaleString("vi-VN")} ₫`;
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    const parts = [
      address.street,
      address.ward,
      address.district,
      address.province,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal__header">
          <h2 className="modal__title">
            Chi tiết đơn hàng #{orderDetail.order_id}
          </h2>
          <button className="modal__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="modal__body">
          {/* Thông tin đơn hàng */}
          <div className="order-section">
            <h3 className="section-title">Thông tin đơn hàng</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Mã đơn:</span>
                <span className="info-value">#{orderDetail.order_id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngày đặt:</span>
                <span className="info-value">
                  {formatDate(orderDetail.order_date)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Trạng thái:</span>
                <span
                  className={`status-badge status-badge--${orderDetail.order_status}`}
                >
                  {ORDER_STATUS[orderDetail.order_status] ||
                    orderDetail.order_status}
                </span>
              </div>
              {orderDetail.delivery_date && (
                <div className="info-item">
                  <span className="info-label">Ngày giao:</span>
                  <span className="info-value">
                    {formatDate(orderDetail.delivery_date)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin thanh toán */}
          <div className="order-section">
            <h3 className="section-title">
              <CreditCard size={20} />
              Thanh toán
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Phương thức:</span>
                <span className="info-value">
                  {PAYMENT_METHOD[orderDetail.payment_method] ||
                    orderDetail.payment_method}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Trạng thái:</span>
                <span
                  className={`status-badge status-badge--${orderDetail.payment_status}`}
                >
                  {PAYMENT_STATUS[orderDetail.payment_status] ||
                    orderDetail.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Thông tin người đặt hàng */}
          <div className="order-section">
            <h3 className="section-title">
              <User size={20} />
              Người đặt hàng
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Họ tên:</span>
                <span className="info-value">
                  {orderDetail.buyer_info?.full_name || "N/A"}
                </span>
              </div>
              {orderDetail.buyer_info?.phone && (
                <div className="info-item">
                  <span className="info-label">
                    <Phone size={16} />
                    Số điện thoại:
                  </span>
                  <span className="info-value">
                    {orderDetail.buyer_info.phone}
                  </span>
                </div>
              )}
              {orderDetail.buyer_info?.email && (
                <div className="info-item">
                  <span className="info-label">
                    <Mail size={16} />
                    Email:
                  </span>
                  <span className="info-value">
                    {orderDetail.buyer_info.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Địa chỉ giao hàng và thông tin người nhận */}
          <div className="order-section">
            <h3 className="section-title">
              <MapPin size={20} />
              Địa chỉ giao hàng
            </h3>

            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Người nhận hàng:</span>
                <span className="info-value">
                  {orderDetail.shipping_address_detail?.fullname || "N/A"}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">
                  <Phone size={16} />
                  Số điện thoại:
                </span>
                <span className="info-value">
                  {orderDetail.shipping_address_detail?.phone || "N/A"}
                </span>
              </div>

              <div className="info-item info-item--full">
                <span className="info-label">Địa chỉ:</span>
                <span className="info-value">
                  {formatAddress(orderDetail.shipping_address_detail)}
                </span>
              </div>
            </div>
          </div>

          {/* Đơn vị vận chuyển */}
          {orderDetail.carrier_name && (
            <div className="order-section">
              <h3 className="section-title">Đơn vị vận chuyển</h3>
              <div className="info-item">
                <span className="info-value">{orderDetail.carrier_name}</span>
              </div>
            </div>
          )}

          {/* Danh sách sản phẩm - UPDATED */}
          <div className="order-section">
            <h3 className="section-title">
              Sản phẩm ({orderDetail.items?.length || 0})
            </h3>
            <div className="items-list">
              {orderDetail.items?.map((item) => (
                <div key={item.order_item_id} className="item-card">
                  {/* Ảnh sản phẩm */}
                  {item.product_image && (
                    <div className="item-image">
                      <img
                        src={item.product_image}
                        alt={item.product_name || "Product"}
                        onError={(e) => {
                          e.target.src = "/placeholder-product.png";
                        }}
                      />
                    </div>
                  )}

                  <div className="item-content">
                    {/* Tên sản phẩm */}
                    <div className="item-info">
                      <div className="item-name">
                        {item.product_name || `Sản phẩm #${item.product_id}`}
                      </div>
                      <div className="item-details">
                        {/* Size */}
                        {item.size_name && (
                          <span className="item-size">
                            Size: {item.size_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Số lượng và giá */}
                    <div className="item-pricing">
                      <div className="item-quantity">x{item.quantity}</div>
                      <div className="item-prices">
                        <div className="item-unit-price">
                          {formatPrice(item.unit_price)}
                        </div>
                        <div className="item-subtotal">
                          {formatPrice(item.total_price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="order-section">
            <div className="price-summary">
              <div className="price-row">
                <span className="price-label">Tạm tính:</span>
                <span className="price-value">
                  {formatPrice(orderDetail.subtotal)}
                </span>
              </div>
              <div className="price-row">
                <span className="price-label">Phí vận chuyển:</span>
                <span className="price-value">
                  {formatPrice(orderDetail.shipping_price)}
                </span>
              </div>
              {orderDetail.discount_amount > 0 && (
                <div className="price-row">
                  <span className="price-label">Giảm giá:</span>
                  <span className="price-value price-value--discount">
                    -{formatPrice(orderDetail.discount_amount)}
                  </span>
                </div>
              )}
              <div className="price-row price-row--total">
                <span className="price-label">Tổng cộng:</span>
                <span className="price-value price-value--total">
                  {formatPrice(orderDetail.total_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          {orderDetail.notes && (
            <div className="order-section">
              <h3 className="section-title">Ghi chú</h3>
              <div className="notes-box">
                <p>{orderDetail.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER - Actions */}
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Đóng
          </button>
          <div className="modal-actions">
            {onConfirm && (
              <button className="btn btn--success" onClick={onConfirm}>
                <i className="bx bx-check-circle"></i>
                Xác nhận đơn
              </button>
            )}
            {onShip && (
              <button className="btn btn--info" onClick={onShip}>
                <i className="bx bx-package"></i>
                Giao hàng
              </button>
            )}
            {onCancel && (
              <button className="btn btn--danger" onClick={onCancel}>
                <i className="bx bx-x-circle"></i>
                Hủy đơn
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
