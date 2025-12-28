// src/pages/Profile/profile.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useUser } from "../../context/UserContext";
import "./profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");
  const { user, setUser } = useUser();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.profile.getProfile();
        setProfile(data);

        // Đồng bộ với UserContext nếu chưa có
        if (!user) {
          setUser(data);
        }
      } catch (err) {
        console.error("Load profile error:", err);
      }
    };

    loadProfile();
  }, [setUser, user]);

  if (!profile) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    // Chỉ cập nhật local state, KHÔNG cập nhật UserContext
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await api.profile.updateProfile({
        fullname: profile.fullname,
        birthday: profile.birthday,
      });

      // CHỈ KHI LƯU THÀNH CÔNG mới cập nhật UserContext
      setUser(prev => ({
        ...prev,
        fullname: profile.fullname,
        birthday: profile.birthday,
      }));

      alert("✅ Lưu hồ sơ thành công");
    } catch (err) {
      alert(err.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File ảnh không được vượt quá 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUploadAvatar = async () => {
  if (!avatarFile) {
    alert("Vui lòng chọn ảnh");
    return;
  }

  try {
    setLoading(true);

    const uploadRes = await api.avatar.upload(avatarFile);

    const updatedProfile = await api.profile.updateProfile({
      avatar_url: uploadRes.avatar_url,
    });

    setProfile(prev => ({
      ...prev,
      avatar_url,
    }));

    setUser(prev => ({
      ...prev,
      avatar_url,
    }));

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);

    alert("✅ Avatar đã được lưu");

  } catch (err) {
    console.error(err);
    alert(err.message || "Upload avatar thất bại");
  } finally {
    setLoading(false);
  }
};

  const handleCancelAvatarPreview = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Bạn có chắc muốn xóa avatar?')) return;

    try {
      setLoading(true);
      await api.avatar.delete();

      console.log('✅ Avatar deleted');

      // Cập nhật cả Profile và UserContext
      setProfile(prev => ({ ...prev, avatar_url: null }));
      setUser(prev => ({ ...prev, avatar_url: null }));

      alert('✅ Xóa avatar thành công');
    } catch (err) {
      alert(err.message || 'Xóa avatar thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Lấy avatar URL hiện tại
  const getCurrentAvatarUrl = () => {
    return avatarPreview || profile.avatar_url;
  };

  /* ================= UI ================= */
  return (
    <div className="main-container">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="user-info">
          <div className="user-avatar">
            {getCurrentAvatarUrl() ? (
              <div className="user-avatar">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <div className="avatar-fallback">👤</div>
                  )}
                </div>
            ) : (
              <div style={{
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}>👤</div>
            )}
          </div>
          <div>
            <div className="user-name">{user.fullname || user.fname || user.email}</div>
            <a
              href="#"
              className="user-edit"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("profile");
              }}
            >
              ✏️ Sửa Hồ Sơ
            </a>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-menu__item">
            <a className="sidebar-menu__link">
              <span>📦</span>
              <span>Siêu Sale 12/12</span>
              <span className="sidebar-menu__badge">New</span>
            </a>
          </li>

          <li className="sidebar-menu__item">
            <a className="sidebar-menu__link">
              <span>🔔</span>
              <span>Thông Báo</span>
            </a>
          </li>

          <li className="sidebar-menu__item">
            <a
              className={`sidebar-menu__link ${
                activeSection === "profile" ||
                activeSection === "address" ||
                activeSection === "password"
                  ? "active"
                  : ""
              }`}
            >
              <span>👤</span>
              <span>Tài Khoản Của Tôi</span>
            </a>

            <ul className="submenu show">
              <li>
                <a
                  className={`submenu__link ${
                    activeSection === "profile" ? "active" : ""
                  }`}
                  onClick={() => setActiveSection("profile")}
                >
                  Hồ Sơ
                </a>
              </li>
              <li>
                <a
                  className={`submenu__link ${
                    activeSection === "address" ? "active" : ""
                  }`}
                  onClick={() => setActiveSection("address")}
                >
                  Địa Chỉ
                </a>
              </li>
              <li>
                <a
                  className={`submenu__link ${
                    activeSection === "password" ? "active" : ""
                  }`}
                  onClick={() => setActiveSection("password")}
                >
                  Đổi Mật Khẩu
                </a>
              </li>
            </ul>
          </li>

          <li className="sidebar-menu__item">
            <a className="sidebar-menu__link">
              <span>📄</span>
              <span>Đơn Mua</span>
            </a>
          </li>
        </ul>
      </aside>

      {/* ================= CONTENT ================= */}
      <main className="content">
        {/* ===== PROFILE ===== */}
        {activeSection === "profile" && (
          <div className="content-section active">
            <h2 className="section-title">Hồ Sơ Của Tôi</h2>
            <p className="section-subtitle">
              Quản lý thông tin hồ sơ để bảo mật tài khoản
            </p>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={profile.email} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Tên đầy đủ</label>
              <input
                className="form-input"
                name="fullname"
                value={profile.fullname || ""}
                onChange={handleChange}
                placeholder="Nhập tên của bạn"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ngày sinh</label>
              <input
                type="date"
                className="form-input"
                name="birthday"
                value={profile.birthday || ""}
                onChange={handleChange}
              />
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
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        console.error('Avatar preview load error');
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="font-size: 48px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">👤</div>';
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>👤</div>
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
                        >
                          {loading ? 'Đang tải...' : 'Tải Lên'}
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

                    {profile.avatar_url && !avatarFile && (
                      <button
                        className="avatar-button avatar-button--danger"
                        onClick={handleDeleteAvatar}
                        disabled={loading}
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
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        )}

        {/* ===== ADDRESS ===== */}
        {activeSection === "address" && (
          <div className="content-section active">
            <h2 className="section-title">Địa Chỉ Của Tôi</h2>
            <p className="section-subtitle">Quản lý địa chỉ giao hàng</p>
            <p style={{ padding: 40, textAlign: "center", color: "#888" }}>
              Chưa có địa chỉ nào được lưu
            </p>
          </div>
        )}

        {/* ===== PASSWORD ===== */}
        {activeSection === "password" && (
          <div className="content-section active">
            <h2 className="section-title">Đổi Mật Khẩu</h2>
            <p className="section-subtitle">
              Không chia sẻ mật khẩu cho người khác
            </p>

            <div className="form-group">
              <input
                className="form-input"
                type="password"
                placeholder="Mật khẩu hiện tại"
              />
            </div>

            <div className="form-group">
              <input
                className="form-input"
                type="password"
                placeholder="Mật khẩu mới"
              />
            </div>

            <div className="form-group">
              <input
                className="form-input"
                type="password"
                placeholder="Xác nhận mật khẩu"
              />
            </div>

            <div className="button-group">
              <button className="btn-save">Xác Nhận</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}