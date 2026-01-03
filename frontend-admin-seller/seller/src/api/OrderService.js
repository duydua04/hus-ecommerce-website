import axiosInstance from "../utils/axiosConfig";

const ORDERS_ENDPOINT = "/seller/orders";

const orderService = {
  /* Lay danh sach don hang */
  listOrders: async ({
    status = null,
    date_from = null,
    date_to = null,
    page = 1,
    limit = 10,
  } = {}) => {
    try {
      const params = { page, limit };

      if (status) params.status = status;
      if (date_from) params.date_from = date_from;
      if (date_to) params.date_to = date_to;

      const response = await axiosInstance.get(ORDERS_ENDPOINT, { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          detail: error.response.data?.detail || "Lỗi từ server",
          status: error.response.status,
        };
      } else if (error.request) {
        throw { detail: "Không thể kết nối đến server" };
      } else {
        throw { detail: error.message };
      }
    }
  },

  /* lay chi tiet don hang*/
  getOrderDetail: async (orderId) => {
    try {
      const response = await axiosInstance.get(`${ORDERS_ENDPOINT}/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /*Xac nhan don hang: pending => processing */
  confirmOrder: async (orderId) => {
    try {
      const response = await axiosInstance.put(
        `${ORDERS_ENDPOINT}/${orderId}/confirm`,
        {}
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /* danh dau da giao don cho Don vi can chuyen: processing => shipped */
  shipOrder: async (orderId) => {
    try {
      const response = await axiosInstance.put(
        `${ORDERS_ENDPOINT}/${orderId}/ship`,
        {}
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /* huy don hang va hoan kho */
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await axiosInstance.put(
        `${ORDERS_ENDPOINT}/${orderId}/cancel`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },
};

export default orderService;
