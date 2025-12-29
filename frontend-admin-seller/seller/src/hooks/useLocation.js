import { useState, useCallback } from "react";
import locationService from "../api/LocationService";

/* Utils */

const extractErrorMessage = (err) => {
  if (Array.isArray(err?.detail)) {
    return err.detail.map((e) => e.msg).join(", ");
  }
  return err?.detail || err?.message || "Đã xảy ra lỗi";
};

const normalizeAddress = (data = {}, fallback = {}) => ({
  seller_address_id: data.seller_address_id ?? fallback.seller_address_id,
  label: data.label ?? fallback.label ?? "other",
  is_default:
    typeof data.is_default === "boolean"
      ? data.is_default
      : fallback.is_default ?? false,
  address: {
    fullname: data.fullname ?? fallback.address?.fullname ?? "",
    phone: data.phone ?? fallback.address?.phone ?? "",
    street: data.street ?? fallback.address?.street ?? "",
    ward: data.ward ?? fallback.address?.ward ?? "",
    district: data.district ?? fallback.address?.district ?? "",
    province: data.province ?? fallback.address?.province ?? "",
  },
});

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
        const normalized = normalizeAddress({ ...res, ...addressData });
        setAddresses((prev) => [normalized, ...prev]);
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
              ? normalizeAddress({ ...res, ...addressData }, a)
              : a
          )
        );
        return res;
      }),
    []
  );

  /* ===== Update link ===== */
  const updateAddressLink = useCallback(
    (id, linkData) =>
      run(async () => {
        const res = await locationService.updateAddressLink(id, linkData);
        setAddresses((prev) =>
          prev.map((a) =>
            a.seller_address_id === id ? normalizeAddress(res, a) : a
          )
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
