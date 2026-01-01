import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/seller/dashboard`,
  withCredentials: true,
});

const request = async (fn) => {
  try {
    const res = await fn();
    return res.data;
  } catch (e) {
    if (e.response) {
      const { status, data } = e.response;

      // Thêm xử lý 401/403
      if (status === 401 || status === 403) {
        window.location.href = "/login"; // Hoặc dùng router
      }

      throw {
        detail: data?.detail,
        status,
        message: data?.message || "Lỗi không xác định",
      };
    }
    throw { detail: "Không thể kết nối server" };
  }
};

const dashboardService = {
  getStats: () => request(() => api.get("/stats")),
  getChart: (view = "monthly") =>
    request(() => api.get("/chart", { params: { view } })),
  getTopProducts: () => request(() => api.get("/top-products")),
};

export default dashboardService;
