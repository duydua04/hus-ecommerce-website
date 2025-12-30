import React, { useState, useEffect } from "react";
import { X, Check, MapPin, Phone, Tag } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import AddEditAddressModal from "./AddLocation/AddLocation";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import useLocation from "../../hooks/useLocation";

import "./Location.scss";
import "../../assets/styles/page.scss";

const ADDRESS_LABEL_MAP = {
  headquarters: "Trụ sở chính",
  warehouse: "Kho hàng",
  other: "Khác",
};

const getAddressLabelText = (label) => ADDRESS_LABEL_MAP[label] || "Khác";

export default function LocationContent() {
  const {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddressLink,
    updateAddressContent,
    setDefaultAddress,
    deleteAddress,
    clearError,
  } = useLocation();

  const [successMessage, setSuccessMessage] = useState("");
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState(""); // "add", "edit-link", "edit-content"
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Debug log
  useEffect(() => {
    console.log("Current addresses state:", addresses);
    console.log("Loading:", loading);
    console.log("Error:", error);
  }, [addresses, loading, error]);

  /* HANDLERS */
  const handleAddAddress = () => {
    clearError();
    setSuccessMessage("");
    setModalMode("add");
    setSelectedAddress(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditAddress = (address) => {
    clearError();
    setSuccessMessage("");
    setModalMode("edit-content");
    setSelectedAddress(address);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteAddress = (address) => {
    clearError();
    setSuccessMessage("");
    setSelectedAddress(address);
    setIsConfirmDeleteOpen(true);
  };

  const handleSetDefault = async (address) => {
    if (address.is_default) return;

    try {
      clearError();
      setSuccessMessage("");
      await setDefaultAddress(address.seller_address_id);
      setSuccessMessage("Đã đặt địa chỉ mặc định thành công");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  };

  const handleCloseAddEditModal = () => {
    setIsAddEditModalOpen(false);
    setModalMode("");
    setSelectedAddress(null);
  };

  const handleCloseConfirmDelete = () => {
    setIsConfirmDeleteOpen(false);
    setSelectedAddress(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setSelectedAddress(null);
  };

  const handleSubmitAddEdit = async (formData) => {
    try {
      if (modalMode === "add") {
        await createAddress(
          {
            fullname: formData.fullname,
            phone: formData.phone,
            street: formData.street,
            ward: formData.ward,
            district: formData.district,
            province: formData.province,
          },
          formData.is_default || false,
          formData.label || null
        );
        setSuccessMessage("Thêm địa chỉ mới thành công");
      } else if (modalMode === "edit-content") {
        await updateAddressContent(selectedAddress.seller_address_id, {
          fullname: formData.fullname,
          phone: formData.phone,
          street: formData.street,
          ward: formData.ward,
          district: formData.district,
          province: formData.province,
        });

        // Nếu có thay đổi label hoặc is_default
        if (formData.label !== undefined || formData.is_default !== undefined) {
          const linkData = {};
          if (formData.label !== undefined) linkData.label = formData.label;
          if (formData.is_default !== undefined)
            linkData.is_default = formData.is_default;

          await updateAddressLink(selectedAddress.seller_address_id, linkData);
        }

        setSuccessMessage("Cập nhật địa chỉ thành công");
      }

      setIsAddEditModalOpen(false);
      setModalMode("");
      setSelectedAddress(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error submitting address:", err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAddress(selectedAddress.seller_address_id);
      setSuccessMessage("Xóa địa chỉ thành công");
      setIsConfirmDeleteOpen(false);
      setSelectedAddress(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting address:", err);
      setIsConfirmDeleteOpen(false);
    }
  };

  /* RENDER */
  if (loading && addresses.length === 0) {
    return (
      <main className="main">
        <PageHeader
          title="Địa chỉ"
          breadcrumbs={[
            { label: "Trang chủ", path: "/dashboard" },
            { label: "Địa chỉ", path: "/location" },
          ]}
        />
        <div className="toolbar">
          <div className="toolbar__loading">Đang tải...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <PageHeader
        title="Địa chỉ"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Địa chỉ", path: "/location" },
        ]}
      />

      <div className="toolbar">
        {/* Toolbar Header */}
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Địa chỉ của tôi</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi sản phẩm của cửa hàng
            </p>
          </div>
          <Button
            text="Thêm địa chỉ"
            icon="bx bx-plus"
            variant="primary"
            onClick={handleAddAddress}
          />
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

        {/* Address List */}
        <div className="location">
          {addresses.length === 0 ? (
            <div className="location-empty">
              <MapPin size={64} className="location-empty__icon" />
              <h3 className="location-empty__title">Chưa có địa chỉ nào</h3>
              <p className="location-empty__desc">
                Thêm địa chỉ để dễ dàng quản lý giao hàng
              </p>
              <Button
                text="Thêm địa chỉ đầu tiên"
                icon="bx bx-plus"
                variant="primary"
                onClick={handleAddAddress}
              />
            </div>
          ) : (
            <div className="location-list">
              {addresses.map((address) => (
                <div
                  key={address.seller_address_id}
                  className={`location-card ${
                    address.is_default ? "location-card--default" : ""
                  }`}
                >
                  {/* Card Header */}
                  <div className="location-card__header">
                    <div className="location-card__name-wrapper">
                      <h3 className="location-card__name">
                        {address.address?.fullname || "Không có tên"}
                      </h3>
                      <span className="location-card__phone">
                        <Phone size={14} />
                        {address.address?.phone || "Không có SĐT"}
                      </span>
                    </div>
                    <button
                      className="location-card__action location-card__action--edit"
                      onClick={() => handleEditAddress(address)}
                      disabled={loading}
                    >
                      Cập nhật
                    </button>
                    <button
                      className="location-card__action location-card__action--delete"
                      onClick={() => handleDeleteAddress(address)}
                      disabled={loading}
                    >
                      Xóa
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="location-card__body">
                    <p className="location-card__street">
                      {address.address?.street || "Chưa có địa chỉ"}
                    </p>
                    <p className="location-card__area">
                      {[
                        address.address?.ward,
                        address.address?.district,
                        address.address?.province,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Chưa có thông tin"}
                    </p>

                    {address.label && (
                      <div className="location-card__label">
                        <Tag size={14} />
                        <span>{getAddressLabelText(address.label)}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="location-card__footer">
                    {address.is_default && (
                      <span className="location-card__default-badge">
                        Mặc định
                      </span>
                    )}
                    {!address.is_default && (
                      <button
                        className="location-card__action location-card__action--default"
                        onClick={() => handleSetDefault(address)}
                        disabled={loading}
                      >
                        Thiết lập mặc định
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Address Modal */}
      <AddEditAddressModal
        isOpen={isAddEditModalOpen}
        onClose={handleCloseAddEditModal}
        onSubmit={handleSubmitAddEdit}
        mode={modalMode}
        address={selectedAddress}
        loading={loading}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={handleCloseConfirmDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Xác nhận xóa địa chỉ"
        message={
          selectedAddress
            ? `Bạn có chắc chắn muốn xóa địa chỉ của "${selectedAddress.address?.fullname}" không? Hành động này không thể hoàn tác.`
            : ""
        }
        confirmText="Xóa địa chỉ"
        confirmVariant="danger"
        loading={loading}
      />
    </main>
  );
}
