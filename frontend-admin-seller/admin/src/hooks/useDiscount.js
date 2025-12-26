import { useState, useCallback } from "react";
import discountService from "../api/DiscountService";

const useDiscount = () => {
  const [discounts, setDiscounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch danh sách discounts với search và pagination
  const fetchDiscounts = useCallback(
    async ({ q = "", limit = 10, offset = 0 } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const res = await discountService.listDiscounts({ q, limit, offset });

        if (Array.isArray(res)) {
          setDiscounts(res);
          setTotal(res.length);
        } else if (Array.isArray(res?.data)) {
          setDiscounts(res.data);
          setTotal(res.total ?? 0);
        } else {
          setDiscounts([]);
          setTotal(0);
        }
      } catch (err) {
        setError(
          err.detail || err.message || "Lỗi khi tải danh sách mã giảm giá"
        );
        setDiscounts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Tạo discount mới
  const createDiscount = useCallback(async (discountData) => {
    setLoading(true);
    setError(null);

    try {
      const created = await discountService.createDiscount(discountData);
      return created;
    } catch (err) {
      setError(err?.detail || "Tạo mã giảm giá thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật discount và tự động update state
  const updateDiscount = useCallback(async (discountId, discountData) => {
    setLoading(true);
    try {
      const updated = await discountService.updateDiscount(
        discountId,
        discountData
      );
      setDiscounts((prev) =>
        prev.map((d) => (d.discount_id === discountId ? updated : d))
      );
      return updated;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bật/Tắt trạng thái discount
  const setStatus = useCallback(async (discountId, isActive) => {
    setLoading(true);
    try {
      const updated = await discountService.setStatus(discountId, isActive);
      setDiscounts((prev) =>
        prev.map((d) => (d.discount_id === discountId ? updated : d))
      );
      return updated;
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa discount và tự động update state
  const deleteDiscount = useCallback(async (discountId) => {
    setLoading(true);
    try {
      await discountService.deleteDiscount(discountId);
      setDiscounts((prev) => prev.filter((d) => d.discount_id !== discountId));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    discounts,
    total,
    loading,
    error,
    fetchDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    setStatus,
    clearError: () => setError(null),
  };
};

export default useDiscount;
