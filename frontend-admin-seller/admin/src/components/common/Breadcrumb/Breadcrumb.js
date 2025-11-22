import React from "react";
import "./Breadcrumb.scss";

const Breadcrumb = ({ items = [] }) => {
  return (
    <ul className="page-header__breadcrumb breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <li className="breadcrumb__item">
            <a
              href={item.href}
              className={`breadcrumb__link ${
                item.isActive ? "breadcrumb__link--active" : ""
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
      ))}
    </ul>
  );
};

export default Breadcrumb;
