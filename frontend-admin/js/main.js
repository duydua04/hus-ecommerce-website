/*MAIN.JS - File khởi chạy chính của ứng dụng*/

/*Chờ DOM load xong rồi mới chạy*/
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 App initialized!");

  // Khởi tạo tất cả components
  if (typeof initComponents === "function") {
    initComponents();
  }

  // Khởi tạo các trang cụ thể (nếu có)
  // initDashboard();
  // initCategory();
  // initUser();
});

/*Xử lý chung cho toàn app (nếu cần)*/

// Hiển thị loading khi chuyển trang
function showLoading() {
  console.log("Loading...");
}

// Ẩn loading
function hideLoading() {
  console.log("Loaded!");
}

// Hiển thị thông báo toast
function showToast(message, type = "info") {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Có thể tích hợp thư viện toast như Toastify.js
}
