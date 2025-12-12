import React, { useState } from "react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";

import "./Product.scss";

export default function ProductContent() {
  // Mock data sản phẩm
  const [products, setProducts] = useState([
    {
      id: 1,
      image: "../img/asus-rog-gaming-laptop.png",
      name: "ASUS ROG Gaming Laptop",
      category: "Laptop",
      rating: 4,
      price: "$2,199",
      weight: "2.5kg",
    },
    {
      id: 2,
      image: "../img/airpods-pro-2nd-gen.jpg",
      name: "Airpods Pro 2nd Gen",
      category: "Accessories",
      rating: 5,
      price: "$839",
      weight: "200g",
    },
    {
      id: 3,
      image: "../img/apple-watch-ultra.png",
      name: "Apple Watch Ultra",
      category: "Watch",
      rating: 4,
      price: "$1,579",
      weight: "80g",
    },
    {
      id: 4,
      image: "../img/samsung-galaxy-s23-ultra.png",
      name: "Samsung Galaxy S23 Ultra",
      category: "Phone",
      rating: 5,
      price: "$1,299",
      weight: "210g",
    },
    {
      id: 5,
      image: "../img/sony-wh-1000xm5.jpg",
      name: "Sony WH-1000XM5",
      category: "Audio",
      rating: 5,
      price: "$399",
      weight: "250g",
    },
    {
      id: 6,
      image: "../img/macbook-pro-16.jpg",
      name: "Macbook 16 Pro",
      category: "Laptop",
      rating: 5,
      price: "$1000",
      weight: "1.2kg",
    },
    {
      id: 7,
      image: "../img/dell-xps-15.jpg",
      name: "Dell XPS 13",
      category: "Laptop",
      rating: 4,
      price: "$999",
      weight: "1.2kg",
    },
    {
      id: 8,
      image: "../img/fitbit-charge-6.jpg",
      name: "Fitbit Charge 5",
      category: "Watch",
      rating: 4,
      price: "$149",
      weight: "30g",
    },
    {
      id: 9,
      image: "../img/son-playstation-5.jpg",
      name: "Sony PlayStation 5",
      category: "Accessories",
      rating: 5,
      price: "$499",
      weight: "4.5kg",
    },
    {
      id: 10,
      image: "../img/bose-quietcomfort-earbuds.webp",
      name: "Bose QuietComfort 35",
      category: "Audio",
      rating: 5,
      price: "$299",
      weight: "240g",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Filter theo tên sản phẩm
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(start, start + itemsPerPage);

  // Render stars rating
  const renderRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? "⭐" : "☆");
    }
    return stars.join("");
  };

  // Toolbar actions
  const handleAdd = () => {
    alert("Thêm sản phẩm (chưa implement)");
  };

  const handleView = (item) => {
    alert("Xem sản phẩm: " + item.name);
  };

  const handleEdit = (item) => {
    alert("Sửa sản phẩm: " + item.name);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Xóa sản phẩm ${item.name}?`)) {
      setProducts(products.filter((p) => p.id !== item.id));
    }
  };

  // Định nghĩa columns cho Table
  const columns = [
    {
      key: "image",
      label: "Hình ảnh",
      render: (value, item) => (
        <img src={value} alt={item.name} className="table__img" />
      ),
    },
    {
      key: "name",
      label: "Tên sản phẩm",
    },
    {
      key: "category",
      label: "Danh mục",
      hideMobile: true,
    },
    {
      key: "rating",
      label: "Đánh giá",
      render: (value) => renderRating(value),
      hideMobile: true,
    },
    {
      key: "price",
      label: "Giá",
      className: "table__cell--price",
    },
    {
      key: "weight",
      label: "Cân nặng",
      hideTablet: true,
    },
  ];

  // Định nghĩa actions cho Table
  const actions = [
    {
      label: "Xem",
      icon: "bx bx-show",
      onClick: handleView,
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
        title="Sản phẩm"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Sản phẩm", path: "/products" },
        ]}
      />

      {/* Toolbar */}
      <div className="toolbar">
        {/* Toolbar Header */}
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Danh sách sản phẩm</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi sản phẩm của cửa hàng
            </p>
          </div>

          <Button
            text="Thêm sản phẩm"
            icon="bx bx-plus"
            variant="primary"
            onClick={handleAdd}
          />
        </div>

        {/* Toolbar Actions - Search + Filter */}
        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset về trang 1 khi search
              }}
            />
          </div>
          <button className="toolbar__btn-filter btn btn--secondary">
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
