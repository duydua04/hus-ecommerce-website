import { useState, useCallback } from "react";
import locationService from "../api/LocationService";

/* Utils */

const extractErrorMessage = (err) => {
  if (Array.isArray(err?.detail)) {
    return err.detail.map((e) => e.msg).join(", ");
  }
  return err?.detail || err?.message || "Đã xảy ra lỗi";
};

const normalizeAddress = (data = {}, fallback = {}) => {
  // Lấy dữ liệu từ object con 'address' do API trả về cấu trúc lồng nhau
  const sourceAddress = data.address || {};

  return {
    seller_address_id: data.seller_address_id ?? fallback.seller_address_id,
    label: data.label ?? fallback.label ?? "other",
    is_default:
      typeof data.is_default === "boolean"
        ? data.is_default
        : fallback.is_default ?? false,
    address: {
      // Ưu tiên lấy từ sourceAddress (data.address)
      // Nếu không có thì fallback về data gốc hoặc fallback object
      fullname: sourceAddress.fullname ?? data.fullname ?? fallback.address?.fullname ?? "",
      phone: sourceAddress.phone ?? data.phone ?? fallback.address?.phone ?? "",
      street: sourceAddress.street ?? data.street ?? fallback.address?.street ?? "",
      ward: sourceAddress.ward ?? data.ward ?? fallback.address?.ward ?? "",
      district: sourceAddress.district ?? data.district ?? fallback.address?.district ?? "",
      province: sourceAddress.province ?? data.province ?? fallback.address?.province ?? "",
    },
  };
};

/* Hook */

const useLocation = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(extractErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ===== Fetch ===== */
  const fetchAddresses = useCallback(
    () =>
      run(async () => {
        const data = await locationService.getAddresses();
        const normalized = Array.isArray(data)
          ? data.map((i) => normalizeAddress(i))
          : [];
        setAddresses(normalized);
        return normalized;
      }),
    []
  );

  /* ===== Create ===== */
  const createAddress = useCallback(
    (addressData, isDefault = false, label = "other") =>
      run(async () => {
        const res = await locationService.createAddress(
          addressData,
          isDefault,
          label
        );
        // Normalize dữ liệu trả về kết hợp với dữ liệu gửi đi
        const normalized = normalizeAddress({ ...res, ...addressData, address: addressData });

        setAddresses((prev) => {
          // FIX LOGIC: Nếu tạo địa chỉ mới là Default, phải tắt Default của các địa chỉ cũ
          if (isDefault) {
            return [normalized, ...prev.map((a) => ({ ...a, is_default: false }))];
          }
          return [normalized, ...prev];
        });
        return normalized;
      }),
    []
  );

  /* ===== Update content ===== */
  const updateAddressContent = useCallback(
    (id, addressData) =>
      run(async () => {
        const res = await locationService.updateAddressContent(id, addressData);

        setAddresses((prev) =>
          prev.map((a) =>
            a.seller_address_id === id
              // Khi update content, giữ nguyên các thông tin meta (label, is_default) của a
              ? normalizeAddress({ ...res, address: addressData }, a)
              : a
          )
        );
        return res;
      }),
    []
  );

  /* ===== Update link (Label / Default) ===== */
  const updateAddressLink = useCallback(
    (id, linkData) =>
      run(async () => {
        const res = await locationService.updateAddressLink(id, linkData);

        setAddresses((prev) =>
          prev.map((a) => {
            // Cập nhật địa chỉ hiện tại
            if (a.seller_address_id === id) {
              return normalizeAddress(res, a);
            }
            // FIX LOGIC: Nếu địa chỉ được update trở thành Default, tắt Default của các địa chỉ khác
            if (linkData.is_default === true) {
              return { ...a, is_default: false };
            }
            return a;
          })
        );
        return res;
      }),
    []
  );

  /* ===== Set default ===== */
  const setDefaultAddress = useCallback(
    (id) =>
      run(async () => {
        await locationService.setDefaultAddress(id);
        // Logic này đã đúng: set true cho id được chọn, set false cho tất cả id khác
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            is_default: a.seller_address_id === id,
          }))
        );
      }),
    []
  );

  /* ===== Delete ===== */
  const deleteAddress = useCallback(
    (id) =>
      run(async () => {
        await locationService.deleteAddress(id);
        setAddresses((prev) => prev.filter((a) => a.seller_address_id !== id));
      }),
    []
  );

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddressContent,
    updateAddressLink,
    setDefaultAddress,
    deleteAddress,
    clearError: () => setError(null),
    clearAddresses: () => setAddresses([]),
  };
};

export default useLocation;