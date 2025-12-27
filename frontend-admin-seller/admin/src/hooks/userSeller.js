import { useState, useCallback } from "react";
import sellerService from "../api/SellerService";

const useSeller = () => {
  const [sellers, setSellers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch danh sách sellers với search và pagination
  const fetchSellers = useCallback(
    async ({ q = "", active_only = true, limit = 10, offset = 0 } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const res = await sellerService.listSellers({
          q,
          active_only,
          limit,
          offset,
        });
        // Kiểm tra cấu trúc response
        if (res && typeof res === "object" && "data" in res) {
          setSellers(Array.isArray(res.data) ? res.data : []);
          const totalCount = res.meta?.total ?? res.total ?? 0;
          setTotal(totalCount);
        } else if (Array.isArray(res)) {
          setSellers(res);
          setTotal(res.length);
        } else {
          setSellers([]);
          setTotal(0);
        }
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi tải danh sách sellers");
        setSellers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Xóa (vô hiệu hóa) seller và tự động update state
  const deleteSeller = useCallback(async (sellerId) => {
    setLoading(true);
    try {
      await sellerService.deleteSeller(sellerId);
      setSellers((prev) => prev.filter((s) => s.seller_id !== sellerId));
      setTotal((prev) => prev - 1);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sellers,
    total,
    loading,
    error,
    fetchSellers,
    deleteSeller,
    clearError: () => setError(null),
  };
};

export default useSeller;
