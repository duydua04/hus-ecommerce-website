import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import api from "../../services/api";
import { useUser } from "../../context/UserContext";
import NotificationSidebar from "../../components/notificationSidebar";
import Modal from "../../components/modal";
import "./profile.css";

export default function Profile() {
  const [profile, setProfile] = useState({
    fname: "",
    lname: "",
    phone: "",
    email: "",
    avt_url: ""
  });
  const [activeSection, setActiveSection] = useState("profile");
  const { user, setUser } = useUser();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    showCancelButton: false
  });

  // Helper functions for modal
  const showModal = (config) => {
    setModal({
      isOpen: true,
      ...config
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const showSuccessModal = (message, title = "Thành công") => {
    showModal({
      type: 'success',
      title,
      message,
      showCancelButton: false
    });
  };

  const showErrorModal = (message, title = "Lỗi") => {
    showModal({
      type: 'error',
      title,
      message,
      showCancelButton: false
    });
  };

  const showWarningModal = (message, title = "Cảnh báo") => {
    showModal({
      type: 'warning',
      title,
      message,
      showCancelButton: false
    });
  };

  const showConfirmModal = (message, onConfirm, title = "Xác nhận") => {
    showModal({
      type: 'confirm',
      title,
      message,
      showCancelButton: true,
      onConfirm,
      okText: 'Đồng ý',
      cancelText: 'Hủy'
    });
  };

  /* ================= VALIDATION FUNCTIONS ================= */
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(0[1-9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const newErrors = {};

    if (profile.phone && !validatePhoneNumber(profile.phone.trim())) {
      newErrors.phone = "Số điện thoại không đúng định dạng Việt Nam (vd: 0987654321)";
    }

    if (!profile.lname.trim()) {
      newErrors.lname = "Vui lòng nhập họ";
    }

    if (!profile.fname.trim()) {
      newErrors.fname = "Vui lòng nhập tên";
    }

    return newErrors;
  };

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.profile.getProfile();
        setProfile(data);
        setUser(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Load profile error:", err);
      }
    };

    loadProfile();
  }, [setUser]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSaveProfile = async () => {
    // 1. Validate Form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showWarningModal("Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Biến này để lưu URL ảnh cuối cùng sẽ hiển thị
      let finalAvatarUrl = profile.avt_url;

      // ---------------------------------------------------------
      // BƯỚC 1: XỬ LÝ UPLOAD ẢNH (NẾU CÓ)
      // ---------------------------------------------------------
      if (avatarFile) {
        try {
          console.log("Đang upload ảnh...");
          const uploadRes = await api.avatar.upload(avatarFile);

          // Lấy URL mới từ kết quả upload
          finalAvatarUrl = uploadRes.public_url || uploadRes.avt_url;

          // Reset file input
          setAvatarFile(null);
          setAvatarPreview(null);
        } catch (uploadErr) {
          console.error("Lỗi upload ảnh:", uploadErr);
          showErrorModal("Không thể tải ảnh lên, nhưng sẽ tiếp tục lưu thông tin cá nhân.");
          // Nếu lỗi, vẫn giữ finalAvatarUrl cũ
        }
      }

      // ---------------------------------------------------------
      // BƯỚC 2: CẬP NHẬT THÔNG TIN VĂN BẢN
      // ---------------------------------------------------------
      // Chỉ gửi các trường text, KHÔNG gửi avt_url
      const updateProfileRes = await api.profile.updateProfile({
        fname: profile.fname,
        lname: profile.lname,
        phone: profile.phone,
      });

      // ---------------------------------------------------------
      // BƯỚC 3: CẬP NHẬT GIAO DIỆN
      // ---------------------------------------------------------
      // Lấy thông tin text mới từ server + link ảnh mới nhất (từ Bước 1)
      const finalProfileData = {
        ...updateProfileRes,
        avt_url: finalAvatarUrl
      };

      setProfile(prev => ({ ...prev, ...finalProfileData }));
      setUser(prev => ({ ...prev, ...finalProfileData }));

      showSuccessModal("Cập nhật hồ sơ thành công");

    } catch (err) {
      console.error(err);
      showErrorModal(err.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showErrorModal('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorModal('File ảnh không được vượt quá 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Nút lưu ảnh riêng lẻ (nếu người dùng muốn bấm nút nhỏ bên cạnh ảnh)
  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      showWarningModal("Vui lòng chọn ảnh");
      return;
    }

    try {
      setLoading(true);

      const uploadRes = await api.avatar.upload(avatarFile);
      const newAvatarUrl = uploadRes.public_url || uploadRes.avt_url;

      setProfile(prev => ({ ...prev, avt_url: newAvatarUrl }));
      setUser(prev => ({
        ...prev,
        avt_url: newAvatarUrl,
        avatar_url: newAvatarUrl
      }));

      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);

      showSuccessModal("Avatar đã được lưu");

    } catch (err) {
      console.error(err);
      showErrorModal(err.message || "Upload avatar thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAvatarPreview = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleDeleteAvatar = async () => {
    showConfirmModal(
      'Bạn có chắc muốn xóa avatar?',
      async () => {
        try {
          setLoading(true);
          await api.avatar.delete();

          setProfile(prev => ({ ...prev, avt_url: null }));
          setUser(prev => ({ ...prev, avt_url: null, avatar_url: null }));

          showSuccessModal('Xóa avatar thành công');
        } catch (err) {
          showErrorModal(err.message || 'Xóa avatar thất bại');
        } finally {
          setLoading(false);
        }
      },
      'Xác nhận xóa avatar'
    );
  };

  const getCurrentAvatarUrl = () => {
    return avatarPreview || profile.avt_url || user?.avt_url || user?.avatar_url;
  };

  /* ================= UI ================= */
  return (
    <div className="main-container">
      {/* ================= SIDEBAR ================= */}
      <NotificationSidebar user={user} />

      {/* ================= CONTENT ================= */}
      <main className="content">
        {activeSection === "profile" && (
          <div className="content-section active">
            <h2 className="section-title">Hồ Sơ Của Tôi</h2>
            <p className="section-subtitle">
              Quản lý thông tin hồ sơ để bảo mật tài khoản
            </p>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={profile.email || ""} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Họ</label>
              <input
                className="form-input"
                name="lname"
                value={profile.lname || ""}
                onChange={handleChange}
                placeholder="Nhập họ"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tên</label>
              <input
                className="form-input"
                name="fname"
                value={profile.fname || ""}
                onChange={handleChange}
                placeholder="Nhập tên"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <div>
                <input
                  className={`form-input ${errors.phone ? 'error-input' : ''}`}
                  name="phone"
                  value={profile.phone || ""}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại (vd: 0987654321)"
                  maxLength="10"
                />
                {errors.phone && <div className="error-message">{errors.phone}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div className="avatar-section">
                <div className="avatar-preview">
                  {getCurrentAvatarUrl() ? (
                    <img
                      src={getCurrentAvatarUrl()}
                      alt="avatar preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        borderRadius: '50%'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="font-size: 48px;">👤</div>';
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '48px' }}>👤</div>
                  )}
                </div>

                <div className="avatar-info">
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                    id="avatarInput"
                    disabled={loading}
                  />

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="avatar-button"
                      onClick={() => document.getElementById("avatarInput").click()}
                      disabled={loading}
                    >
                      Chọn Ảnh
                    </button>

                    {avatarFile && (
                      <>
                        <button
                          className="avatar-button"
                          onClick={handleUploadAvatar}
                          disabled={loading}
                          style={{ borderColor: 'var(--blue-600)', color: 'var(--blue-600)' }}
                        >
                          {loading ? 'Đang tải...' : 'Lưu Ảnh'}
                        </button>

                        <button
                          className="avatar-button"
                          onClick={handleCancelAvatarPreview}
                          disabled={loading}
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {profile.avt_url && !avatarFile && (
                      <button
                        className="avatar-button avatar-button--danger"
                        onClick={handleDeleteAvatar}
                        disabled={loading}
                        style={{ color: 'red', borderColor: 'red' }}
                      >
                        Xóa Avatar
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    Định dạng: JPG, PNG. Tối đa 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button
                className="btn-save"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        showCancelButton={modal.showCancelButton}
        onOk={modal.onConfirm}
        okText={modal.okText}
        cancelText={modal.cancelText}
      />
    </div>
  );
}