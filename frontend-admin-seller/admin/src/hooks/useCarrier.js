import { useState, useCallback } from "react";
import carrierService from "../api/CarrierService";

/**
 * Custom hook quản lý logic carrier
 */
export const useCarrier = () => {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lấy danh sách carriers
   */
  const fetchCarriers = useCallback(async (searchQuery = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await carrierService.listCarriers(searchQuery);
      setCarriers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.detail || "Lỗi khi lấy danh sách đơn vị vận chuyển");
      console.error("Fetch carriers error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tạo carrier mới
   */
  const createCarrier = useCallback(async (carrierData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await carrierService.createCarrier(carrierData);
      setCarriers((prev) => [...prev, result]);
      return result;
    } catch (err) {
      const errorMsg = err.detail || "Lỗi khi thêm đơn vị vận chuyển";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật carrier
   */
  const updateCarrier = useCallback(async (carrierId, carrierData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await carrierService.updateCarrier(carrierId, carrierData);
      setCarriers((prev) =>
        prev.map((c) => (c.carrier_id === carrierId ? result : c))
      );
      return result;
    } catch (err) {
      const errorMsg = err.detail || "Lỗi khi cập nhật đơn vị vận chuyển";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xóa carrier
   */
  const deleteCarrier = useCallback(async (carrierId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await carrierService.deleteCarrier(carrierId);
      if (result.deleted) {
        setCarriers((prev) => prev.filter((c) => c.carrier_id !== carrierId));
      }
      return result;
    } catch (err) {
      const errorMsg = err.detail || "Lỗi khi xóa đơn vị vận chuyển";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload avatar
   */
  const uploadCarrierAvatar = useCallback(async (carrierId, file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await carrierService.uploadAvatar(carrierId, file);
      setCarriers((prev) =>
        prev.map((c) => (c.carrier_id === carrierId ? result : c))
      );
      return result;
    } catch (err) {
      const errorMsg = err.detail || "Lỗi khi tải lên avatar";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xóa lỗi
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    carriers,
    setCarriers,
    loading,
    error,
    fetchCarriers,
    createCarrier,
    updateCarrier,
    deleteCarrier,
    uploadCarrierAvatar,
    clearError,
  };
};
