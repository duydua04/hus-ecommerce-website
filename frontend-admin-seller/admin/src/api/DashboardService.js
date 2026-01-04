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
  // Lấy tổng quan: buyers, sellers, orders, revenue
  getSummary: () =>
    request(() => axiosInstance.get("/admin/dashboard/summary")),

  // Top buyers theo orders hoặc revenue
  getTopBuyers: (criteria = "orders") =>
    request(() =>
      axiosInstance.get("/admin/dashboard/top-buyers", {
        params: { criteria },
      })
    ),

  // Top sellers theo orders hoặc revenue
  getTopSellers: (criteria = "orders") =>
    request(() =>
      axiosInstance.get("/admin/dashboard/top-sellers", {
        params: { criteria },
      })
    ),

  // Top categories theo sold hoặc revenue
  getTopCategories: (criteria = "sold") =>
    request(() =>
      axiosInstance.get("/admin/dashboard/top-categories", {
        params: { criteria },
      })
    ),

  // Thống kê carriers
  getCarriers: () =>
    request(() => axiosInstance.get("/admin/dashboard/carriers")),

  // Sync dữ liệu từ DB sang Redis
  syncData: () =>
    request(() => axiosInstance.post("/admin/dashboard/sync-data")),
};

export default dashboardService;
