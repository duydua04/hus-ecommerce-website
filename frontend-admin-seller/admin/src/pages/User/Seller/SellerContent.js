import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Table from "../../../components/common/Table/Table";
import Pagination from "../../../components/common/Pagination/Pagination";
import SearchBox from "../../../components/common/SearchBox/SearchBox";
import ConfirmModal from "../../../components/common/ConfirmModal/ConfirmModal";
import useSeller from "../../../hooks/userSeller";

import "../../../assets/styles/page.scss";

import defaultAvatar from "../../../assets/images/default-avatar-seller.png";
const DEFAULT_AVATAR = defaultAvatar;

export default function SellerContent() {
  const {
    sellers,
    total,
    loading,
    error,
    fetchSellers,
    deleteSeller,
    clearError,
  } = useSeller();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const itemsPerPage = 10;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSellers({
        q: searchQuery,
        active_only: activeOnly,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, activeOnly]);

  const totalPages = Math.ceil(total / itemsPerPage);

  /* ================= HANDLERS ================= */
  const handleDeleteSeller = (sellerId) => {
    setSellerToDelete(sellerId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sellerToDelete) return;

    try {
      await deleteSeller(sellerToDelete);
      setSuccessMessage("Vô hiệu hóa seller thành công");

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchSellers({
        q: searchQuery,
        active_only: activeOnly,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error delete seller:", err);
    } finally {
      setIsConfirmModalOpen(false);
      setSellerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setSellerToDelete(null);
  };

  /* ================= TABLE ================= */
  // Avatar	Tên cửa hàng	Số điện thoại	email	Đánh giá trung bình	Thứ hạng Hành động
  const columns = [
    {
      key: "avt_url",
      label: "Avatar",
      className: "table__cell--avatar",
      render: (value) => (
        <img
          src={value || DEFAULT_AVATAR}
          alt="Seller avatar"
          className="table__img"
          onError={(e) => {
            e.target.src = DEFAULT_AVATAR;
          }}
        />
      ),
    },
    {
      key: "shop_name",
      label: "Tên shop",
      className: "table__cell--name",
    },
    {
      key: "email",
      label: "Email",
      className: "table__cell--email",
    },
    {
      key: "phone",
      label: "Số điện thoại",
      className: "table__cell--phone",
    },
    {
      key: "seller_tier",
      label: "Thứ hạng",
      className: "table__cell--tier",
      render: (v) => (
        <span className={`tier-badge tier-badge--${v || "basic"}`}>
          {v || "Basic"}
        </span>
      ),
    },
    {
      key: "average_rating",
      label: "Đánh giá",
      className: "table__cell--rating",
      render: (v, row) => (
        <div className="rating">
          <span className="rating__score">{v ? v.toFixed(1) : "N/A"}</span>
          <span className="rating__count">({row.rating_count || 0})</span>
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Trạng thái",
      className: "table__cell--status",
      render: (v) => (
        <span
          className={`status-badge ${
            v ? "status-badge--active" : "status-badge--inactive"
          }`}
        >
          {v ? "Hoạt động" : "Đã khóa"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Vô hiệu hóa",
      icon: "bx bx-lock",
      onClick: (s) => handleDeleteSeller(s.seller_id),
      className: "action-btn action-btn--delete",
    },
  ];

  /* ================= RENDER ================= */
  return (
    <main className="main">
      <PageHeader
        title="Người bán"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Seller", path: "/admin/sellers" },
        ]}
      />

      <div className="toolbar">
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Danh sách cửa hàng</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi các cửa hàng
            </p>
          </div>
        </div>

        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm cửa hàng..."
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            className={`toolbar__filter btn ${
              activeOnly ? "btn--primary" : "btn--secondary"
            }`}
            onClick={() => {
              setActiveOnly(!activeOnly);
              setCurrentPage(1);
            }}
          >
            <i className="bx bx-filter btn__icon"></i>
            <span className="btn__text">
              {activeOnly ? "Đang hoạt động" : "Tất cả"}
            </span>
          </button>
        </div>

        {error && (
          <div className="toolbar__alert alert alert-error">
            <span>{error}</span>
            <button onClick={clearError} className="alert-close">
              <X size={18} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="toolbar__alert alert alert-success">
            <Check size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {loading && <div className="toolbar__loading">Đang tải...</div>}

        <div className="toolbar__table">
          <Table columns={columns} data={sellers} actions={actions} />
        </div>

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

      {/* ===== CONFIRM MODAL ===== */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Thông báo"
        message="Bạn chắc chắn muốn vô hiệu hóa tài khoản này?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
}
