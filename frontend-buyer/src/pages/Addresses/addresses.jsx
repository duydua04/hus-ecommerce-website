// src/pages/Addresses/addresses.jsx
import React, { useState, useEffect } from 'react';
import { Home, Building2, MapPin, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import './addresses.css';
import addressData from '../../data/vietnam-address.json';

const LABELS = {
  home: { icon: Home, text: 'Nhà riêng', color: '#3b82f6' },
  office: { icon: Building2, text: 'Văn phòng', color: '#8b5cf6' },
  other: { icon: MapPin, text: 'Khác', color: '#6b7280' }
};

export default function Addresses() {
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

  // Load provinces khi component mount
  useEffect(() => {
    if (addressData && addressData.data) {
      setProvinces(addressData.data);

      // Set tỉnh đầu tiên làm mặc định
      if (addressData.data.length > 0) {
        const firstProvince = addressData.data[0];
        setSelectedProvince(firstProvince);
        setFormData(prev => ({ ...prev, province: firstProvince.name }));

        // Load districts của tỉnh đầu tiên
        if (firstProvince.level2s && firstProvince.level2s.length > 0) {
          setDistricts(firstProvince.level2s);
        }
      }
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, []);

  // ============== LOAD DANH SÁCH ĐỊA CHỈ ==============
  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await api.address.list();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load addresses error:', err);

      if (err.message === 'Failed to fetch') {
        alert('❌ Không thể kết nối server. Vui lòng kiểm tra backend.');
      } else {
        alert(err.message || 'Không thể tải danh sách địa chỉ');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============== XỬ LÝ THAY ĐỔI TỈNH ==============
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

    // Load districts
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

  // ============== XỬ LÝ THAY ĐỔI HUYỆN ==============
  const handleDistrictChange = (e) => {
    const districtName = e.target.value;
    const district = districts.find(d => d.name === districtName);

    setSelectedDistrict(district);
    setFormData({
      ...formData,
      district: districtName,
      ward: ''
    });

    // Load wards
    if (district && district.level3s) {
      setWards(district.level3s);
    } else {
      setWards([]);
    }
  };

  // ============== XỬ LÝ THAY ĐỔI XÃ ==============
  const handleWardChange = (e) => {
    setFormData({
      ...formData,
      ward: e.target.value
    });
  };

  // ============== RESET FORM ==============
  const resetForm = () => {
    // Reset về tỉnh đầu tiên
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

  // ============== MỞ MODAL ==============
  const openModal = (address = null) => {
    if (address) {
      setEditingAddress(address);

      // Tìm province, district, ward từ tên
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

  // ============== ĐÓNG MODAL ==============
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // ============== XỬ LÝ SUBMIT ==============
  const handleSubmit = async () => {
    // Validate cơ bản
    if (!formData.fullname.trim()) return alert('Vui lòng nhập họ và tên');
    if (!formData.phone.trim()) return alert('Vui lòng nhập số điện thoại');
    if (!formData.street.trim()) return alert('Vui lòng nhập địa chỉ cụ thể');
    if (!formData.province) return alert('Vui lòng chọn tỉnh/thành phố');
    if (!formData.district) return alert('Vui lòng chọn quận/huyện');
    if (!formData.ward) return alert('Vui lòng chọn phường/xã');

    // Chuẩn bị payload cho phần AddressContent
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

        // Backend tách biệt API update content và API update link (label/default)
        // 1. Cập nhật thông tin địa chỉ (fullname, street...)
        await api.address.updateContent(id, contentPayload);

        // 2. Cập nhật label và trạng thái default
        await api.address.updateLink(id, {
          label: formData.label,
          is_default: formData.is_default
        });

        alert('✅ Cập nhật địa chỉ thành công');
      } else {
        // TẠO MỚI - sử dụng đúng format API
        await api.address.create(
          contentPayload,
          formData.is_default,
          formData.label
        );

        alert('✅ Thêm địa chỉ thành công');
      }

      await loadAddresses();
      closeModal();
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // ============== ĐẶT ĐỊA CHỈ MẶC ĐỊNH ==============
  const handleSetDefault = async (address) => {
    if (address.is_default) return;

    try {
      setLoading(true);
      await api.address.setDefault(address.buyer_address_id);
      await loadAddresses();
      alert('✅ Đã đặt làm địa chỉ mặc định');
    } catch (err) {
      console.error('Set default error:', err);
      alert(err.message || 'Không thể đặt địa chỉ mặc định');
    } finally {
      setLoading(false);
    }
  };

  // ============== XÓA ĐỊA CHỈ ==============
  const handleDelete = async (address) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    try {
      setLoading(true);
      await api.address.delete(address.buyer_address_id);
      await loadAddresses();
      alert('✅ Xóa địa chỉ thành công');
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message || 'Không thể xóa địa chỉ');
    } finally {
      setLoading(false);
    }
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

  // ============== RENDER ==============
  return (
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

        {/* MODAL */}
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
      </div>
    </div>
  );
}