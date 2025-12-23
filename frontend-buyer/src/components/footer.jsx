import React from "react";
import "./footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">

          {/* Về Shop */}
          <div className="footer__column">
            <h4 className="footer__column-title">Công việc</h4>
            <ul className="footer__list">
              <li className="footer__list-item"><a href="#" className="footer__link">Giới thiệu</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Tuyển dụng</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Chính sách bảo mật</a></li>
            </ul>
          </div>

          {/* Hỗ trợ khách hàng */}
          <div className="footer__column">
            <h4 className="footer__column-title">Hỗ trợ</h4>
            <ul className="footer__list">
              <li className="footer__list-item"><a href="#" className="footer__link">Trung tâm trợ giúp</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Hướng dẫn mua hàng</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Trạng thái đơn hàng</a></li>
            </ul>
          </div>

          {/* Danh mục phổ biến */}
          <div className="footer__column">
            <h4 className="footer__column-title">Danh mục</h4>
            <ul className="footer__list">
              <li className="footer__list-item"><a href="#" className="footer__link">Điện thoại</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Laptop</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Phụ kiện</a></li>
            </ul>
          </div>

          {/* Chính sách */}
          <div className="footer__column">
            <h4 className="footer__column-title">Chính sách</h4>
            <ul className="footer__list">
              <li className="footer__list-item"><a href="#" className="footer__link">Chính sách đổi trả</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Chính sách vận chuyển</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Điều khoản sử dụng</a></li>
            </ul>
          </div>

          {/* Liên kết xã hội */}
          <div className="footer__column">
            <h4 className="footer__column-title">Kết nối</h4>
            <ul className="footer__list">
              <li className="footer__list-item"><a href="#" className="footer__link">Facebook</a></li>
              <li className="footer__list-item"><a href="#" className="footer__link">Google</a></li>
            </ul>
          </div>
        </div>

        <hr className="footer__divider" />

        <div className="footer__bottom">
          <p>&Copyright © {currentYear} - 2027 DTHN.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;