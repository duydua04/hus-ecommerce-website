import React, { useState, useEffect } from "react";
import { X, TrendingUp, Users, Store, Package } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import useDashboard from "../../hooks/useDashboard";

import "../../assets/styles/page.scss";
import "./Dashboard.scss";

export default function DashboardContent() {
  const {
    summary,
    topBuyers,
    topSellers,
    topCategories,
    carriers,
    loading,
    error,
    syncing,
    fetchDashboard,
    syncDashboard,
    clearError,
  } = useDashboard();

  const [buyerCriteria, setBuyerCriteria] = useState("orders");
  const [sellerCriteria, setSellerCriteria] = useState("orders");
  const [categoryCriteria, setCategoryCriteria] = useState("sold");
  const [successMessage, setSuccessMessage] = useState("");

  /* FETCH INITIAL DATA */
  useEffect(() => {
    fetchDashboard(buyerCriteria, sellerCriteria, categoryCriteria);
  }, [fetchDashboard]);

  /* HANDLERS */
  const handleBuyerCriteriaChange = (criteria) => {
    setBuyerCriteria(criteria);
    fetchDashboard(criteria, sellerCriteria, categoryCriteria);
  };

  const handleSellerCriteriaChange = (criteria) => {
    setSellerCriteria(criteria);
    fetchDashboard(buyerCriteria, criteria, categoryCriteria);
  };

  const handleCategoryCriteriaChange = (criteria) => {
    setCategoryCriteria(criteria);
    fetchDashboard(buyerCriteria, sellerCriteria, criteria);
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

  /* RENDER TOP USERS */
  const renderTopUsers = (users, title, criteria, onCriteriaChange, type) => {
    return (
      <div className="top-section">
        <div className="top-section__header">
          <h3 className="top-section__title">{title}</h3>
          <div className="top-section__controls">
            <button
              className={`top-section__btn ${
                criteria === "orders" ? "top-section__btn--active" : ""
              }`}
              onClick={() => onCriteriaChange("orders")}
            >
              Theo đơn hàng
            </button>
            <button
              className={`top-section__btn ${
                criteria === "revenue" ? "top-section__btn--active" : ""
              }`}
              onClick={() => onCriteriaChange("revenue")}
            >
              Theo doanh thu
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="top-section__empty">
            <i className="bx bx-user"></i>
            <p>Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="top-section__list">
            {users.map((user, index) => (
              <div key={user.id} className="top-item">
                <div className="top-item__rank">#{index + 1}</div>

                <div className="top-item__avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <div className="top-item__placeholder">
                      <i
                        className={`bx ${
                          type === "buyer" ? "bx-user" : "bx-store"
                        }`}
                      ></i>
                    </div>
                  )}
                </div>

                <div className="top-item__info">
                  <h4 className="top-item__name">{user.name}</h4>
                  <span className="top-item__value">{user.display}</span>
                </div>

                <div className="top-item__badge">
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
    );
  };

  /* RENDER TOP CATEGORIES */
  const renderTopCategories = () => {
    return (
      <div className="top-section">
        <div className="top-section__header">
          <h3 className="top-section__title">Top danh mục</h3>
          <div className="top-section__controls">
            <button
              className={`top-section__btn ${
                categoryCriteria === "sold" ? "top-section__btn--active" : ""
              }`}
              onClick={() => handleCategoryCriteriaChange("sold")}
            >
              Theo số lượng
            </button>
            <button
              className={`top-section__btn ${
                categoryCriteria === "revenue" ? "top-section__btn--active" : ""
              }`}
              onClick={() => handleCategoryCriteriaChange("revenue")}
            >
              Theo doanh thu
            </button>
          </div>
        </div>

        {topCategories.length === 0 ? (
          <div className="top-section__empty">
            <i className="bx bx-category"></i>
            <p>Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="top-section__list">
            {topCategories.map((category, index) => (
              <div key={category.id} className="top-item">
                <div className="top-item__rank">#{index + 1}</div>

                <div className="top-item__avatar">
                  {category.image ? (
                    <img src={category.image} alt={category.name} />
                  ) : (
                    <div className="top-item__placeholder">
                      <i className="bx bx-category"></i>
                    </div>
                  )}
                </div>

                <div className="top-item__info">
                  <h4 className="top-item__name">{category.name}</h4>
                  <span className="top-item__value">{category.display}</span>
                </div>

                <div className="top-item__badge">
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
    );
  };

  /* RENDER CARRIERS PIE CHART */
  const renderCarriersPieChart = () => {
    const totalShipments = carriers.reduce((sum, c) => sum + c.count, 0);

    // Màu sắc cho pie chart
    const COLORS = [
      "#667eea",
      "#48bb78",
      "#ed8936",
      "#f56565",
      "#9f7aea",
      "#ec4899",
    ];

    // Chuẩn bị dữ liệu cho pie chart
    const chartData = carriers.map((carrier, index) => ({
      name: carrier.name,
      value: carrier.count,
      percentage:
        totalShipments > 0
          ? ((carrier.count / totalShipments) * 100).toFixed(1)
          : 0,
      color: COLORS[index % COLORS.length],
    }));

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="pie-tooltip">
            <p className="pie-tooltip__name">{data.name}</p>
            <p className="pie-tooltip__value">
              {formatNumber(data.value)} đơn ({data.percentage}%)
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="carriers-section">
        <div className="carriers-section__header">
          <h3 className="carriers-section__title">
            Thống kê đơn vị vận chuyển
          </h3>
          <span className="carriers-section__total">
            Tổng: {formatNumber(totalShipments)} đơn
          </span>
        </div>

        {carriers.length === 0 ? (
          <div className="carriers-section__empty">
            <i className="bx bx-package"></i>
            <p>Chưa có dữ liệu vận chuyển</p>
          </div>
        ) : (
          <div className="pie-chart-container">
            <div className="pie-chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percentage }) => `${percentage}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="pie-legend">
              {chartData.map((entry, index) => (
                <div key={index} className="pie-legend__item">
                  <div
                    className="pie-legend__color"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="pie-legend__info">
                    <span className="pie-legend__name">{entry.name}</span>
                    <span className="pie-legend__value">
                      {formatNumber(entry.value)} đơn ({entry.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* RENDER */
  return (
    <main className="main dashboard">
      {/* Header với nút đồng bộ */}
      <div className="dashboard__header">
        <div className="dashboard__title-section">
          <h2 className="dashboard__title">Tổng quan và thống kê hệ thống</h2>
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

      {/* SUMMARY STATS CARDS */}
      <div className="dashboard__stats">
        <div className="stats-card stats-card--revenue">
          <div className="stats-card__icon stats-card__icon--primary">
            <i className="bx bx-dollar-circle"></i>
          </div>
          <div className="stats-card__content">
            <h4 className="stats-card__title">Tổng doanh thu</h4>
            <p className="stats-card__value">
              {formatCurrency(summary.revenue)}
            </p>
            <span className="stats-card__badge stats-card__badge--success">
              <TrendingUp size={14} />
              Toàn hệ thống
            </span>
          </div>
        </div>

        <div className="stats-card stats-card--orders">
          <div className="stats-card__icon stats-card__icon--info">
            <i className="bx bx-shopping-bag"></i>
          </div>
          <div className="stats-card__content">
            <h4 className="stats-card__title">Tổng đơn hàng</h4>
            <p className="stats-card__value">{formatNumber(summary.orders)}</p>
            <span className="stats-card__desc">Tất cả đơn hàng</span>
          </div>
        </div>

        <div className="stats-card stats-card--buyers">
          <div className="stats-card__icon stats-card__icon--success">
            <Users size={24} />
          </div>
          <div className="stats-card__content">
            <h4 className="stats-card__title">Người mua</h4>
            <p className="stats-card__value">{formatNumber(summary.buyers)}</p>
            <span className="stats-card__desc">Tài khoản đã đăng ký</span>
          </div>
        </div>

        <div className="stats-card stats-card--sellers">
          <div className="stats-card__icon stats-card__icon--warning">
            <Store size={24} />
          </div>
          <div className="stats-card__content">
            <h4 className="stats-card__title">Người bán</h4>
            <p className="stats-card__value">{formatNumber(summary.sellers)}</p>
            <span className="stats-card__desc">Shop đang hoạt động</span>
          </div>
        </div>
      </div>

      {/* TOP USERS SECTION */}
      <div className="dashboard__content">
        {/* TOP BUYERS */}
        <div className="dashboard__section">
          {renderTopUsers(
            topBuyers,
            "Top khách hàng",
            buyerCriteria,
            handleBuyerCriteriaChange,
            "buyer"
          )}
        </div>

        {/* TOP SELLERS */}
        <div className="dashboard__section">
          {renderTopUsers(
            topSellers,
            "Top cửa hàng",
            sellerCriteria,
            handleSellerCriteriaChange,
            "seller"
          )}
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="dashboard__content">
        {/* TOP CATEGORIES */}
        <div className="dashboard__section">{renderTopCategories()}</div>

        {/* CARRIERS PIE CHART */}
        <div className="dashboard__section">{renderCarriersPieChart()}</div>
      </div>
    </main>
  );
}
