
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatMoney = (value) =>
    `฿${Number(value ?? 0).toLocaleString("en-US")}`;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = sessionStorage.getItem('token');

if (!token) {
  router.replace('/login');
  return;
}

        const response = await fetch(
          "http://127.0.0.1:8000/api/admin/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "Admin access required."
              : `Failed to load dashboard (${response.status})`
          );
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = dashboardData?.summary;
  const paymentSummary = dashboardData?.payments;

  const kpis = {
    organizations: Number(summary?.total_organizations ?? 0),
    users: Number(summary?.total_users ?? 0),
    professional: Number(summary?.professional_users ?? 0),
    basic: Number(summary?.basic_users ?? 0),
    monthlyRevenue: Number(paymentSummary?.monthly_revenue ?? 0),
    pendingPayments: Number(paymentSummary?.pending_payments ?? 0),
  };

  const organizations = (dashboardData?.organizations ?? []).map(
    (org, index) => ({
      ...org,
      id: org.name || index,
    })
  );

  const recentPayments = (dashboardData?.recent_payments ?? []).map(
    (payment, index) => ({
      ...payment,
      id: index,
      amount: formatMoney(payment.amount),
      date: payment.date
        ? new Date(payment.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
    })
  );

  return (
    <div className="admin-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">
        {/* Logo */}

        <div className="logo-area">
          <div className="logo-box">M</div>

          <div>
            <div className="logo-title">MedStock</div>
            <div className="logo-subtitle">Admin Portal</div>
          </div>
        </div>

        {/* Navigation */}

        <nav className="sidebar-menu">
          <button
            className="menu-item active"
            onClick={() => router.push("/admin/approve")}
          >
            <span className="menu-icon">📊</span>
            Dashboard
          </button>

          <button
            className="menu-item"
            onClick={() => router.push("/admin/approve")}
          >
            <span className="menu-icon">💳</span>
            Payment Verification
          </button>
        </nav>

        {/* Bottom */}

        <div className="sidebar-bottom">
          <button
            className="menu-item"
            onClick={() => router.push("/profile")}
          >
            <span className="menu-icon">👤</span>
            Profile
          </button>

          <div className="user-box">
            <div className="user-avatar">AD</div>

            <div className="user-info">
              <strong>Admin</strong>
              <span>MedStock Owner</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">
        {/* Header */}

        <div className="page-header">
          <div>
            <h1>Admin Analytics Dashboard</h1>

            <p>
              Monitor MedStock business performance and users.
            </p>
          </div>
        </div>
        
{loading && <p>Loading dashboard...</p>}

{error && (
  <p style={{ color: "#dc2626" }}>
    {error}
  </p>
)}


        {/* =================================================
            BUSINESS KPIs
        ================================================= */}

        <section>
          <div className="section-title">
            <div>
              <h2>Business KPIs</h2>

              <p>
                Key metrics for the MedStock platform
              </p>
            </div>
          </div>

          <div className="kpi-grid">
            {/* Total Organizations */}

            <div className="kpi-card">
              <div className="kpi-icon blue">
                🏢
              </div>

              <div>
                <span>Total Organizations</span>

                <strong>
                  {kpis.organizations}
                </strong>
              </div>
            </div>

            {/* Total Users */}

            <div className="kpi-card">
              <div className="kpi-icon green">
                👥
              </div>

              <div>
                <span>Total Users</span>

                <strong>
                  {kpis.users.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Professional */}

            <div className="kpi-card">
              <div className="kpi-icon purple">
                💎
              </div>

              <div>
                <span>Professional</span>

                <strong>
                  {kpis.professional}
                </strong>
              </div>
            </div>

            {/* Basic */}

            <div className="kpi-card">
              <div className="kpi-icon orange">
                📦
              </div>

              <div>
                <span>Basic</span>

                <strong>
                  {kpis.basic}
                </strong>
              </div>
            </div>

            {/* Revenue */}

            <div className="kpi-card">
              <div className="kpi-icon green">
                💰
              </div>

              <div>
                <span>Monthly Revenue</span>

                <strong>
                  {formatMoney(
                    kpis.monthlyRevenue
                  )}
                </strong>
              </div>
            </div>

            {/* Pending Payments */}

            <div className="kpi-card">
              <div className="kpi-icon red">
                ⏳
              </div>

              <div>
                <span>Pending Payments</span>

                <strong>
                  {kpis.pendingPayments}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <section className="overview-grid">
          {/* Organization Overview */}

          <div className="panel">
            <div className="panel-header">
              <h2>Organization Overview</h2>

              <p>
                Current platform status
              </p>
            </div>

            
<div className="overview-content">
  <div className="overview-row">
    <span>Total Organizations</span>
    <strong>{kpis.organizations}</strong>
  </div>

  <div className="progress">
    <div
      className="progress-fill"
      style={{ width: "100%" }}
    />
  </div>

  <div className="overview-row">
    <span>Total User Accounts</span>
    <strong>{kpis.users}</strong>
  </div>

  <div className="progress">
    <div
      className="progress-fill"
      style={{
        width: `${
          kpis.organizations > 0
            ? Math.min(
                (kpis.users / kpis.organizations) * 100,
                100
              )
            : 0
        }%`,
      }}
    />
  </div>
</div>

          </div>

          {/* Subscription Overview */}

          <div className="panel">
            <div className="panel-header">
              <h2>Subscription Overview</h2>

              <p>
                Current subscription distribution
              </p>
            </div>

            <div className="subscription-content">
              <div className="subscription-item">
                <div className="subscription-label">
                  <span className="dot professional" />

                  Professional
                </div>

                <strong>
                  {kpis.professional}
                </strong>
              </div>

              <div className="subscription-item">
                <div className="subscription-label">
                  <span className="dot basic" />

                  Basic
                </div>

                <strong>
                  {kpis.basic}
                </strong>
              </div>

              <div className="subscription-total">
                <span>
                  Total Subscriptions
                </span>

                <strong>
                  {kpis.professional +
                    kpis.basic}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            USER MANAGEMENT
        ================================================= */}

        <section className="user-section">
          <div className="section-title">
            <div>
              <h2>User Management</h2>

              <p>
                Manage organizations and their registered users
              </p>
            </div>

            <button
              className="view-all"
              onClick={() =>
                router.push("/admin/users")
              }
            >
              View All Users →
            </button>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Admin Email</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>

              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="organization-name">
                        <div className="organization-avatar">
                          {org.name.charAt(0)}
                        </div>

                        <strong>
                          {org.name}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {org.email}
                    </td>

                    <td>
                      <span
                        className={`plan ${
                          org.plan ===
                          "Professional"
                            ? "professional-plan"
                            : "basic-plan"
                        }`}
                      >
                        {org.plan}
                      </span>
                    </td>

                    <td>
                      {org.users}
                    </td>
                    <td>
                      <span className="status">
                        Not tracked
                      </span>
                    </td>

                    <td>
                      —
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* =================================================
            RECENT PAYMENTS
        ================================================= */}

        <section className="payments-section">
          <div className="section-title">
            <div>
              <h2>Recent Payments</h2>

              <p>
                Latest subscription payments
              </p>
            </div>

            <button
              className="view-all"
              onClick={() =>
                router.push("/admin/payments")
              }
            >
              View All Payments →
            </button>
          </div>

          <div className="payment-grid">
            {recentPayments.map(
              (payment, index) => (
                <div
                  className="payment-card"
                  key={index}
                >
                  <div className="payment-top">
                    <div>
                      <strong>
                        {payment.organization}
                      </strong>

                      <span>
                        {payment.date}
                      </span>
                    </div>

                    <span
                      className={`payment-status ${
                        payment.status ===
                        "Paid"
                          ? "paid"
                          : "payment-pending"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>

                  <div className="payment-bottom">
                    <span>
                      {payment.plan}
                    </span>

                    <strong>
                      {payment.amount}
                    </strong>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* Footer */}

        <footer>
          <span>
            © 2026 MedStock
          </span>

          <span>
            Platform Administration
          </span>
        </footer>
      </main>

      {/* =====================================================
          CSS
      ===================================================== */}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .admin-page {
          min-height: 100vh;
          background: #f6f8fb;
          color: #172033;
          display: flex;
          font-family: Inter, -apple-system,
            BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .sidebar {
          width: 245px;
          min-height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          background: #ffffff;
          border-right: 1px solid #e8edf3;
          padding: 23px 14px;
          display: flex;
          flex-direction: column;
          z-index: 20;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px;
          margin-bottom: 30px;
        }

        .logo-box {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: #1769e0;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
        }

        .logo-title {
          font-size: 18px;
          font-weight: 800;
          color: #172033;
        }

        .logo-subtitle {
          color: #9ba3b0;
          font-size: 9px;
          margin-top: 2px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .menu-item {
          width: 100%;
          border: none;
          background: transparent;
          color: #687386;
          padding: 11px 13px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          cursor: pointer;
          font-size: 12px;
          transition: 0.2s;
        }

        .menu-item:hover {
          background: #f0f5fd;
          color: #1769e0;
        }

        .menu-item.active {
          background: #eaf2ff;
          color: #1769e0;
          font-weight: 700;
        }

        .menu-icon {
          width: 20px;
          text-align: center;
          font-size: 16px;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .user-box {
          margin-top: 13px;
          padding: 14px 8px 0;
          border-top: 1px solid #edf0f4;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #e5efff;
          color: #1769e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .user-info strong {
          display: block;
          font-size: 11px;
        }

        .user-info span {
          display: block;
          color: #9ba3b0;
          font-size: 9px;
          margin-top: 2px;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .main-content {
          margin-left: 245px;
          width: calc(100% - 245px);
          padding: 30px 35px 40px;
        }

        .page-header {
          margin-bottom: 28px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #172033;
        }

        .page-header p {
          margin: 5px 0 0;
          color: #7b8494;
          font-size: 13px;
        }

        section {
          margin-bottom: 28px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 18px;
          color: #172033;
        }

        .section-title p {
          margin: 5px 0 0;
          color: #7b8494;
          font-size: 12px;
        }

        /* =====================================================
           KPI
        ===================================================== */

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .kpi-card {
          background: white;
          border: 1px solid #e0e6ee;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .kpi-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .kpi-icon.blue {
          background: #eff6ff;
        }

        .kpi-icon.green {
          background: #ecfdf5;
        }

        .kpi-icon.purple {
          background: #f5f3ff;
        }

        .kpi-icon.orange {
          background: #fff7ed;
        }

        .kpi-icon.red {
          background: #fef2f2;
        }

        .kpi-card span {
          display: block;
          color: #687386;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .kpi-card strong {
          font-size: 23px;
          color: #172033;
        }

        /* =====================================================
           OVERVIEW
        ===================================================== */

        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .panel {
          background: white;
          border: 1px solid #e0e6ee;
          border-radius: 12px;
          padding: 22px;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 16px;
          color: #172033;
        }

        .panel-header p {
          margin: 5px 0 20px;
          color: #7b8494;
          font-size: 11px;
        }

        .overview-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .overview-row span {
          color: #687386;
        }

        .overview-row strong {
          color: #172033;
        }

        .progress {
          width: 100%;
          height: 8px;
          background: #f1f5f9;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 18px;
        }

        .progress-fill {
          height: 100%;
          background: #1769e0;
          border-radius: 20px;
        }

        .progress-fill.suspended {
          background: #ef4444;
        }

        .subscription-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 0;
          border-bottom: 1px solid #edf0f4;
          font-size: 12px;
        }

        .subscription-label {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .dot.professional {
          background: #8b5cf6;
        }

        .dot.basic {
          background: #f59e0b;
        }

        .subscription-total {
          display: flex;
          justify-content: space-between;
          margin-top: 18px;
          font-size: 12px;
        }

        .subscription-total span {
          color: #687386;
        }

        /* =====================================================
           TABLE
        ===================================================== */

        .table-card {
          background: white;
          border: 1px solid #e0e6ee;
          border-radius: 12px;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        th {
          background: #f8fafc;
          color: #526078;
          text-align: left;
          padding: 15px 18px;
          font-size: 11px;
          font-weight: 700;
          border-bottom: 1px solid #e5eaf0;
        }

        td {
          padding: 16px 18px;
          border-bottom: 1px solid #edf0f4;
          font-size: 12px;
          color: #475569;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .organization-name {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .organization-name strong {
          color: #172033;
          font-size: 12px;
        }

        .organization-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #eff6ff;
          color: #1769e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 11px;
        }

        .plan,
        .status,
        .payment-status {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
        }

        .professional-plan {
          background: #f3e8ff;
          color: #7e22ce;
        }

        .basic-plan {
          background: #fff7ed;
          color: #c2410c;
        }

        .active-status {
          background: #ecfdf5;
          color: #059669;
        }

        .suspended-status {
          background: #fef2f2;
          color: #dc2626;
        }

        .view-all {
          border: none;
          background: transparent;
          color: #1769e0;
          font-size: 11px;
          cursor: pointer;
          font-weight: 600;
        }

        .view-all:hover {
          color: #0f56bd;
        }

        /* =====================================================
           PAYMENTS
        ===================================================== */

        .payment-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .payment-card {
          background: white;
          border: 1px solid #e0e6ee;
          border-radius: 12px;
          padding: 18px;
        }

        .payment-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .payment-top strong {
          display: block;
          font-size: 12px;
          color: #172033;
        }

        .payment-top span {
          display: block;
          font-size: 10px;
          color: #7b8494;
          margin-top: 4px;
        }

        .payment-status.paid {
          background: #ecfdf5;
          color: #059669;
        }

        .payment-status.payment-pending {
          background: #fff7ed;
          color: #c2410c;
        }

        .payment-bottom {
          margin-top: 18px;
          padding-top: 13px;
          border-top: 1px solid #edf0f4;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .payment-bottom span {
          color: #687386;
        }

        .payment-bottom strong {
          color: #172033;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        footer {
          border-top: 1px solid #e0e6ee;
          padding: 22px 0;
          display: flex;
          justify-content: space-between;
          color: #9ba3b0;
          font-size: 10px;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .payment-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .sidebar {
            width: 210px;
          }

          .main-content {
            margin-left: 210px;
            width: calc(100% - 210px);
            padding: 22px;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .sidebar {
            position: relative;
            width: 100%;
            min-height: auto;
          }

          .admin-page {
            display: block;
          }

          .main-content {
            margin-left: 0;
            width: 100%;
            padding: 20px;
          }

          .kpi-grid {
            grid-template-columns: 1fr;
          }

          .section-title {
            align-items: flex-start;
            gap: 10px;
          }

          footer {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}