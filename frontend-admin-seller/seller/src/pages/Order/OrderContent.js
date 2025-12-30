import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";
import OrderDetailModal from "./OrderDetail/OrderDetail";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import CancelOrderModal from "./CancelOrder/CancelOrder";
import useOrder from "../../hooks/useOrder";

import "../../assets/styles/page.scss";
import "./Order.scss";

// Map trạng thái tiếng Việt
const ORDER_STATUS = {
  pending: "Chờ xác nhận",
  processing: "Đang chuẩn bị hàng",
  shipped: "Đang giao hàng",
  delivered: "Đã giao thành công",
  cancelled: "Đã hủy",
  returned: "Trả hàng",
};

const PAYMENT_STATUS = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
};

const PAYMENT_METHOD = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  mim_pay: "Ví Mim Pay",
};

export default function OrderContent() {
  const {
    orders,
    orderDetail,
    pagination,
    loading,
    error,
    fetchOrders,
    fetchOrderDetail,
    confirmOrder,
    shipOrder,
    cancelOrder,
    clearOrderDetail,
    clearError,
    canConfirm,
    canShip,
    canCancel,
  } = useOrder();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [orderToAction, setOrderToAction] = useState(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const itemsPerPage = 10;

  /* FETCH DATA */
  useEffect(() => {
    fetchOrders({
      status: null,
      date_from: null,
      date_to: null,
      page: 1,
      limit: itemsPerPage,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders({
        status: statusFilter,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        page: currentPage,
        limit: itemsPerPage,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [statusFilter, dateFrom, dateTo, currentPage]);

  const totalPages = Math.ceil(pagination.total / itemsPerPage);

  /* HANDLERS */
  const handleViewDetail = async (order) => {
    try {
      await fetchOrderDetail(order.order_id);
      setSelectedOrderId(order.order_id);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Không tải được chi tiết đơn hàng:", err);
    }
  };

  const handleConfirmOrder = (order) => {
    setOrderToAction(order);
    setConfirmAction("confirm");
    setIsConfirmModalOpen(true);
  };

  const handleShipOrder = (order) => {
    setOrderToAction(order);
    setConfirmAction("ship");
    setIsConfirmModalOpen(true);
  };

  const handleCancelOrderClick = (order) => {
    setOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!orderToAction) return;

    try {
      let result;
      if (confirmAction === "confirm") {
        result = await confirmOrder(orderToAction.order_id);
        setSuccessMessage("Đã xác nhận đơn hàng thành công");
      } else if (confirmAction === "ship") {
        result = await shipOrder(orderToAction.order_id);
        setSuccessMessage("Đã cập nhật trạng thái giao hàng");
      }

      setTimeout(() => setSuccessMessage(""), 3000);

      // Refresh danh sách
      fetchOrders({
        status: statusFilter,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        page: currentPage,
        limit: itemsPerPage,
      });
    } catch (err) {
      console.error("Error action order:", err);
    } finally {
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
      setOrderToAction(null);
    }
  };

  const handleCancelConfirm = async (reason) => {
    if (!orderToCancel) return;

    try {
      await cancelOrder(orderToCancel.order_id, reason);
      setSuccessMessage("Đã hủy đơn hàng thành công");

      setTimeout(() => setSuccessMessage(""), 3000);

      // Refresh danh sách
      fetchOrders({
        status: statusFilter,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        page: currentPage,
        limit: itemsPerPage,
      });
    } catch (err) {
      console.error("Error cancel order:", err);
    } finally {
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
    }
  };

  const handleCancelAction = () => {
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
    setOrderToAction(null);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
    setCurrentPage(1);
  };

  const getConfirmModalContent = () => {
    if (confirmAction === "confirm") {
      return {
        title: "Xác nhận đơn hàng",
        message: "Bạn chắc chắn muốn xác nhận đơn hàng này?",
      };
    } else if (confirmAction === "ship") {
      return {
        title: "Xác nhận giao hàng",
        message:
          "Bạn chắc chắn đã bàn giao đơn hàng này cho đơn vị vận chuyển?",
      };
    }
    return { title: "", message: "" };
  };

  /* TABLE  */
  const columns = [
    {
      key: "order_id",
      label: "Mã đơn",
      className: "table__cell--id",
      render: (v) => `#${v}`,
    },
    {
      key: "order_date",
      label: "Ngày đặt",
      className: "table__cell--date",
      render: (v) =>
        v
          ? new Date(v).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
    },
    {
      key: "buyer_name",
      label: "Khách hàng",
      className: "table__cell--buyer",
    },
    {
      key: "total_price",
      label: "Tổng tiền",
      className: "table__cell--price",
      render: (v) => `${Number(v).toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "order_status",
      label: "Trạng thái",
      className: "table__cell--status",
      render: (v) => (
        <span
          className={`status-badge status-badge--${
            v === "delivered"
              ? "success"
              : v === "cancelled" || v === "returned"
              ? "error"
              : v === "shipped"
              ? "info"
              : v === "processing"
              ? "warning"
              : "pending"
          }`}
        >
          {ORDER_STATUS[v] ?? "Không xác định"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Xem chi tiết",
      icon: "bx bx-show",
      onClick: handleViewDetail,
      className: "action-btn action-btn--view",
    },
    {
      label: "Xác nhận",
      icon: "bx bx-check-circle",
      onClick: handleConfirmOrder,
      className: "action-btn action-btn--confirm",
      condition: (order) => canConfirm(order),
    },
    {
      label: "Giao hàng",
      icon: "bx bx-package",
      onClick: handleShipOrder,
      className: "action-btn action-btn--ship",
      condition: (order) => canShip(order),
    },
    {
      label: "Hủy đơn",
      icon: "bx bx-x-circle",
      onClick: handleCancelOrderClick,
      className: "action-btn action-btn--cancel",
      condition: (order) => canCancel(order),
    },
  ];

  /* RENDER */
  return (
    <main className="main">
      <PageHeader
        title="Đơn hàng"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Đơn hàng", path: "/orders" },
        ]}
      />

      <div className="toolbar">
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Quản lý đơn hàng</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi các đơn hàng của bạn
            </p>
          </div>
        </div>

        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm đơn hàng..."
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="toolbar__filters">
            <div className="filter-group">
              <label className="filter-label">Trạng thái:</label>
              <select
                className="filter-select"
                value={statusFilter || ""}
                onChange={(e) =>
                  handleStatusFilterChange(e.target.value || null)
                }
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="processing">Đang chuẩn bị</option>
                <option value="shipped">Đang giao</option>
                <option value="delivered">Đã giao</option>
                <option value="cancelled">Đã hủy</option>
                <option value="returned">Trả hàng</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Từ ngày:</label>
              <input
                type="date"
                className="filter-input"
                value={dateFrom}
                onChange={(e) => handleDateRangeChange(e.target.value, dateTo)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Đến ngày:</label>
              <input
                type="date"
                className="filter-input"
                value={dateTo}
                onChange={(e) =>
                  handleDateRangeChange(dateFrom, e.target.value)
                }
              />
            </div>

            {(statusFilter || dateFrom || dateTo) && (
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  setStatusFilter(null);
                  setDateFrom("");
                  setDateTo("");
                  setCurrentPage(1);
                }}
              >
                <i className="bx bx-x btn__icon"></i>
                <span className="btn__text">Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="toolbar__alert alert alert-error">
            <span>{error}</span>
            <button onClick={clearError} className="alert-close">
              <X size={18} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="toolbar__alert alert alert-success">
            <Check size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {loading && <div className="toolbar__loading">Đang tải...</div>}

        <div className="toolbar__table">
          <Table columns={columns} data={orders} actions={actions} />
        </div>

        {totalPages > 1 && (
          <div className="toolbar__pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/*  MODALS  */}
      <OrderDetailModal
        isOpen={isDetailModalOpen}
        orderId={selectedOrderId}
        orderDetail={orderDetail}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrderId(null);
          clearOrderDetail();
        }}
        onConfirm={
          orderDetail && canConfirm(orderDetail)
            ? () => handleConfirmOrder(orderDetail)
            : null
        }
        onShip={
          orderDetail && canShip(orderDetail)
            ? () => handleShipOrder(orderDetail)
            : null
        }
        onCancel={
          orderDetail && canCancel(orderDetail)
            ? () => handleCancelOrderClick(orderDetail)
            : null
        }
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={getConfirmModalContent().title}
        message={getConfirmModalContent().message}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        order={orderToCancel}
        onConfirm={handleCancelConfirm}
        onCancel={() => {
          setIsCancelModalOpen(false);
          setOrderToCancel(null);
        }}
      />
    </main>
  );
}
