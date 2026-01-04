/*SIDEBAR MENU NAVIGATION: Xử lý active cho menu items*/
function initSidebarMenu() {
  const sidebarMenuLinks = document.querySelectorAll(".sidebar__menu-link");

  sidebarMenuLinks.forEach((link) => {
    const menuItem = link.parentElement;

    link.addEventListener("click", function (e) {
      // Nếu là menu có dropdown thì bỏ qua (để submenu tự xử lý)
      if (link.classList.contains("sidebar__menu-link--dropdown")) {
        return;
      }

      // Bỏ active của tất cả menu items
      document
        .querySelectorAll(".sidebar__menu-item--active")
        .forEach((item) => item.classList.remove("sidebar__menu-item--active"));

      // Thêm active cho item được click
      menuItem.classList.add("sidebar__menu-item--active");
    });
  });
}

/*SIDEBAR TOGGLE*/
function initSidebarToggle() {
  const menuToggleIcon = document.querySelector(".navbar__menu-icon");
  const sidebar = document.querySelector(".sidebar");

  if (menuToggleIcon && sidebar) {
    menuToggleIcon.addEventListener("click", function () {
      sidebar.classList.toggle("sidebar--collapsed");
    });
  }
}

/*KHỞI TẠO TẤT CẢ COMPONENTS*/
function initComponents() {
  initSidebarMenu();
  initSidebarToggle();
}
