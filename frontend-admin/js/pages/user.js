/*===============================================
  USER.JS - Xử lý trang Người dùng
===============================================*/

function initUser() {
  console.log("👤 User page initialized!");

  // Xử lý riêng cho trang user
  loadUserList();
  initUserSearch();
  initUserActions();
  initUserPagination();
}

/*Load danh sách users*/
function loadUserList() {
  // TODO: Fetch users từ API
  console.log("Loading users...");
}

/*Xử lý tìm kiếm user*/
function initUserSearch() {
  const searchInput = document.querySelector(".toolbar__search .search-box__input");
  
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const keyword = e.target.value.toLowerCase();
      console.log("Searching users:", keyword);
      // TODO: Filter users
    });
  }
}

/*Xử lý các nút hành động (Thêm, Xem, Sửa, Xóa)*/
function initUserActions() {
  // Nút Thêm mới
  const btnAdd = document.querySelector(".btn--primary");
  if (btnAdd) {
    btnAdd.addEventListener("click", function () {
      console.log("Add new user");
      // TODO: Mở modal thêm user
    });
  }

  // Nút Xem chi tiết
  document.querySelectorAll(".action-btn--view").forEach((btn) => {
    btn.addEventListener("click", function () {
      console.log("View user details");
      // TODO: Mở modal xem chi tiết
    });
  });

  // Nút Sửa
  document.querySelectorAll(".action-btn--edit").forEach((btn) => {
    btn.addEventListener("click", function () {
      console.log("Edit user");
      // TODO: Mở modal sửa user
    });
  });

  // Nút Xóa
  document.querySelectorAll(".action-btn--delete").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (confirm("Bạn có chắc muốn xóa người dùng này?")) {
        console.log("Delete user");
        // TODO: Gọi API xóa
      }
    });
  });
}

/*Xử lý phân trang*/
function initUserPagination() {
  document.querySelectorAll(".pagination__btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (!this.classList.contains("pagination__btn--active")) {
        const page = this.textContent;
        console.log("Go to page:", page);
        // TODO: Load trang mới
      }
    });
  });
}

// Tự động chạy nếu đang ở trang user
if (document.querySelector(".page-user")) {
  document.addEventListener("DOMContentLoaded", initUser);
}