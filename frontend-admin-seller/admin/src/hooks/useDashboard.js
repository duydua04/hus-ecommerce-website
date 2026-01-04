import { useState, useCallback, useEffect } from "react";
import dashboardService from "../api/DashboardService";
import { WebSocketClient } from "./websocket";

/* Utils */

const getErrorMessage = (err) =>
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
    arr?.map((u) => ({
      id: u.id || 0,
      name: u.name || "",
      avatar: u.avatar || null,
      value: u.value || 0,
      display: u.display || "",
    })) || [],

  topCategories: (arr = []) =>
    arr?.map((c) => ({
      id: c.id || 0,
      name: c.name || "",
      image: c.image || null,
      value: c.value || 0,
      display: c.display || "",
    })) || [],

  carriers: (arr = []) =>
    arr?.map((c) => ({
      id: c.id || 0,
      name: c.name || "",
      logo: c.logo || null,
      count: c.count || 0,
    })) || [],
};

/* Hook */

export default function useDashboard() {
  const [summary, setSummary] = useState(normalize.summary());
  const [topBuyers, setTopBuyers] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [carriers, setCarriers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [syncing, setSyncing] = useState(false);

  // Helper to wrap async operations
  const runAsync = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(getErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all dashboard data
  const fetchDashboard = useCallback(
    async (
      buyerCriteria = "orders",
      sellerCriteria = "orders",
      categoryCriteria = "sold"
    ) => {
      return runAsync(async () => {
        const [summary, buyers, sellers, categories, carriers] =
          await Promise.all([
            dashboardService.getSummary(),
            dashboardService.getTopBuyers(buyerCriteria),
            dashboardService.getTopSellers(sellerCriteria),
            dashboardService.getTopCategories(categoryCriteria),
            dashboardService.getCarriers(),
          ]);

        setSummary(normalize.summary(summary));
        setTopBuyers(normalize.topUsers(buyers));
        setTopSellers(normalize.topUsers(sellers));
        setTopCategories(normalize.topCategories(categories));
        setCarriers(normalize.carriers(carriers));

        return { summary, buyers, sellers, categories, carriers };
      });
    },
    [runAsync]
  );

  // Force sync with backend
  const syncDashboard = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await dashboardService.syncData();
      setTimeout(() => fetchDashboard(), 2500);
      return result;
    } catch (e) {
      setError(getErrorMessage(e));
      throw e;
    } finally {
      setSyncing(false);
    }
  }, [fetchDashboard]);

  // WebSocket real-time updates
  useEffect(() => {
    WebSocketClient.connect();

    const unsubscribe = WebSocketClient.subscribe("dashboard", (message) => {
      if (message?.type?.toUpperCase() !== "DASHBOARD_UPDATED") return;

      const { summary, buyers, sellers, categories, carriers } =
        message.data || {};

      if (summary) setSummary(normalize.summary(summary));
      if (buyers) setTopBuyers(normalize.topUsers(buyers));
      if (sellers) setTopSellers(normalize.topUsers(sellers));
      if (categories) setTopCategories(normalize.topCategories(categories));
      if (carriers) setCarriers(normalize.carriers(carriers));
    });

    return unsubscribe;
  }, []);

  return {
    // State
    summary,
    topBuyers,
    topSellers,
    topCategories,
    carriers,
    loading,
    error,
    syncing,

    // Actions
    fetchDashboard,
    syncDashboard,
    clearError: () => setError(null),
  };
}
