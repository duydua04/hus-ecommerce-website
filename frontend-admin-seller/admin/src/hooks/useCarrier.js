import { useState, useCallback } from "react";
import carrierService from "../api/CarrierService";

const useCarrier = () => {
  const [carriers, setCarriers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCarriers = useCallback(
    async ({ searchQuery = "", limit = 10, offset = 0 } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const res = await carrierService.listCarriers({
          q: searchQuery,
          limit,
          offset,
        });

        // Backend trả về object → không dùng Array.isArray
        if (res && Array.isArray(res.data)) {
          setCarriers(res.data);
          setTotal(res.total ?? 0);
        } else {
          console.warn("Unexpected response format:", res);
          setCarriers([]);
          setTotal(0);
        }
      } catch (err) {
        const errorMsg =
          err.detail || err.message || "Lỗi khi tải danh sách vận chuyển";
        setError(errorMsg);
        setCarriers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createCarrier = useCallback(
    async (carrierData) => {
      setLoading(true);
      try {
        await carrierService.createCarrier(carrierData);
        await fetchCarriers(); // refresh
      } finally {
        setLoading(false);
      }
    },
    [fetchCarriers]
  );

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

  const deleteCarrier = useCallback(async (carrierId) => {
    setLoading(true);
    try {
      await carrierService.deleteCarrier(carrierId);
      setCarriers((prev) => prev.filter((c) => c.carrier_id !== carrierId));
    } finally {
      setLoading(false);
    }
  }, []);

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
    createCarrier,
    updateCarrier,
    deleteCarrier,
    uploadCarrierAvatar,
    clearError: () => setError(null),
  };
};

export default useCarrier;
