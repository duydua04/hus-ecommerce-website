// api/DashboardService.js
import axiosInstance from "../utils/axiosConfig";

const request = async (fn) => {
  try {
    const res = await fn();
    return res.data;
  } catch (e) {
    if (e.response) {
      const { status, data } = e.response;
      throw {
        detail: data?.detail || data?.message || "Lỗi không xác định",
        status,
      };
    }
    throw { detail: "Không thể kết nối server" };
  }
};

const dashboardService = {
  getStats: () => request(() => axiosInstance.get("/seller/dashboard/stats")),

  getChart: (view = "monthly") =>
    request(() =>
      axiosInstance.get("/seller/dashboard/chart", { params: { view } })
    ),

  getTopProducts: () =>
    request(() => axiosInstance.get("/seller/dashboard/top-products")),

  syncDashboard: () =>
    request(() => axiosInstance.post("/seller/dashboard/sync")),
};

export default dashboardService;
