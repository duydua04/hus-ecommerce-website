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

/*SIDEBAR SUBMENU: Xử lý dropdown submenu*/
function initSidebarSubmenu() {
  document.querySelectorAll(".sidebar__menu-link--dropdown").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault(); // chặn chuyển trang

      const menuItem = this.parentElement;
      const submenu = menuItem.querySelector(".sidebar__submenu");

      // Nếu menu này đang mở -> đóng lại
      if (menuItem.classList.contains("sidebar__menu-item--active")) {
        submenu.style.maxHeight = null;
        menuItem.classList.remove("sidebar__menu-item--active");
      } else {
        // Đóng tất cả submenu khác
        document
          .querySelectorAll(".sidebar__menu-item--active")
          .forEach((item) => {
            item.classList.remove("sidebar__menu-item--active");
            const sub = item.querySelector(".sidebar__submenu");
            if (sub) sub.style.maxHeight = null;
          });

        // Mở submenu hiện tại
        submenu.style.maxHeight = submenu.scrollHeight + "px";
        menuItem.classList.add("sidebar__menu-item--active");
      }
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
  initSidebarSubmenu();
}
