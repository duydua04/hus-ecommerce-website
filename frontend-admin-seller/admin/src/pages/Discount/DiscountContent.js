import React, { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";

import "./Discount.scss";

export default function DiscountContent() {
  // Mock data (chưa gọi API)
  const [discounts, setDiscounts] = useState([
    {
      code: "ABC123",
      rate: 10,
      minOrder: 100000,
      maxDiscount: 100000,
      startDate: "27/09/2025",
      endDate: "30/09/2025",
    },
    {
      code: "MNP123",
      rate: 50,
      minOrder: 50000,
      maxDiscount: 1000000,
      startDate: "27/09/2025",
      endDate: "29/10/2025",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Filter
  const filtered = discounts.filter((d) =>
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(start, start + itemsPerPage);

  // Toolbar actions
  const handleAdd = () => {
    alert("Thêm mã giảm giá (chưa implement)");
  };

  const handleEdit = (item) => {
    alert("Sửa mã: " + item.code);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Xóa mã ${item.code}?`)) {
      setDiscounts(discounts.filter((d) => d.code !== item.code));
    }
  };

  const columns = [
    { key: "code", label: "Mã giảm giá" },
    {
      key: "rate",
      label: "Tỉ lệ giảm giá",
      render: (v) => v + "%",
    },
    {
      key: "minOrder",
      label: "Đơn hàng tối thiểu",
      render: (v) => v.toLocaleString("vi-VN") + "đ",
      hideMobile: true,
    },
    {
      key: "maxDiscount",
      label: "Max Discount",
      render: (v) => v.toLocaleString("vi-VN") + "đ",
      hideMobile: true,
    },
    { key: "startDate", label: "Bắt đầu" },
    { key: "endDate", label: "Kết thúc" },
  ];

  const actions = [
    {
      label: "Xem",
      icon: "bx bx-show",
      onClick: (i) => alert("Xem " + i.code),
      className: "action-btn action-btn--view",
    },
    {
      label: "Sửa",
      icon: "bx bx-edit",
      onClick: handleEdit,
      className: "action-btn action-btn--edit",
    },
    {
      label: "Xóa",
      icon: "bx bx-trash",
      onClick: handleDelete,
      className: "action-btn action-btn--delete",
    },
  ];

  return (
    <main className="main">
      <PageHeader
        title="Giảm giá"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Giảm giá", path: "/discount" },
        ]}
      />

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Danh sách mã giảm giá</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi các mã giảm giá của cửa hàng
            </p>
          </div>

          <Button
            text="Thêm mã"
            icon="bx bx-plus"
            variant="primary"
            onClick={handleAdd}
          />
        </div>

        {/* Search + Filter */}
        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm mã..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="toolbar__filter btn btn--secondary">
            <i className="bx bx-filter btn__icon"></i>
            <span className="btn__text">Lọc</span>
          </button>
        </div>

        {/* Table */}
        <div className="toolbar__table">
          <Table columns={columns} data={currentItems} actions={actions} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="toolbar__pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </main>
  );
}
