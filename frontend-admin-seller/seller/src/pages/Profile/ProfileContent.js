import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import EditProfileModal from "./EditProfile/EditProfileModal";
import useProfile from "../../hooks/useProfile";
import "./Profile.scss";

// Avatar mặc định
import defaultAvatar from "../../assets/images/default-avatar.png";
const DEFAULT_AVATAR = defaultAvatar;

export default function ProfileContent() {
  const { profile, loading, error, fetchProfile, updateProfile, clearError } =
    useProfile();

  const [successMessage, setSuccessMessage] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(""); // "personal" or "shop"

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* HANDLERS */
  const handleEditPersonal = () => {
    clearError();
    setSuccessMessage("");
    setEditMode("personal");
    setIsEditModalOpen(true);
  };

  const handleEditShop = () => {
    clearError();
    setSuccessMessage("");
    setEditMode("shop");
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditMode("");
  };

  const handleSubmitModal = async (formData) => {
    try {
      await updateProfile(formData);

      if (editMode === "personal") {
        setSuccessMessage("Cập nhật thông tin cá nhân thành công");
      } else if (editMode === "shop") {
        setSuccessMessage("Cập nhật thông tin cửa hàng thành công");
      }

      setIsEditModalOpen(false);
      setEditMode("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const getTierBadge = (tier) => {
    const badges = {
      regular: { label: "Regular", class: "tier-badge--regular" },
      silver: { label: "Silver", class: "tier-badge--silver" },
      gold: { label: "Gold", class: "tier-badge--gold" },
      platinum: { label: "Platinum", class: "tier-badge--platinum" },
    };
    return badges[tier] || badges.regular;
  };

  /* RENDER */
  if (loading && !profile) {
    return (
      <main className="main">
        <PageHeader
          title="Hồ sơ"
          breadcrumbs={[
            { label: "Trang chủ", path: "/dashboard" },
            { label: "Hồ sơ", path: "/profile" },
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
        title="Hồ sơ"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Hồ sơ", path: "/profile" },
        ]}
      />

      <div className="toolbar">
        {/* Toolbar Header */}
        <div className="toolbar__header-profile">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Quản lý hồ sơ</h3>
            <p className="toolbar__title-desc">
              Xem và cập nhật thông tin cá nhân của bạn
            </p>
          </div>
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

        {/* Profile Content */}
        <div className="profile">
          {/* Profile Header Card */}
          <div className="profile-card profile-header">
            <div className="profile-header__content">
              <div className="profile-header__avatar-wrapper">
                <img
                  src={profile?.avt_url || DEFAULT_AVATAR}
                  alt="Avatar"
                  className="profile-header__avatar"
                  onError={(e) => {
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
              </div>

              <div className="profile-header__info">
                <h2 className="profile-header__name">
                  {profile?.fname} {profile?.lname}
                </h2>
                <p className="profile-header__subtitle">
                  {profile?.shop_name || "Chưa có tên cửa hàng"}
                </p>
              </div>

              <div className="profile-header__badges">
                <span
                  className={`tier-badge ${
                    getTierBadge(profile?.seller_tier).class
                  }`}
                >
                  {getTierBadge(profile?.seller_tier).label}
                </span>
                <span className="rating-badge">
                  <i className="bx bxs-star"></i>
                  {profile?.average_rating?.toFixed(1) || "0.0"} (
                  {profile?.rating_count || 0} đánh giá)
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information Card */}
          <div className="profile-card">
            <div className="profile-card__header">
              <h3 className="profile-card__title">Thông tin cá nhân</h3>
              <Button
                text="Chỉnh sửa"
                icon="bx bx-edit-alt"
                variant="outline"
                size="small"
                onClick={handleEditPersonal}
              />
            </div>

            <div className="profile-card__body">
              <div className="profile-grid">
                <div className="profile-field">
                  <label className="profile-field__label">Họ</label>
                  <p className="profile-field__value">
                    {profile?.fname || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="profile-field">
                  <label className="profile-field__label">Tên</label>
                  <p className="profile-field__value">
                    {profile?.lname || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="profile-field">
                  <label className="profile-field__label">Email</label>
                  <p className="profile-field__value profile-field__value--disabled">
                    {profile?.email || "Chưa cập nhật"}
                  </p>
                  <small className="profile-field__note">
                    Email không thể thay đổi
                  </small>
                </div>

                <div className="profile-field">
                  <label className="profile-field__label">Số điện thoại</label>
                  <p className="profile-field__value">
                    {profile?.phone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Information Card */}
          <div className="profile-card">
            <div className="profile-card__header">
              <h3 className="profile-card__title">Thông tin cửa hàng</h3>
              <Button
                text="Chỉnh sửa"
                icon="bx bx-edit-alt"
                variant="outline"
                size="small"
                onClick={handleEditShop}
              />
            </div>

            <div className="profile-card__body">
              <div className="profile-grid">
                <div className="profile-field">
                  <label className="profile-field__label">Tên cửa hàng</label>
                  <p className="profile-field__value">
                    {profile?.shop_name || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="profile-field">
                  <label className="profile-field__label">
                    Hạng thành viên
                  </label>
                  <p className="profile-field__value">
                    {getTierBadge(profile?.seller_tier).label}
                  </p>
                </div>

                <div className="profile-field">
                  <label className="profile-field__label">Trạng thái</label>
                  <span
                    className={`status-badge ${
                      profile?.is_active
                        ? "status-badge--active"
                        : "status-badge--inactive"
                    }`}
                  >
                    {profile?.is_active ? "Hoạt động" : "Tạm khóa"}
                  </span>
                </div>

                <div className="profile-field">
                  <label className="profile-field__label">Ngày tham gia</label>
                  <p className="profile-field__value">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("vi-VN")
                      : "Chưa rõ"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        mode={editMode}
        profile={profile}
        loading={loading}
      />
    </main>
  );
}
