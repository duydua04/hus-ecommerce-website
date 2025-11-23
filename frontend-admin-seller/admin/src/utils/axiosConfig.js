import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// DEBUG: Log để kiểm tra API_URL
console.log("🔧 Axios Config - API URL:", API_URL);

// Tạo axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, //
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag để tránh refresh token nhiều lần đồng thời
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Tự động refresh token khi 401
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      // Redirect về login nếu refresh token hết hạn
      localStorage.removeItem("userRole");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return axiosInstance(originalRequest); // Retry request sau khi refresh xong
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axiosInstance.post("/auth/refresh");
      // Backend đã set cookies mới -> không cần lưu gì
      isRefreshing = false;
      processQueue(null);
      // Retry request ban đầu với token mới (tự động lấy từ cookies)
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Refresh token hết hạn hoặc invalid -> logout
      isRefreshing = false;
      processQueue(refreshError, null);
      localStorage.removeItem("userRole");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
