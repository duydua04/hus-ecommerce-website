import React, { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import useDashboard from "../../hooks/useDashboard";

import "../../assets/styles/page.scss";
import "./Dashboard.scss";

export default function DashboardContent() {
  const {
    stats,
    chart,
    topProducts,
    loading,
    error,
    syncing,
    fetchDashboard,
    syncDashboard,
    clearError,
  } = useDashboard();

  const [chartView, setChartView] = useState("monthly");
  const [successMessage, setSuccessMessage] = useState("");

  /* FETCH INITIAL DATA */
  useEffect(() => {
    fetchDashboard(chartView);
  }, [fetchDashboard]);

  /* HANDLERS */
  const handleChartViewChange = (view) => {
    setChartView(view);
    fetchDashboard(view);
  };

  // Đồng bộ lại toàn bộ (recalculate từ database)
  const handleSyncClick = async () => {
    try {
      await syncDashboard();
      setSuccessMessage("Đang đồng bộ dữ liệu, vui lòng đợi trong giây lát...");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Sync failed:", err);
    }
  };

  /* FORMAT NUMBER */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  /* CALCULATE STATS */
  const calculatePercentage = (part, total) => {
    if (total === 0) return 0;
    return ((part / total) * 100).toFixed(1);
  };

  /* RENDER CHART */
  const renderChart = () => {
    const labels =
      chartView === "monthly"
        ? [
            "T1",
            "T2",
            "T3",
            "T4",
            "T5",
            "T6",
            "T7",
            "T8",
            "T9",
            "T10",
            "T11",
            "T12",
          ]
        : Array.from({ length: chart.data.length }, (_, i) => i + 1);

    const maxValue = Math.max(...chart.data, 1);

    return (
      <div className="chart">
        <div className="chart__header">
          <h3 className="chart__title">{chart.label}</h3>
          <div className="chart__controls">
            <button
              className={`chart__btn ${
                chartView === "monthly" ? "chart__btn--active" : ""
              }`}
              onClick={() => handleChartViewChange("monthly")}
            >
              Theo tháng
            </button>
            <button
              className={`chart__btn ${
                chartView === "daily" ? "chart__btn--active" : ""
              }`}
              onClick={() => handleChartViewChange("daily")}
            >
              Theo ngày
            </button>
          </div>
        </div>

        <div className="chart__content">
          <div className="chart__bars">
            {chart.data.map((value, index) => {
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
              return (
                <div key={index} className="chart__bar-wrapper">
                  <div className="chart__bar-container">
                    <div
                      className="chart__bar"
                      style={{ height: `${height}%` }}
                      title={`${labels[index]}: ${formatCurrency(value)}`}
                    >
                      {value > 0 && (
                        <span className="chart__bar-value">
                          {formatCurrency(value)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="chart__label">{labels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* RENDER */
  return (
    <main className="main dashboard">
      {/* Header với nút đồng bộ */}
      <div className="dashboard__header">
        <div className="dashboard__title-section">
          <h2 className="dashboard__title">Dashboard</h2>
        </div>

        <div className="dashboard__actions">
          {/* Nút đồng bộ lại */}
          <button
            className="btn btn--icon btn--primary"
            onClick={handleSyncClick}
            disabled={syncing || loading}
            title="Đồng bộ lại toàn bộ dữ liệu từ database"
          >
            <i className={`bx bx-sync ${syncing ? "spin" : ""}`}></i>
            <span>{syncing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}</span>
          </button>
        </div>
      </div>

      {/* Thông báo */}
      {error && (
        <div className="dashboard__alert alert alert-error">
          <span>{error}</span>
          <button onClick={clearError} className="alert-close">
            <X size={18} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="dashboard__alert alert alert-success">
          <i className="bx bx-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {loading && (
        <div className="dashboard__loading">
          <div className="spinner"></div>
          <span>Đang tải dữ liệu...</span>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="dashboard__stats">
        <div className="stats-card stats-card--revenue">
          <div className="stats-card__icon stats-card__icon--primary">
            <i className="bx bx-dollar-circle"></i>
          </div>
          <div className="stats-card__content">
            <h4 className="stats-card__title">Doanh thu</h4>
            <p className="stats-card__value">{formatCurrency(stats.revenue)}</p>
            <span className="stats-card__badge stats-card__badge--success">
              <TrendingUp size={14} />
              Đã hoàn thành
            </span>
          </div>
        </div>

        <div className="stats-card stats-card--orders">
          <div className="stats-card__icon stats-card__icon--info">
            <i className="bx bx-shopping-bag"></i>
          </div>
          <div className="stats-card__content">
            <h4 className="stats-card__title">Tổng đơn hàng</h4>
            <p className="stats-card__value">
              {formatNumber(stats.total_orders)}
            </p>
            <span className="stats-card__desc">
              {calculatePercentage(
                stats.total_orders - stats.cancelled_orders,
                stats.total_orders
              )}
              % thành công
            </span>
          </div>
        </div>

        <div className="stats-card stats-card--pending">
          <div className="stats-card__icon stats-card__icon--warning">
            <i className="bx bx-time-five"></i>
          </div>
          <div className="stats-card__content">
            <h4 className="stats-card__title">Đơn chờ xử lý</h4>
            <p className="stats-card__value">
              {formatNumber(stats.pending_orders)}
            </p>
            <span className="stats-card__desc">
              {calculatePercentage(stats.pending_orders, stats.total_orders)}%
              tổng đơn
            </span>
          </div>
        </div>

        <div className="stats-card stats-card--cancelled">
          <div className="stats-card__icon stats-card__icon--danger">
            <i className="bx bx-x-circle"></i>
          </div>
          <div className="stats-card__content">
            <h4 className="stats-card__title">Đơn bị hủy</h4>
            <p className="stats-card__value">
              {formatNumber(stats.cancelled_orders)}
            </p>
            <span className="stats-card__badge stats-card__badge--danger">
              <TrendingDown size={14} />
              {calculatePercentage(stats.cancelled_orders, stats.total_orders)}%
            </span>
          </div>
        </div>
      </div>

      {/* CHART và TOP PRODUCTS container */}
      <div className="dashboard__content">
        {/* CHART */}
        <div className="dashboard__chart-section">{renderChart()}</div>

        {/* TOP PRODUCTS */}
        <div className="dashboard__products-section">
          <div className="products-header">
            <h3 className="products-title">Top 5 sản phẩm bán chạy</h3>
            <p className="products-desc">Sản phẩm có doanh thu cao nhất</p>
          </div>

          {topProducts.length === 0 ? (
            <div className="products-empty">
              <i className="bx bx-package"></i>
              <p>Chưa có dữ liệu sản phẩm</p>
            </div>
          ) : (
            <div className="products-list">
              {topProducts.map((product, index) => (
                <div key={index} className="product-item">
                  <div className="product-item__rank">#{index + 1}</div>

                  <div className="product-item__image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="product-item__placeholder">
                        <i className="bx bx-image"></i>
                      </div>
                    )}
                  </div>

                  <div className="product-item__info">
                    <h4 className="product-item__name">{product.name}</h4>
                    <div className="product-item__stats">
                      <span className="product-item__sold">
                        <i className="bx bx-cart"></i>
                        Đã bán: {formatNumber(product.sold)}
                      </span>
                      <span className="product-item__revenue">
                        <i className="bx bx-dollar"></i>
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                  </div>

                  <div className="product-item__badge">
                    {index === 0 && (
                      <span className="badge badge--gold">
                        <i className="bx bx-medal"></i>
                      </span>
                    )}
                    {index === 1 && (
                      <span className="badge badge--silver">
                        <i className="bx bx-medal"></i>
                      </span>
                    )}
                    {index === 2 && (
                      <span className="badge badge--bronze">
                        <i className="bx bx-medal"></i>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
