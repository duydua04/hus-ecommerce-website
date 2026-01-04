import React from "react";
import { useLocation } from "react-router-dom";
import "./Breadcrumb.scss";

const Breadcrumb = ({ items = [] }) => {
  const location = useLocation();

  return (
    <ul className="page-header__breadcrumb breadcrumb">
      {items.map((item, index) => {
        const isActive = location.pathname === item.path;

        return (
          <React.Fragment key={index}>
            <li className="breadcrumb__item">
              <a
                href={item.path}
                className={`breadcrumb__link ${
                  isActive ? "breadcrumb__link--active" : ""
                }`}
              >
                {item.label}
              </a>
            </li>

            {index < items.length - 1 && (
              <li className="breadcrumb__item">
                <i className="bx bx-chevron-right breadcrumb__separator"></i>
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ul>
  );
};

export default Breadcrumb;
