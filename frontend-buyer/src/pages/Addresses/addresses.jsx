// src/pages/Addresses/addresses.jsx
import React, { useState, useEffect } from 'react';
import { Home, Building2, MapPin, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import api from '../../services/api';
import './addresses.css';
import NotificationSidebar from "../../components/notificationSidebar";
import addressData from '../../data/vietnam-address.json';
import { useUser } from "../../context/UserContext";

const LABELS = {
  home: { icon: Home, text: 'Nhà riêng', color: '#3b82f6' },
  office: { icon: Building2, text: 'Văn phòng', color: '#8b5cf6' },
  other: { icon: MapPin, text: 'Khác', color: '#6b7280' }
};

export default function Addresses() {
  const { user } = useUser();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // State cho dropdown địa chỉ
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // State cho notification modal
  const [notificationModal, setNotificationModal] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    showConfirmButton: true,
    showCancelButton: false
  });

  // State cho confirm modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    street: '',
    ward: '',
    district: '',
    province: '',
    label: 'home',
    is_default: false
  });

  // ============== MODAL HELPER FUNCTIONS ==============
  const showSuccess = (message, title = 'Thành công') => {
    setNotificationModal({
      show: true,
      type: 'success',
      title,
      message,
      onConfirm: () => setNotificationModal(prev => ({ ...prev, show: false })),
      showConfirmButton: true,
      showCancelButton: false
    });
  };

  const showError = (message, title = 'Lỗi') => {
    setNotificationModal({
      show: true,
      type: 'error',
      title,
      message,
      onConfirm: () => setNotificationModal(prev => ({ ...prev, show: false })),
      showConfirmButton: true,
      showCancelButton: false
    });
  };

  const showWarning = (message, title = 'Cảnh báo') => {
    setNotificationModal({
      show: true,
      type: 'warning',
      title,
      message,
      onConfirm: () => setNotificationModal(prev => ({ ...prev, show: false })),
      showConfirmButton: true,
      showCancelButton: false
    });
  };

  const showConfirm = (message, onConfirm, title = 'Xác nhận') => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // ============== LOAD PROVINCES ==============
  useEffect(() => {
    if (addressData && addressData.data) {
      setProvinces(addressData.data);

      if (addressData.data.length > 0) {
        const firstProvince = addressData.data[0];
        setSelectedProvince(firstProvince);
        setFormData(prev => ({ ...prev, province: firstProvince.name }));

        if (firstProvince.level2s && firstProvince.level2s.length > 0) {
          setDistricts(firstProvince.level2s);
        }
      }
    }
  }, []);

  // ============== LOAD ADDRESSES ==============
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await api.address.list();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load addresses error:', err);
      if (err.message === 'Failed to fetch') {
        showError('❌ Không thể kết nối server. Vui lòng kiểm tra backend.', 'Lỗi kết nối');
      } else {
        showError(err.message || 'Không thể tải danh sách địa chỉ', 'Lỗi');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============== ADDRESS FORM HANDLERS ==============
  const handleProvinceChange = (e) => {
    const provinceName = e.target.value;
    const province = provinces.find(p => p.name === provinceName);

    setSelectedProvince(province);
    setFormData({
      ...formData,
      province: provinceName,
      district: '',
      ward: ''
    });

    if (province && province.level2s) {
      setDistricts(province.level2s);
      setWards([]);
      setSelectedDistrict(null);
    } else {
      setDistricts([]);
      setWards([]);
      setSelectedDistrict(null);
    }
  };

  const handleDistrictChange = (e) => {
    const districtName = e.target.value;
    const district = districts.find(d => d.name === districtName);

    setSelectedDistrict(district);
    setFormData({
      ...formData,
      district: districtName,
      ward: ''
    });

    if (district && district.level3s) {
      setWards(district.level3s);
    } else {
      setWards([]);
    }
  };

  const handleWardChange = (e) => {
    setFormData({
      ...formData,
      ward: e.target.value
    });
  };

  const resetForm = () => {
    if (provinces.length > 0) {
      const firstProvince = provinces[0];
      setSelectedProvince(firstProvince);

      if (firstProvince.level2s && firstProvince.level2s.length > 0) {
        setDistricts(firstProvince.level2s);
      } else {
        setDistricts([]);
      }

      setWards([]);
      setSelectedDistrict(null);

      setFormData({
        fullname: '',
        phone: '',
        street: '',
        ward: '',
        district: '',
        province: firstProvince.name,
        label: 'home',
        is_default: false
      });
    } else {
      setFormData({
        fullname: '',
        phone: '',
        street: '',
        ward: '',
        district: '',
        province: '',
        label: 'home',
        is_default: false
      });
    }

    setEditingAddress(null);
  };

  const openModal = (address = null) => {
    if (address) {
      setEditingAddress(address);

      const province = provinces.find(p => p.name === address.address.province);

      if (province) {
        setSelectedProvince(province);
        setDistricts(province.level2s || []);

        const district = province.level2s?.find(d => d.name === address.address.district);
        if (district) {
          setSelectedDistrict(district);
          setWards(district.level3s || []);
        }
      }

      setFormData({
        fullname: address.address.fullname,
        phone: address.address.phone,
        street: address.address.street,
        ward: address.address.ward,
        district: address.address.district,
        province: address.address.province,
        label: address.label || 'home',
        is_default: address.is_default
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validatePhoneNumber = (phone) => {
    // Regex cho số điện thoại Việt Nam
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.fullname.trim()) return showWarning('Vui lòng nhập họ và tên', 'Thiếu thông tin');
    if (!validatePhoneNumber(formData.phone.trim())) return showWarning('Vui lòng nhập đúng định dạng số điện thoại', 'Thiếu thông tin');
    if (!formData.street.trim()) return showWarning('Vui lòng nhập địa chỉ cụ thể', 'Thiếu thông tin');
    if (!formData.province) return showWarning('Vui lòng chọn tỉnh/thành phố', 'Thiếu thông tin');
    if (!formData.district) return showWarning('Vui lòng chọn quận/huyện', 'Thiếu thông tin');
    if (!formData.ward) return showWarning('Vui lòng chọn phường/xã', 'Thiếu thông tin');

    const contentPayload = {
      fullname: formData.fullname,
      phone: formData.phone,
      street: formData.street,
      ward: formData.ward,
      district: formData.district,
      province: formData.province
    };

    try {
      setLoading(true);

      if (editingAddress) {
        const id = editingAddress.buyer_address_id;

        await api.address.updateContent(id, contentPayload);
        await api.address.updateLink(id, {
          label: formData.label,
          is_default: formData.is_default
        });

        showSuccess('✅ Cập nhật địa chỉ thành công');
      } else {
        await api.address.create(
          contentPayload,
          formData.is_default,
          formData.label
        );

        showSuccess('✅ Thêm địa chỉ thành công');
      }

      await loadAddresses();
      closeModal();
    } catch (err) {
      console.error('Submit error:', err);
      showError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (address) => {
    if (address.is_default) return;

    try {
      setLoading(true);
      await api.address.setDefault(address.buyer_address_id);
      await loadAddresses();
      showSuccess('✅ Đã đặt làm địa chỉ mặc định');
    } catch (err) {
      console.error('Set default error:', err);
      showError(err.message || 'Không thể đặt địa chỉ mặc định');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (address) => {
    showConfirm('Bạn có chắc muốn xóa địa chỉ này?', async () => {
      try {
        setLoading(true);
        await api.address.delete(address.buyer_address_id);
        await loadAddresses();
        showSuccess('✅ Xóa địa chỉ thành công');
      } catch (err) {
        console.error('Delete error:', err);
        showError(err.message || 'Không thể xóa địa chỉ');
      } finally {
        setLoading(false);
      }
    });
  };

  // ============== ADDRESS CARD COMPONENT ==============
  const AddressCard = ({ address }) => {
    const LabelIcon = LABELS[address.label]?.icon || MapPin;
    const labelInfo = LABELS[address.label] || LABELS.other;

    return (
      <div className={`address-card ${address.is_default ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}>
        <div className="address-card__header">
          <div className="address-card__label">
            <LabelIcon size={20} color={labelInfo.color} />
            <span className="address-card__label-text">{labelInfo.text}</span>
            {address.is_default && (
              <span className="address-card__badge">Mặc định</span>
            )}
          </div>

          <div className="address-card__actions">
            <button
              onClick={() => openModal(address)}
              className="address-card__btn address-card__btn--edit"
              title="Chỉnh sửa"
              disabled={loading}
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => handleDelete(address)}
              className="address-card__btn address-card__btn--delete"
              title="Xóa"
              disabled={loading}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="address-card__content">
          <div className="address-card__row">
            <span className="address-card__label-field">Họ tên:</span>
            <span className="font-medium">{address.address.fullname}</span>
          </div>
          <div className="address-card__row">
            <span className="address-card__label-field">SĐT:</span>
            <span>{address.address.phone}</span>
          </div>
          <div className="address-card__row">
            <span className="address-card__label-field">Địa chỉ:</span>
            <span>
              {address.address.street}, {address.address.ward},{' '}
              {address.address.district}, {address.address.province}
            </span>
          </div>
        </div>

        {!address.is_default && (
          <button
            onClick={() => handleSetDefault(address)}
            className="address-card__set-default"
            disabled={loading}
          >
            Đặt làm mặc định
          </button>
        )}
      </div>
    );
  };

  // ============== GET NOTIFICATION ICON ==============
  const getNotificationIcon = () => {
    switch (notificationModal.type) {
      case 'success':
        return <CheckCircle size={48} className="notification-icon-success" />;
      case 'error':
        return <AlertCircle size={48} className="notification-icon-error" />;
      case 'warning':
        return <AlertTriangle size={48} className="notification-icon-warning" />;
      default:
        return <Info size={48} className="notification-icon-info" />;
    }
  };

  // ============== RENDER ==============
  return (
    <>
      <div className="main-container">
        {/* ================= SIDEBAR ================= */}
        <NotificationSidebar user={user} activeSection="address" />

        {/* ================= CONTENT ================= */}
        <main className="content">
          <div className="addresses-page">
            <div className="addresses-container">
              {/* HEADER */}
              <div className="addresses-header">
                <div>
                  <h2 className="addresses-title">Địa Chỉ Của Tôi</h2>
                  <p className="addresses-subtitle">Quản lý địa chỉ giao hàng</p>
                </div>
                <button
                  onClick={() => openModal()}
                  className="btn-add-address"
                  disabled={loading}
                >
                  <Plus size={20} />
                  Thêm địa chỉ mới
                </button>
              </div>

              {/* LOADING STATE */}
              {loading && addresses.length === 0 && (
                <div className="addresses-loading">
                  <div className="loading-spinner"></div>
                  <p>Đang tải...</p>
                </div>
              )}

              {/* EMPTY STATE */}
              {!loading && addresses.length === 0 && (
                <div className="addresses-empty">
                  <MapPin size={48} className="addresses-empty__icon" />
                  <p className="addresses-empty__text">Chưa có địa chỉ nào</p>
                  <button onClick={() => openModal()} className="btn-add-first">
                    Thêm địa chỉ đầu tiên
                  </button>
                </div>
              )}

              {/* ADDRESS LIST */}
              <div className="addresses-grid">
                {addresses.map((address) => (
                  <AddressCard key={address.buyer_address_id} address={address} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= ADDRESS FORM MODAL ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h2>
              <button onClick={closeModal} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* LOẠI ĐỊA CHỈ */}
              <div className="form-group">
                <label className="form-label">Loại địa chỉ</label>
                <div className="label-buttons">
                  {Object.entries(LABELS).map(([key, { icon: Icon, text, color }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, label: key })}
                      className={`label-button ${formData.label === key ? 'active' : ''}`}
                    >
                      <Icon
                        size={18}
                        color={formData.label === key ? color : '#9ca3af'}
                      />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* HỌ VÀ TÊN */}
              <div className="form-group">
                <label className="form-label">
                  Họ và tên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  className="form-input"
                  placeholder="Nhập họ và tên"
                />
              </div>

              {/* SỐ ĐIỆN THOẠI */}
              <div className="form-group">
                <label className="form-label">
                  Số điện thoại <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="form-input"
                  placeholder="Nhập số điện thoại"
                  maxLength={20}
                />
              </div>

              {/* TỈNH/THÀNH PHỐ */}
              <div className="form-group">
                <label className="form-label">
                  Tỉnh/Thành phố <span className="required">*</span>
                </label>
                <select
                  value={formData.province}
                  onChange={handleProvinceChange}
                  className="form-select"
                >
                  <option value="">-- Chọn tỉnh/thành phố --</option>
                  {provinces.map((province) => (
                    <option key={province.level1_id} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* QUẬN/HUYỆN */}
              <div className="form-group">
                <label className="form-label">
                  Quận/Huyện <span className="required">*</span>
                </label>
                <select
                  value={formData.district}
                  onChange={handleDistrictChange}
                  className="form-select"
                  disabled={!selectedProvince || districts.length === 0}
                >
                  <option value="">-- Chọn quận/huyện --</option>
                  {districts.map((district) => (
                    <option key={district.level2_id} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PHƯỜNG/XÃ */}
              <div className="form-group">
                <label className="form-label">
                  Phường/Xã <span className="required">*</span>
                </label>
                <select
                  value={formData.ward}
                  onChange={handleWardChange}
                  className="form-select"
                  disabled={!selectedDistrict || wards.length === 0}
                >
                  <option value="">-- Chọn phường/xã --</option>
                  {wards.map((ward) => (
                    <option key={ward.level3_id} value={ward.name}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ĐỊA CHỈ CỤ THỂ */}
              <div className="form-group">
                <label className="form-label">
                  Địa chỉ cụ thể <span className="required">*</span>
                </label>
                <textarea
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  className="form-textarea"
                  placeholder="Số nhà, tên đường..."
                  rows={3}
                />
              </div>

              {/* ĐẶT LÀM MẶC ĐỊNH */}
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) =>
                    setFormData({ ...formData, is_default: e.target.checked })
                  }
                />
                <label htmlFor="is_default">Đặt làm địa chỉ mặc định</label>
              </div>

              {/* ACTIONS */}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-cancel"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Đang lưu...'
                    : editingAddress
                    ? 'Cập nhật'
                    : 'Thêm địa chỉ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= NOTIFICATION MODAL ================= */}
      {notificationModal.show && (
        <div className="notification-modal-overlay">
          <div className="notification-modal">
            <div className="notification-modal-header">
              <div className="notification-modal-icon">
                {getNotificationIcon()}
              </div>
              <h3 className="notification-modal-title">{notificationModal.title}</h3>
              <button
                className="notification-modal-close"
                onClick={() => setNotificationModal(prev => ({ ...prev, show: false }))}
              >
                ×
              </button>
            </div>

            <div className="notification-modal-body">
              <p className="notification-modal-message">{notificationModal.message}</p>
            </div>

            <div className="notification-modal-footer">
              {notificationModal.showCancelButton && (
                <button
                  className="notification-modal-btn notification-modal-btn-cancel"
                  onClick={() => setNotificationModal(prev => ({ ...prev, show: false }))}
                >
                  Hủy
                </button>
              )}

              {notificationModal.showConfirmButton && (
                <button
                  className="notification-modal-btn notification-modal-btn-confirm"
                  onClick={notificationModal.onConfirm}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM MODAL ================= */}
      {confirmModal.show && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3 className="confirm-modal-title">{confirmModal.title}</h3>
            </div>

            <div className="confirm-modal-body">
              <p className="confirm-modal-message">{confirmModal.message}</p>
            </div>

            <div className="confirm-modal-footer">
              <button
                className="confirm-modal-btn confirm-modal-btn-cancel"
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
              >
                Hủy
              </button>

              <button
                className="confirm-modal-btn confirm-modal-btn-confirm"
                onClick={confirmModal.onConfirm}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}