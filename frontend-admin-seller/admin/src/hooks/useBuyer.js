import { useState, useCallback } from "react";
import buyerService from "../api/BuyerService";

const useBuyer = () => {
  const [buyers, setBuyers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch danh sách buyers với search và pagination
  const fetchBuyers = useCallback(
    async ({ q = "", active_only = true, limit = 10, offset = 0 } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const res = await buyerService.listBuyers({
          q,
          active_only,
          limit,
          offset,
        });
        // Kiểm tra cấu trúc response
        if (res && typeof res === "object" && "data" in res) {
          setBuyers(Array.isArray(res.data) ? res.data : []);
          const totalCount = res.meta?.total ?? res.total ?? 0;
          setTotal(totalCount);
        } else if (Array.isArray(res)) {
          setBuyers(res);
          setTotal(res.length);
        } else {
          setBuyers([]);
          setTotal(0);
        }
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi tải danh sách buyers");
        setBuyers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Xóa (vô hiệu hóa) buyer và tự động update state
  const deleteBuyer = useCallback(async (buyerId) => {
    setLoading(true);
    try {
      await buyerService.deleteBuyer(buyerId);
      setBuyers((prev) => prev.filter((b) => b.buyer_id !== buyerId));
      setTotal((prev) => prev - 1);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    buyers,
    total,
    loading,
    error,
    fetchBuyers,
    deleteBuyer,
    clearError: () => setError(null),
  };
};

export default useBuyer;
