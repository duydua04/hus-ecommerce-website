import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";
import DiscountModal from "./AddDiscount/AddDiscount";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import useDiscount from "../../hooks/useDiscount";
import "../../assets/styles/page.scss";

export default function DiscountContent() {
  const {
    discounts,
    total,
    loading,
    error,
    fetchDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    setStatus,
    clearError,
  } = useDiscount();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const itemsPerPage = 10;

  /* FETCH DATA */
  useEffect(() => {
    fetchDiscounts({
      q: "",
      limit: itemsPerPage,
      offset: 0,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscounts({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  const totalPages = Math.ceil(total / itemsPerPage);

  /* HANDLERS */
  const handleAddDiscount = () => {
    clearError();
    setSuccessMessage("");
    setSelectedDiscount(null);
    setIsModalOpen(true);
  };

  const handleEditDiscount = (discount) => {
    clearError();
    setSuccessMessage("");
    setSelectedDiscount(discount);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedDiscount) {
        await updateDiscount(selectedDiscount.discount_id, formData);
        setSuccessMessage("Cập nhật mã giảm giá thành công");
      } else {
        await createDiscount(formData);
        setSuccessMessage("Thêm mã giảm giá thành công");
      }

      setIsModalOpen(false);
      setSelectedDiscount(null);

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchDiscounts({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error submit form:", err);
      throw err;
    }
  };

  const handleToggleStatus = async (discount) => {
    try {
      await setStatus(discount.discount_id, !discount.is_active);
      setSuccessMessage(
        `${discount.is_active ? "Tắt" : "Bật"} mã giảm giá thành công`
      );

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchDiscounts({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error toggle status:", err);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    setDiscountToDelete(discountId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!discountToDelete) return;

    try {
      await deleteDiscount(discountToDelete);
      setSuccessMessage("Xóa mã giảm giá thành công");

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchDiscounts({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error delete discount:", err);
    } finally {
      setIsConfirmModalOpen(false);
      setDiscountToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setDiscountToDelete(null);
  };

  /* TABLE */
  const columns = [
    {
      key: "code",
      label: "Mã giảm giá",
      render: (value) => <strong>{value}</strong>,
    },
    {
      key: "discount_percent",
      label: "Tỉ lệ giảm giá",
      render: (value) => `${value}%`,
    },
    {
      key: "min_order_value",
      label: "Đơn hàng tối thiểu",
      className: "table__cell--price",
      render: (value) =>
        value ? `${Number(value).toLocaleString("vi-VN")} ₫` : "0 ₫",
    },
    {
      key: "max_discount",
      label: "Max Discount",
      className: "table__cell--price",
      render: (value) =>
        value ? `${Number(value).toLocaleString("vi-VN")} ₫` : "Không giới hạn",
    },
    {
      key: "start_date",
      label: "Bắt đầu",
      render: (value) =>
        value ? new Date(value).toLocaleDateString("vi-VN") : "-",
    },
    {
      key: "end_date",
      label: "Kết thúc",
      render: (value) =>
        value ? new Date(value).toLocaleDateString("vi-VN") : "-",
    },
  ];

  const actions = [
    {
      label: "Sửa",
      icon: "bx bx-edit-alt",
      onClick: handleEditDiscount,
      className: "action-btn action-btn--edit",
    },
    {
      label: "Bật/Tắt",
      icon: "bx bx-toggle-left",
      onClick: handleToggleStatus,
      className: "action-btn action-btn--toggle",
    },
    {
      label: "Xóa",
      icon: "bx bx-trash",
      onClick: (d) => handleDeleteDiscount(d.discount_id),
      className: "action-btn action-btn--delete",
    },
  ];

  /* RENDER  */
  return (
    <main className="main">
      <PageHeader
        title="Mã giảm giá"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Mã giảm giá", path: "/discounts" },
        ]}
      />

      <div className="toolbar">
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Danh sách mã giảm giá</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi các mã giảm giá
            </p>
          </div>
          <Button
            text="Thêm mã giảm giá"
            icon="bx bx-plus"
            variant="primary"
            onClick={handleAddDiscount}
          />
        </div>

        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm mã giảm giá..."
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="toolbar__filter btn btn--secondary">
            <i className="bx bx-filter btn__icon"></i>
            <span className="btn__text">Lọc</span>
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
          <Table columns={columns} data={discounts} actions={actions} />
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

      {/*  MODALS  */}
      <DiscountModal
        key={selectedDiscount?.discount_id || "new"}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDiscount(null);
        }}
        onSubmit={handleFormSubmit}
        discount={selectedDiscount}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Thông báo"
        message="Bạn chắc chắn muốn xóa mã giảm giá này?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
}
