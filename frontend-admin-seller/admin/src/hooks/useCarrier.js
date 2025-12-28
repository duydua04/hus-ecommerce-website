import { useState, useCallback } from "react";
import carrierService from "../api/CarrierService";

const useCarrier = () => {
  const [carriers, setCarriers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch danh sách carriers với search và pagination
  const fetchCarriers = useCallback(
    async ({ q = "", limit = 10, offset = 0 } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const res = await carrierService.listCarriers({ q, limit, offset });

        if (Array.isArray(res)) {
          setCarriers(res);
          setTotal(res.length);
        } else if (Array.isArray(res?.data)) {
          setCarriers(res.data);
          setTotal(res.total ?? 0);
        } else {
          setCarriers([]);
          setTotal(0);
        }
      } catch (err) {
        setError(
          err.detail || err.message || "Lỗi khi tải danh sách vận chuyển"
        );
        setCarriers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Lấy chi tiết carrier
  const getCarrierById = useCallback(async (carrierId) => {
    setLoading(true);
    setError(null);

    try {
      const carrier = await carrierService.getCarrierDetail(carrierId);
      return carrier;
    } catch (err) {
      const errorMsg =
        err.detail || "Không thể tải thông tin đơn vị vận chuyển";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo carrier mới
  const createCarrier = useCallback(async (carrierData) => {
    setLoading(true);
    try {
      await carrierService.createCarrier(carrierData);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật carrier và tự động update state
  const updateCarrier = useCallback(async (carrierId, carrierData) => {
    setLoading(true);
    try {
      const updated = await carrierService.updateCarrier(
        carrierId,
        carrierData
      );
      setCarriers((prev) =>
        prev.map((c) => (c.carrier_id === carrierId ? updated : c))
      );
      return updated;
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa carrier và tự động update state
  const deleteCarrier = useCallback(async (carrierId) => {
    setLoading(true);
    try {
      await carrierService.deleteCarrier(carrierId);
      setCarriers((prev) => prev.filter((c) => c.carrier_id !== carrierId));
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload avatar và tự động update state
  const uploadCarrierAvatar = useCallback(async (carrierId, file) => {
    setLoading(true);
    try {
      const updated = await carrierService.uploadAvatar(carrierId, file);
      setCarriers((prev) =>
        prev.map((c) => (c.carrier_id === carrierId ? updated : c))
      );
      return updated;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    carriers,
    total,
    loading,
    error,
    fetchCarriers,
    getCarrierById,
    createCarrier,
    updateCarrier,
    deleteCarrier,
    uploadCarrierAvatar,
    clearError: () => setError(null),
  };
};

export default useCarrier;
