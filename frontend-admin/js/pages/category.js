/*XỬ LÝ TRANG DANH MỤC*/

function initCategory() {
  console.log("Category page initialized!");

  // Xử lý riêng cho trang category
  loadCategoryList();
  initCategorySearch();
  initCategoryActions();
}

/*Load danh sách categories*/
function loadCategoryList() {
  // TODO: Fetch categories từ API
  console.log("Loading categories...");
}

/*Xử lý tìm kiếm category*/
function initCategorySearch() {
  const searchInput = document.querySelector(
    ".toolbar__search .search-box__input"
  );

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const keyword = e.target.value.toLowerCase();
      console.log("Searching:", keyword);
      // TODO: Filter categories
    });
  }
}

/*Xử lý các nút hành động (Thêm, Sửa, Xóa)*/
function initCategoryActions() {
  // Nút Thêm mới
  const btnAdd = document.querySelector(".btn--primary");
  if (btnAdd) {
    btnAdd.addEventListener("click", function () {
      console.log("Add new category");
      // TODO: Mở modal thêm category
    });
  }

  // Nút Sửa
  document.querySelectorAll(".action-btn--edit").forEach((btn) => {
    btn.addEventListener("click", function () {
      console.log("Edit category");
      // TODO: Mở modal sửa category
    });
  });

  // Nút Xóa
  document.querySelectorAll(".action-btn--delete").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (confirm("Bạn có chắc muốn xóa?")) {
        console.log("Delete category");
        // TODO: Gọi API xóa
      }
    });
  });
}

// Tự động chạy nếu đang ở trang category
if (document.querySelector(".page-category")) {
  document.addEventListener("DOMContentLoaded", initCategory);
}
