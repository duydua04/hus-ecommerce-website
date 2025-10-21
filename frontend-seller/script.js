console.log("SellerHub Demo");
console.log("Thu gọn/mở rộng sidebar");
console.log("Tìm kiếm và lọc sản phẩm");
console.log("Xem, sửa, xóa sản phẩm");
console.log("Thông báo navbar & tìm kiếm");

/*ĐIỂU HƯỚNG CHO SIDEBAR*/
const sidebarMenuLinks = document.querySelectorAll(".sidebar__menu-link"); //lấy tất cả link có trong sidebar, trả về 1 list gồm các link
sidebarMenuLinks.forEach((link) => {
  //duyệt list
  const menuItem = link.parentElement; // lấy phần tử cha của link
  link.addEventListener("click", () => {
    // gán sự kiện cho link, khi người dùng click vào link:
    sidebarMenuLinks.forEach((item) => {
      item.parentElement.classList.remove("sidebar__menu-item--active"); // bỏ đi class active ở phần tử cha để đảm bảo chỉ có một menu item active tại 1 thời điểm
    });
    menuItem.classList.add("sidebar__menu-item--active"); //thêm class active vào item vừa click
  });
});

/*THU GỌN, MỞ RỘNG SIDEBAR*/
const menuToggleIcon = document.querySelector(".navbar__menu-icon"); //lấy nút menu dịch chuyển
const sidebar = document.querySelector(".sidebar"); //lấy phần tử sidebar => muốn thu gọn hoặc mở rộng

if (menuToggleIcon && sidebar) {
  //nếu cả 2 tồn tại
  menuToggleIcon.addEventListener("click", () => {
    //gắn sự kiện click cho icon toggle
    sidebar.classList.toggle("sidebar--collapsed"); // classList.toggle() có 2 chức năng: nếu sidebar chưa có class collapsed thì thêm, nếu có rồi thì bỏ đi
  });
}

/*TÌM KIẾM THEO TÊN CỦA SẢN PHẨM*/
const searchInput = document.querySelector(".search-box__input"); //lấy ô tìm kiếm sản phẩm
const tableRows = document.querySelectorAll(".table__body .table__row"); //lấy tất cả các hàng trong bảng => lọc và hiển thị dựa trên từ khóa

searchInput.addEventListener("input", (e) => {
  //sự kiện input => người dùng gõ hoặc xóa ký tự thì hàm bên trong sẽ hoạt động
  const keyword = e.target.value.toLowerCase(); //lấy giá trị trong ô input

  tableRows.forEach((row) => {
    const name = row.cells[1].textContent.toLowerCase();
    row.style.display = name.includes(keyword) ? "" : "none"; // nếu tên sản phẩm bao gồm từ khóa => hiển thị
  });
});

/*LỌC SẢN PHẨM THEO DANH MỤC*/
const btnFilter = document.querySelector(".toolbar__btn-filter"); //lấy nút filter => người dùng click vào để lọc sản phẩm
btnFilter.addEventListener("click", () => {
  const categories = [
    "Tất cả",
    "Laptop",
    "Phone",
    "Watch",
    "Audio",
    "Accessories",
  ];
  //hiển thị hộp thoại prompt để người dùng nhập danh mục muốn lọc
  const selected = prompt("Chọn danh mục:\n" + categories.join(", "));

  if (!selected) return;

  tableRows.forEach((row) => {
    const category = row.cells[2].textContent; //lấy cột danh mục
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

/*XEM, SỬA, XÓA*/
const viewBtns = document.querySelectorAll(".action-btn--view"); //lấy nút xem chi tiết
const editBtns = document.querySelectorAll(".action-btn--edit"); //lấy nút chỉnh sửa
const deleteBtns = document.querySelectorAll(".action-btn--delete"); //lấy nút xóa

// Xem chi tiết
viewBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    //sự kiện click
    const row = e.target.closest(".table__row"); //tìm hàng gần nhất chứa nút đó => dữ liệu tương ứng với nút vừa click
    const name = row.cells[1].textContent;
    const category = row.cells[2].textContent;
    const review = row.cells[3].textContent;
    const price = row.cells[4].textContent;
    //popup hiên chi tiết sản phẩm
    alert(
      `Sản phẩm: ${name}\nDanh mục: ${category}\nĐánh giá: ${review}\nGiá: ${price}`
    );
  });
});

// Sửa giá sản phẩm
editBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const row = e.target.closest(".table__row"); //tìm hàng chứa nút đó
    const price = row.cells[4].textContent; //lấy giá hiện tại của sản phẩm
    const newPrice = prompt("Nhập giá mới:", price); //hiển thị prompt để người dùng nhập giá mới

    if (newPrice && newPrice !== price) {
      row.cells[4].textContent = newPrice;
      alert("Đã cập nhật giá sản phẩm!");
    }
  });
});

// Xóa sản phẩm
deleteBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    //sự kiện click
    const row = e.target.closest(".table__row"); //lấy hàng chứa nút đó
    const nameProduct = row.cells[1].textContent; //lấy tên sản phẩm

    //nếu người dùng đồng ý, tạp hiệu ứng mờ dần với thời gian là 300ms
    if (confirm(`Bạn chắc chắn xóa "${nameProduct}"?`)) {
      row.style.opacity = "0";
      setTimeout(() => {
        row.remove();
        alert("Đã xóa sản phẩm thành công!");
      }, 300);
    }
  });
});
