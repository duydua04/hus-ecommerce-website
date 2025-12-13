import React, { useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";
import CarrierModal from "./AddCarrier/AddCarrier";
import AvatarUploadModal from "../../components/common/AvatarUpload/AvatarUpload";
import useCarrier from "../../hooks/useCarrier";
import "./Transport.scss";

// Avatar mặc định
const DEFAULT_AVATAR = "/assets/images/default-avatar.png";

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
  const [successMessage, setSuccessMessage] = useState("");

  const itemsPerPage = 10;

  // Fetch initial data
  useEffect(() => {
    fetchCarriers({
      searchQuery: "",
      limit: itemsPerPage,
      offset: 0,
    });
  }, []);

  // Fetch when search or page changes
  useEffect(() => {
    fetchCarriers({
      searchQuery,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    });
  }, [searchQuery, currentPage]);

  const totalPages = Math.ceil(total / itemsPerPage);

  // Toolbar actions
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

  // Form submit (create/update)
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

      setTimeout(() => setSuccessMessage(""), 3000);

      // Reload data
      fetchCarriers({
        searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error submit form:", err);
    }
  };

  const handleDeleteCarrier = async (carrierId) => {
    if (window.confirm("Bạn chắc chắn muốn xóa đơn vị vận chuyển này?")) {
      try {
        await deleteCarrier(carrierId);
        setSuccessMessage("Xóa đơn vị vận chuyển thành công");

        setTimeout(() => setSuccessMessage(""), 3000);

        fetchCarriers({
          searchQuery,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        });
      } catch (err) {
        console.error("Error delete carrier:", err);
      }
    }
  };

  const handleAvatarUpload = async (carrierId, file) => {
    try {
      await uploadCarrierAvatar(carrierId, file);
      setSuccessMessage("Tải lên avatar thành công");

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchCarriers({
        searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error upload avatar:", err);
    }
  };

  // Table columns
  const columns = [
    {
      key: "carrier_avt_url",
      label: "Avatar",
      className: "table__cell--avatar",
      render: (value) => (
        <img
          src={value || DEFAULT_AVATAR} // Dùng avatar mặc định nếu không có
          alt="Carrier avatar"
          className="table__img"
          onError={(e) => {
            // Nếu ảnh lỗi thì dùng avatar mặc định
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
      render: (v) => `${Number(v)?.toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "price_per_kg",
      label: "Giá/kg",
      className: "table__cell--price",
      render: (v) => `${Number(v)?.toLocaleString("vi-VN")} ₫`,
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

  // Table actions
  const actions = [
    {
      label: "Sửa",
      icon: "bx bx-edit-alt",
      onClick: handleEditCarrier,
      className: "action-btn action-btn--edit",
    },
    {
      label: "Xóa",
      icon: "bx bx-trash", //
      onClick: (c) => handleDeleteCarrier(c.carrier_id),
      className: "action-btn action-btn--delete",
    },
  ];

  return (
    <main className="main">
      <PageHeader
        title="Vận chuyển"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Vận chuyển", path: "/transport" },
        ]}
      />

      {/* Toolbar */}
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

        {/* Actions */}
        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm đơn vị vận chuyển..."
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

        {/* Alerts */}
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

        {/* Table */}
        <div className="toolbar__table">
          <Table columns={columns} data={carriers} actions={actions} />
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

      {/* Modals */}
      <CarrierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        carrier={selectedCarrier}
      />

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onUpload={handleAvatarUpload}
        carrierId={selectedCarrierId}
      />
    </main>
  );
}
