// src/pages/Profile/profile.jsx
import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import api from "../../services/api";
import { useUser } from "../../context/UserContext";
import "./profile.css";
import Addresses from "../Addresses/addresses";

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
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const updatedData = await api.profile.updateProfile({
        fname: profile.fname,
        lname: profile.lname,
        phone: profile.phone,
      });

      setProfile(prev => ({ ...prev, ...updatedData }));
      setUser(prev => ({ ...prev, ...updatedData }));

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
    if (!avatarFile) return alert("Vui lòng chọn ảnh");

    try {
      setLoading(true);

      const uploadRes = await api.avatar.upload(avatarFile);
      const newAvatarUrl = uploadRes.avatar_url;

      setProfile(prev => ({ ...prev, avt_url: newAvatarUrl }));
      setUser(prev => ({
        ...prev,
        avt_url: newAvatarUrl,
        avatar_url: newAvatarUrl
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
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Bạn có chắc muốn xóa avatar?')) return;

    try {
      setLoading(true);
      await api.avatar.delete();

      setProfile(prev => ({ ...prev, avt_url: null }));
      setUser(prev => ({ ...prev, avt_url: null, avatar_url: null }));

      alert('✅ Xóa avatar thành công');
    } catch (err) {
      alert(err.message || 'Xóa avatar thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Helper hiển thị avatar
  const getCurrentAvatarUrl = () => {
    return avatarPreview || profile.avt_url || user?.avt_url || user?.avatar_url;
  };

  // Helper hiển thị tên (Ưu tiên Họ + Tên cho người Việt)
  const getDisplayName = () => {
    if (user.lname || user.fname) {
      // SỬA: lname (Họ) đứng trước, fname (Tên) đứng sau
      return `${user.lname || ''} ${user.fname || ''}`.trim();
    }
    return user.email;
  }

  /* ================= UI ================= */
  return (
    <div className="main-container">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="user-info">
          <div className="user-avatar">
            {getCurrentAvatarUrl() ? (
              <img
                src={getCurrentAvatarUrl()}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <div className="avatar-fallback">👤</div>
            )}
          </div>
          <div>
            <div className="user-name">{getDisplayName()}</div>
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
            <Link to="/notifications" className="sidebar-menu__link">
              <span>🔔</span>
              <span>Thông Báo</span>
            </Link>
          </li>

          <li className="sidebar-menu__item">
            <a
              className={`sidebar-menu__link ${
                ["profile", "address"].includes(activeSection) ? "active" : ""
              }`}
            >
              <span>👤</span>
              <span>Tài Khoản Của Tôi</span>
            </a>

            <ul className="submenu show">
              <li>
                <a
                  className={`submenu__link ${activeSection === "profile" ? "active" : ""}`}
                  onClick={() => setActiveSection("profile")}
                >
                  Hồ Sơ
                </a>
              </li>
              <li>
                <a
                  className={`submenu__link ${activeSection === "address" ? "active" : ""}`}
                  onClick={() => setActiveSection("address")}
                >
                  Địa Chỉ
                </a>
              </li>
            </ul>
          </li>

          <li className="sidebar-menu__item">
            <Link to="/tracking" className="sidebar-menu__link">
              <span>📄</span>
              <span>Đơn Mua</span>
            </Link>
          </li>
        </ul>
      </aside>

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

            {/* SỬA: Đổi Label Họ -> lname */}
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

            {/* SỬA: Đổi Label Tên -> fname */}
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
              <input
                className="form-input"
                name="phone"
                value={profile.phone || ""}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
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

        {activeSection === "address" && (
          <Addresses />
        )}
      </main>
    </div>
  );
}