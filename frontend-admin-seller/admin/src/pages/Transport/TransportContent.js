import React, { useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";
import CarrierModal from "./AddCarrier/AddCarrier";
import AvatarUploadModal from "../../components/common/AvatarUpload/AvatarUpload";
import { useCarrier } from "../../hooks/useCarrier";
import "./Transport.scss";

export default function TransportContent() {
  const {
    carriers,
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

  useEffect(() => {
    fetchCarriers();
  }, [fetchCarriers]);

  // Filter carriers by search
  const filteredCarriers = carriers.filter((c) =>
    c.carrier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCarriers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCarriers = filteredCarriers.slice(startIndex, endIndex);

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
      fetchCarriers();
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
        fetchCarriers();
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
      fetchCarriers();
    } catch (err) {
      console.error("Error upload avatar:", err);
    }
  };

  // Table columns
  const columns = [
    {
      key: "carrier_avt_url",
      label: "Avatar",
      render: (value) =>
        value ? <img src={value} alt="" className="table__avatar" /> : "N/A",
    },
    { key: "carrier_name", label: "Tên đơn vị" },
    {
      key: "base_price",
      label: "Giá cơ bản",
      render: (v) => `${Number(v)?.toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "price_per_kg",
      label: "Giá/kg",
      render: (v) => `${Number(v)?.toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "is_active",
      label: "Trạng thái",
      render: (v) => (
        <span className={`status-badge ${v ? "active" : "inactive"}`}>
          {v ? "Hoạt động" : "Tạm dừng"}
        </span>
      ),
    },
  ];

  // Table actions
  const actions = [
    { label: "Sửa", onClick: handleEditCarrier, className: "btn-edit" },
    {
      label: "Xóa",
      onClick: (c) => handleDeleteCarrier(c.carrier_id),
      className: "btn-delete",
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

        <div className="toolbar__actions">
          <SearchBox
            placeholder="Tìm kiếm đơn vị vận chuyển..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={clearError} className="alert-close">
            <X size={18} />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success">
          <Check size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="loading">Đang tải...</div>}

      {/* Table */}
      <Table columns={columns} data={currentCarriers} actions={actions} />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

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
