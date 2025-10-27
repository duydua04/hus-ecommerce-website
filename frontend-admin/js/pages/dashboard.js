/*===============================================
  DASHBOARD.JS - Xử lý trang Dashboard
===============================================*/

function initDashboard() {
  console.log("Dashboard initialized!");

  // Xử lý riêng cho trang dashboard
  loadDashboardData();
  initDashboardCharts();
}

/*Load dữ liệu dashboard*/
function loadDashboardData() {
  // TODO: Fetch data từ API
  console.log("Loading dashboard data...");
}

/*Khởi tạo các biểu đồ*/
function initDashboardCharts() {
  // TODO: Khởi tạo Chart.js hoặc thư viện chart khác
  console.log("Initializing charts...");
}

// Tự động chạy nếu đang ở trang dashboard
if (document.querySelector(".page-dashboard")) {
  document.addEventListener("DOMContentLoaded", initDashboard);
}
