import { useState, useCallback } from "react";
import orderService from "../api/OrderService";

const useOrder = () => {
  const [orders, setOrders] = useState([]);
  const [orderDetail, setOrderDetail] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* Load danh sach don hang voi filter va phan trang*/
  const fetchOrders = useCallback(
    async ({
      status = null,
      date_from = null,
      date_to = null,
      page = 1,
      limit = 10,
    } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const res = await orderService.listOrders({
          status,
          date_from,
          date_to,
          page,
          limit,
        });

        if (res?.data && Array.isArray(res.data)) {
          setOrders(res.data);
          setPagination({
            total: res.meta?.total ?? 0,
            limit: res.meta?.limit ?? limit,
            offset: res.meta?.offset ?? 0,
          });
        } else {
          setOrders([]);
          setPagination({ total: 0, limit, offset: 0 });
        }

        return res;
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi tải danh sách đơn hàng");
        setOrders([]);
        setPagination({ total: 0, limit, offset: 0 });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* xem chi tiet don hang */
  const fetchOrderDetail = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await orderService.getOrderDetail(orderId);
      setOrderDetail(data);
      return data;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi tải chi tiết đơn hàng");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* Xac nhan don hang: pending => processing */
  const confirmOrder = useCallback(
    async (orderId) => {
      setLoading(true);
      setError(null);

      try {
        const result = await orderService.confirmOrder(orderId);

        // Cập nhật local state nếu đang xem detail
        if (orderDetail && orderDetail.order_id === orderId) {
          setOrderDetail({
            ...orderDetail,
            order_status: result.status || "processing",
            payment_status: result.payment_status,
          });
        }

        // Cập nhật trong danh sách orders
        setOrders((prev) =>
          prev.map((order) =>
            order.order_id === orderId
              ? {
                  ...order,
                  order_status: result.status || "processing",
                  payment_status: result.payment_status,
                }
              : order
          )
        );

        return result;
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi xác nhận đơn hàng");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [orderDetail]
  );

  /* danh dau don da giao cho don vi van chuyen: processing => shipped*/
  const shipOrder = useCallback(
    async (orderId) => {
      setLoading(true);
      setError(null);

      try {
        const result = await orderService.shipOrder(orderId);

        // Cập nhật local state
        if (orderDetail && orderDetail.order_id === orderId) {
          setOrderDetail({
            ...orderDetail,
            order_status: result.status || "shipped",
            delivery_date: new Date().toISOString(),
          });
        }

        setOrders((prev) =>
          prev.map((order) =>
            order.order_id === orderId
              ? { ...order, order_status: result.status || "shipped" }
              : order
          )
        );

        return result;
      } catch (err) {
        setError(
          err.detail || err.message || "Lỗi khi cập nhật trạng thái giao hàng"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [orderDetail]
  );

  /* huy don hang va hoan kho */
  const cancelOrder = useCallback(
    async (orderId, reason) => {
      if (!reason || reason.trim() === "") {
        const err = { detail: "Vui lòng nhập lý do hủy đơn" };
        setError(err.detail);
        throw err;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await orderService.cancelOrder(orderId, reason);

        // Cập nhật local state
        if (orderDetail && orderDetail.order_id === orderId) {
          setOrderDetail({
            ...orderDetail,
            order_status: result.status || "cancelled",
            notes: orderDetail.notes
              ? `${orderDetail.notes} | [Shop Cancel]: ${reason}`
              : `[Shop Cancel]: ${reason}`,
          });
        }

        setOrders((prev) =>
          prev.map((order) =>
            order.order_id === orderId
              ? { ...order, order_status: result.status || "cancelled" }
              : order
          )
        );

        return result;
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi hủy đơn hàng");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [orderDetail]
  );

  /**
   * Clear order detail
   */
  const clearOrderDetail = useCallback(() => {
    setOrderDetail(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /* Kiem tra trang thai don hang de thuc hien duoc action hay khong*/
  const canConfirm = useCallback((order) => {
    return order?.order_status === "pending";
  }, []);

  const canShip = useCallback((order) => {
    return order?.order_status === "processing";
  }, []);

  const canCancel = useCallback((order) => {
    return ["pending", "processing"].includes(order?.order_status);
  }, []);

  return {
    // State
    orders,
    orderDetail,
    pagination,
    loading,
    error,

    // Actions
    fetchOrders,
    fetchOrderDetail,
    confirmOrder,
    shipOrder,
    cancelOrder,
    clearOrderDetail,
    clearError,

    // Helpers
    canConfirm,
    canShip,
    canCancel,
  };
};

export default useOrder;
