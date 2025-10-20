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
//
