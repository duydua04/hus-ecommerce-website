import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";
import CarrierModal from "./AddCarrier/AddCarrier";
import AvatarUploadModal from "../../components/common/AvatarUpload/AvatarUpload";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import useCarrier from "../../hooks/useCarrier";
import "../../assets/styles/page.scss";

// Avatar mặc định
import defaultAvatar from "../../assets/images/default-avatar.png";
const DEFAULT_AVATAR = defaultAvatar;

export default function TransportContent() {
  const {
    carriers,
    total,
    loading,
    error,
    fetchCarriers,
    createCarrier,
    updateCarrier,
    deleteCarrier,
    uploadCarrierAvatar,
    clearError,
  } = useCarrier();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const itemsPerPage = 10;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchCarriers({
      q: "",
      limit: itemsPerPage,
      offset: 0,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCarriers({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  const totalPages = Math.ceil(total / itemsPerPage);

  /* ================= HANDLERS ================= */
  const handleAddCarrier = () => {
    clearError();
    setSuccessMessage("");
    setSelectedCarrier(null);
    setIsModalOpen(true);
  };

  const handleEditCarrier = (carrier) => {
    clearError();
    setSuccessMessage("");
    setSelectedCarrier(carrier);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedCarrier) {
        await updateCarrier(selectedCarrier.carrier_id, formData);
        setSuccessMessage("Cập nhật đơn vị vận chuyển thành công");
      } else {
        await createCarrier(formData);
        setSuccessMessage("Thêm đơn vị vận chuyển thành công");
      }

      setIsModalOpen(false);
      setSelectedCarrier(null);

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchCarriers({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error submit form:", err);
    }
  };

  const handleDeleteCarrier = async (carrierId) => {
    setCarrierToDelete(carrierId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!carrierToDelete) return;

    try {
      await deleteCarrier(carrierToDelete);
      setSuccessMessage("Xóa đơn vị vận chuyển thành công");

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchCarriers({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error delete carrier:", err);
    } finally {
      setIsConfirmModalOpen(false);
      setCarrierToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setCarrierToDelete(null);
  };

  const handleAvatarUpload = async (carrierId, file) => {
    try {
      await uploadCarrierAvatar(carrierId, file);

      setIsAvatarModalOpen(false);
      setSelectedCarrierId(null);

      setSuccessMessage("Tải lên avatar thành công");
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchCarriers({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error upload avatar:", err);
    }
  };

  /* ================= TABLE ================= */
  const columns = [
    {
      key: "carrier_avt_url",
      label: "Avatar",
      className: "table__cell--avatar",
      render: (value, row) => (
        <img
          src={value || DEFAULT_AVATAR}
          alt="Carrier avatar"
          className="table__img table__img--clickable"
          title="Click để cập nhật avatar"
          onClick={() => {
            setSelectedCarrierId(row.carrier_id);
            setIsAvatarModalOpen(true);
          }}
          onError={(e) => {
            e.target.src = DEFAULT_AVATAR;
          }}
        />
      ),
    },
    {
      key: "carrier_name",
      label: "Tên đơn vị",
      className: "table__cell--name",
    },
    {
      key: "base_price",
      label: "Giá cơ bản",
      className: "table__cell--price",
      render: (v) => `${Number(v).toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "price_per_kg",
      label: "Giá/kg",
      className: "table__cell--price",
      render: (v) => `${Number(v).toLocaleString("vi-VN")} ₫`,
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
          {v ? "Hoạt động" : "Tạm dừng"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Sửa",
      icon: "bx bx-edit-alt",
      onClick: handleEditCarrier,
      className: "action-btn action-btn--edit",
    },
    {
      label: "Xóa",
      icon: "bx bx-trash",
      onClick: (c) => handleDeleteCarrier(c.carrier_id),
      className: "action-btn action-btn--delete",
    },
  ];

  /* ================= RENDER ================= */
  return (
    <main className="main">
      <PageHeader
        title="Vận chuyển"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Vận chuyển", path: "/transport" },
        ]}
      />

      <div className="toolbar">
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Đơn vị vận chuyển</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi các đơn vị vận chuyển
            </p>
          </div>
          <Button
            text="Thêm vận chuyển"
            icon="bx bx-plus"
            variant="primary"
            onClick={handleAddCarrier}
          />
        </div>

        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm đơn vị vận chuyển..."
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
          <Table columns={columns} data={carriers} actions={actions} />
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

      {/* ===== MODALS ===== */}
      <CarrierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCarrier(null);
        }}
        onSubmit={handleFormSubmit}
        carrier={selectedCarrier}
      />

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        carrierId={selectedCarrierId}
        onUpload={handleAvatarUpload}
        onClose={() => {
          setIsAvatarModalOpen(false);
          setSelectedCarrierId(null);
        }}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Thông báo"
        message="Bạn chắc chắn muốn xóa đơn vị vận chuyển này?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
}
