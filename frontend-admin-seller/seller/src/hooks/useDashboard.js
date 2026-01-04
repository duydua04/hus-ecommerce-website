import { useState, useCallback, useEffect, useRef } from "react";
import dashboardService from "../api/DashboardService";
import { WebSocketClient } from "./websocket";

/* Utils  */

const errorMessage = (err) =>
  Array.isArray(err?.detail)
    ? err.detail.map((e) => e.msg).join(", ")
    : err?.detail || err?.message || "Đã xảy ra lỗi";

const normalize = {
  stats: (d = {}) => ({
    revenue: d.revenue || 0,
    total_orders: d.total_orders || 0,
    pending_orders: d.pending_orders || 0,
    cancelled_orders: d.cancelled_orders || 0,
  }),

  chart: (d = {}) => ({
    data: Array.isArray(d.data) ? d.data : [],
    label: d.label || "",
  }),

  products: (arr = []) =>
    Array.isArray(arr)
      ? arr.map((p) => ({
          name: p.name || "",
          image: p.image || null,
          sold: p.sold || 0,
          revenue: p.revenue || 0,
        }))
      : [],
};

/* Hook */

const useDashboard = () => {
  const [stats, setStats] = useState(normalize.stats());
  const [chart, setChart] = useState(normalize.chart());
  const [topProducts, setTopProducts] = useState([]);
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
  const fetchStats = useCallback(
    () =>
      run(async () => {
        const data = await dashboardService.getStats();
        setStats(normalize.stats(data));
        setLastUpdate(new Date());
        return data;
      }),
    []
  );

  const fetchChart = useCallback(
    (view = "monthly") =>
      run(async () => {
        const data = await dashboardService.getChart(view);
        setChart(normalize.chart(data));
        return data;
      }),
    []
  );

  const fetchTopProducts = useCallback(
    () =>
      run(async () => {
        const data = await dashboardService.getTopProducts();
        setTopProducts(normalize.products(data));
        return data;
      }),
    []
  );

  const fetchDashboard = useCallback(async (view = "monthly") => {
    return run(async () => {
      const [s, c, p] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getChart(view),
        dashboardService.getTopProducts(),
      ]);

      setStats(normalize.stats(s));
      setChart(normalize.chart(c));
      setTopProducts(normalize.products(p));
      setLastUpdate(new Date());

      return { stats: s, chart: c, products: p };
    });
  }, []);

  /* ===== Force Sync ===== */
  const syncDashboard = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await dashboardService.syncDashboard();
      setTimeout(() => {
        fetchDashboard("monthly");
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
        fetchDashboard("monthly");
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
    async (view = "monthly") => {
      return fetchDashboard(view);
    },
    [fetchDashboard]
  );

  /* Tự động cập nhật khi có đơn hàng mới */
  useEffect(() => {
    WebSocketClient.connect();

    const unsubscribe = WebSocketClient.subscribe("dashboard", (message) => {
      // message = {type: "DASHBOARD_UPDATED", data: {stats, chart, products}}
      if (message?.type !== "DASHBOARD_UPDATED") return;

      const { stats: s, chart: c, products: p } = message.data || {};

      if (s) setStats(normalize.stats(s));
      if (c) setChart(normalize.chart(c));
      if (p) setTopProducts(normalize.products(p));

      setLastUpdate(new Date());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /* ===== Cleanup ===== */
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  return {
    stats,
    chart,
    topProducts,
    loading,
    error,
    lastUpdate,
    autoRefresh,
    syncing,

    fetchStats,
    fetchChart,
    fetchTopProducts,
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
