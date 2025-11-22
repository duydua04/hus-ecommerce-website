import React from "react";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import "./PageHeader.scss";

const PageHeader = ({ title, breadcrumbs }) => {
  return (
    <div className="page-header">
      <h1 className="page-header__title">{title}</h1>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
    </div>
  );
};

export default PageHeader;
