/*SIDEBAR MENU NAVIGATION: Xử lý active cho menu items*/

// Lấy tất cả menu links trong sidebar
const sidebarMenuLinks = document.querySelectorAll(".sidebar__menu-link");

// Thêm event listener cho mỗi menu link
sidebarMenuLinks.forEach((link) => {
  const menuItem = link.parentElement;
  link.addEventListener("click", function (e) {
    sidebarMenuLinks.forEach((item) => {
      item.parentElement.classList.remove("sidebar__menu-item--active");
    });
    menuItem.classList.add("sidebar__menu-item--active");
  });
});

/*SIDEBAR TOGGLE: Xử lý thu gọn, mở rộng sidebar*/
const menuToggleIcon = document.querySelector(".navbar__menu-icon");
const sidebar = document.querySelector(".sidebar");

// Xử lý khi click vào menu icon
if (menuToggleIcon && sidebar) {
  menuToggleIcon.addEventListener("click", function () {
    sidebar.classList.toggle("sidebar--collapsed");
  });
}

// tìm kiếm theo tên sản phẩm trong bảng
const searchInput = document.querySelector(".search-box__input");
const tableRows = document.querySelectorAll(".table__body .table__row");

searchInput.addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();

  tableRows.forEach((row) => {
    const name = row.cells[1].textContent.toLowerCase();
    row.style.display = name.includes(keyword) ? "" : "none";
  });
});

// nút thêm sản phẩm
const btnAdd = document.querySelector(".toolbar__btn-add");
btnAdd.addEventListener("click", () => {
  alert("Mở form thêm sản phẩm");
  // Form điền sản phẩm
});

// Lọc sản phẩm theo danh mục
const btnFilter = document.querySelector(".toolbar__btn-filter");
btnFilter.addEventListener("click", () => {
  const categories = [
    "Tất cả",
    "Laptop",
    "Phone",
    "Watch",
    "Audio",
    "Accessories",
  ];
  const selected = prompt("Chọn danh mục:\n" + categories.join(", "));

  if (!selected) return;

  tableRows.forEach((row) => {
    const category = row.cells[2].textContent;
    if (
      selected === "Tất cả" ||
      category.toLowerCase() === selected.toLowerCase()
    ) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});

// xem, sửa, xóa
const viewBtns = document.querySelectorAll(".action-btn--view");
const editBtns = document.querySelectorAll(".action-btn--edit");
const deleteBtns = document.querySelectorAll(".action-btn--delete");

// Xem chi tiết
viewBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const row = e.target.closest(".table__row");
    const name = row.cells[1].textContent;
    const category = row.cells[2].textContent;
    const review = row.cells[3].textContent;
    const price = row.cells[4].textContent;
    alert(
      `Sản phẩm: ${name}\nDanh mục: ${category}\nĐánh giá: ${review}\nGiá: ${price}`
    );
  });
});

// Sửa giá sản phẩm
editBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const row = e.target.closest(".table__row");
    const price = row.cells[4].textContent;
    const newPrice = prompt("Nhập giá mới:", price);

    if (newPrice && newPrice !== price) {
      row.cells[4].textContent = newPrice;
      alert("Đã cập nhật giá sản phẩm!");
    }
  });
});

// Xóa sản phẩm
deleteBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const row = e.target.closest(".table__row");
    const nameProduct = row.cells[1].textContent;

    if (confirm(`Bạn chắc chắn xóa "${nameProduct}"?`)) {
      row.style.opacity = "0";
      setTimeout(() => {
        row.remove();
        alert("Đã xóa sản phẩm thành công!");
      }, 300);
    }
  });
});

// phân trang
const paginationBtns = document.querySelectorAll(".pagination__btn");

paginationBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const icon = btn.querySelector(".pagination__icon");

    if (!icon) {
      // Nếu là số trang
      paginationBtns.forEach((b) =>
        b.classList.remove("pagination__btn--active")
      );
      btn.classList.add("pagination__btn--active");
      console.log(`Chuyển sang trang ${btn.textContent}`);
    } else {
      // Nếu là nút mũi tên (prev/next)
      const isNext = icon.classList.contains("bx-chevron-right");
      console.log(isNext ? "Trang tiếp theo" : "Trang trước");
    }
  });
});

// xem thông báo
const notification = document.querySelector(".navbar__notification");
notification.addEventListener("click", (e) => {
  e.preventDefault();
  alert("Bạn có 8 thông báo mới!");
});

// sắp xếp theo giá
const priceHeader = document.querySelectorAll(".table__header")[4];
let ascending = true;

priceHeader.style.cursor = "pointer";
priceHeader.title = "Click để sắp xếp theo giá";

priceHeader.addEventListener("click", () => {
  const tbody = document.querySelector(".table__body");
  const rows = Array.from(tableRows);

  rows.sort((a, b) => {
    const priceA = parseFloat(
      a.cells[4].textContent.replace("$", "").replace(",", "")
    );
    const priceB = parseFloat(
      b.cells[4].textContent.replace("$", "").replace(",", "")
    );
    return ascending ? priceA - priceB : priceB - priceA;
  });

  ascending = !ascending;
  rows.forEach((row) => tbody.appendChild(row));

  console.log(`Đã sắp xếp theo giá ${ascending ? "tăng dần" : "giảm dần"}`);
});

// console
console.log("SellerHub Demo");
console.log("Thu gọn/mở rộng sidebar");
console.log("Tìm kiếm và lọc sản phẩm");
console.log("Xem / Sửa / Xóa sản phẩm");
console.log("Phân trang và sắp xếp theo giá");
console.log("Thông báo navbar & tìm kiếm");
