import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

console.log("Axios Config - API URL:", API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Set Content-Type có điều kiện
axiosInstance.interceptors.request.use(
  (config) => {
    // Chỉ set Content-Type cho non-FormData requests
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Quản lý refresh token queue
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

// Auto refresh token khi 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      localStorage.removeItem("userRole");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosInstance(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axiosInstance.post("/auth/refresh");
      isRefreshing = false;
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError, null);
      localStorage.removeItem("userRole");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
