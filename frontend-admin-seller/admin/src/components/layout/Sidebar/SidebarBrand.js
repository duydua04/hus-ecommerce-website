import { Link } from "react-router-dom";
import "./SidebarBrand.scss";

const SidebarBrand = () => {
  return (
    <Link to="/dashboard" className="sidebar__brand">
      <img src="/logo.png" alt="FASTBUY" className="sidebar__brand-icon" />
      <span className="sidebar__brand-text">Fastbuy</span>
    </Link>
  );
};

export default SidebarBrand;
