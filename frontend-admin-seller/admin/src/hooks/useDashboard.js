import { useState, useCallback, useEffect, useRef } from "react";
import dashboardService from "../api/DashboardService";

/* Utils  */

const errorMessage = (err) =>
  Array.isArray(err?.detail)
    ? err.detail.map((e) => e.msg).join(", ")
    : err?.detail || err?.message || "Đã xảy ra lỗi";

const normalize = {
  summary: (d = {}) => ({
    buyers: d.buyers || 0,
    sellers: d.sellers || 0,
    orders: d.orders || 0,
    revenue: d.revenue || 0,
  }),

  topUsers: (arr = []) =>
    Array.isArray(arr)
      ? arr.map((u) => ({
          id: u.id || 0,
          name: u.name || "",
          avatar: u.avatar || null,
          value: u.value || 0,
          display: u.display || "",
        }))
      : [],

  topCategories: (arr = []) =>
    Array.isArray(arr)
      ? arr.map((c) => ({
          id: c.id || 0,
          name: c.name || "",
          image: c.image || null,
          value: c.value || 0,
          display: c.display || "",
        }))
      : [],

  carriers: (arr = []) =>
    Array.isArray(arr)
      ? arr.map((c) => ({
          id: c.id || 0,
          name: c.name || "",
          logo: c.logo || null,
          count: c.count || 0,
        }))
      : [],
};

/* ================= Hook ================= */

const useDashboard = () => {
  const [summary, setSummary] = useState(normalize.summary());
  const [topBuyers, setTopBuyers] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [carriers, setCarriers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const refreshIntervalRef = useRef(null);

  /* ===== Helper runner ===== */
  const run = async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(errorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  /* ===== API Functions ===== */
  const fetchSummary = useCallback(
    () =>
      run(async () => {
        const data = await dashboardService.getSummary();
        setSummary(normalize.summary(data));
        setLastUpdate(new Date());
        return data;
      }),
    []
  );

  const fetchTopBuyers = useCallback(
    (criteria = "orders") =>
      run(async () => {
        const data = await dashboardService.getTopBuyers(criteria);
        setTopBuyers(normalize.topUsers(data));
        return data;
      }),
    []
  );

  const fetchTopSellers = useCallback(
    (criteria = "orders") =>
      run(async () => {
        const data = await dashboardService.getTopSellers(criteria);
        setTopSellers(normalize.topUsers(data));
        return data;
      }),
    []
  );

  const fetchTopCategories = useCallback(
    (criteria = "sold") =>
      run(async () => {
        const data = await dashboardService.getTopCategories(criteria);
        setTopCategories(normalize.topCategories(data));
        return data;
      }),
    []
  );

  const fetchCarriers = useCallback(
    () =>
      run(async () => {
        const data = await dashboardService.getCarriers();
        setCarriers(normalize.carriers(data));
        return data;
      }),
    []
  );

  const fetchDashboard = useCallback(
    async (
      buyerCriteria = "orders",
      sellerCriteria = "orders",
      categoryCriteria = "sold"
    ) => {
      return run(async () => {
        const [
          summaryData,
          buyersData,
          sellersData,
          categoriesData,
          carriersData,
        ] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getTopBuyers(buyerCriteria),
          dashboardService.getTopSellers(sellerCriteria),
          dashboardService.getTopCategories(categoryCriteria),
          dashboardService.getCarriers(),
        ]);

        setSummary(normalize.summary(summaryData));
        setTopBuyers(normalize.topUsers(buyersData));
        setTopSellers(normalize.topUsers(sellersData));
        setTopCategories(normalize.topCategories(categoriesData));
        setCarriers(normalize.carriers(carriersData));
        setLastUpdate(new Date());

        return {
          summary: summaryData,
          buyers: buyersData,
          sellers: sellersData,
          categories: categoriesData,
          carriers: carriersData,
        };
      });
    },
    []
  );

  /* ===== Force Sync ===== */
  const syncDashboard = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await dashboardService.syncData();
      // Sau khi trigger sync, đợi 2-3 giây rồi fetch lại data
      setTimeout(() => {
        fetchDashboard();
      }, 2500);
      return result;
    } catch (e) {
      setError(errorMessage(e));
      throw e;
    } finally {
      setSyncing(false);
    }
  }, [fetchDashboard]);

  /* ===== Auto-refresh (Polling) ===== */
  const startAutoRefresh = useCallback(
    (intervalSeconds = 30) => {
      stopAutoRefresh();

      refreshIntervalRef.current = setInterval(() => {
        fetchDashboard();
      }, intervalSeconds * 1000);

      setAutoRefresh(true);
    },
    [fetchDashboard]
  );

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    setAutoRefresh(false);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    if (autoRefresh) {
      stopAutoRefresh();
    } else {
      startAutoRefresh(30);
    }
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh]);

  /* ===== Manual Refresh ===== */
  const refreshDashboard = useCallback(
    async (buyerCriteria, sellerCriteria, categoryCriteria) => {
      return fetchDashboard(buyerCriteria, sellerCriteria, categoryCriteria);
    },
    [fetchDashboard]
  );

  /* ===== Cleanup ===== */
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  return {
    summary,
    topBuyers,
    topSellers,
    topCategories,
    carriers,
    loading,
    error,
    lastUpdate,
    autoRefresh,
    syncing,

    fetchSummary,
    fetchTopBuyers,
    fetchTopSellers,
    fetchTopCategories,
    fetchCarriers,
    fetchDashboard,
    refreshDashboard,
    syncDashboard,

    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,

    clearError: () => setError(null),
  };
};

export default useDashboard;
