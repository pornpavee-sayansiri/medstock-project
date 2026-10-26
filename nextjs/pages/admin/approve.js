
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_URL = "http://127.0.0.1:8000/api";

export default function AdminApprove() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [slipUrl, setSlipUrl] = useState("");
  const [slipType, setSlipType] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('token') || '';
};

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (status) => {
    if (status === "Approved") return "Approved";
    if (status === "Rejected") return "Rejected";
    return "Pending Verification";
  };

  const loadPayments = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please log in as an administrator first.");
      }

      const response = await fetch(`${API_URL}/admin/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          response.status === 403
            ? "Access denied. Please log in with an Admin account."
            : `Unable to load payments (${response.status}). ${message}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The payment API returned an unexpected response.");
      }

      setPayments(
        data.map((item) => ({
          ...item,
          id: item.id,
          hospital: item.organization_name || item.email || `User ${item.user_id}`,
          plan: item.plan || "Professional",
          amount: Number(item.amount || 0),
          paymentDate: formatDate(item.submitted_at),
          submittedDate: formatDate(item.submitted_at),
          status: formatStatus(item.status),
          slipName: `Payment slip #${item.id}`,
          submittedBy: item.email || `User ${item.user_id}`,
        }))
      );
    } catch (err) {
      console.error("Failed to load payment requests:", err);
      setError(err.message || "Failed to load payment requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    return () => {
      if (slipUrl) URL.revokeObjectURL(slipUrl);
    };
  }, [slipUrl]);

  const closeModal = () => {
    setSelectedPayment(null);
    setSlipUrl("");
    setSlipType("");
    setError("");
  };

  const openReview = async (payment) => {
    setSelectedPayment(payment);
    setSlipUrl("");
    setSlipType("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/payments/${payment.id}/slip`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Unable to load payment slip (${response.status}). ${message}`
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setSlipType(blob.type || "");
      setSlipUrl(url);
    } catch (err) {
      console.error("Failed to load payment slip:", err);
      setError(err.message || "Unable to load payment slip.");
    }
  };

  const reviewPayment = async (payment, action) => {
    const actionText = action === "approve" ? "Approve" : "Reject";

    const confirmed = window.confirm(
      `${actionText} payment from ${payment.hospital} for ฿${payment.amount.toLocaleString()}?`
    );

    if (!confirmed) return;

    setReviewing(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/payments/${payment.id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            action,
            admin_note:
              action === "approve"
                ? "Payment verified"
                : "Payment rejected by administrator",
          }),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Unable to ${action} payment (${response.status}). ${message}`
        );
      }

      closeModal();
      await loadPayments();

      window.alert(
        action === "approve"
          ? "Payment approved. The subscription has been updated by the server."
          : "Payment rejected successfully."
      );
    } catch (err) {
      console.error("Payment review failed:", err);
      setError(err.message || "Failed to review payment.");
    } finally {
      setReviewing(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "Approved") return "bg-green-50 text-green-700";
    if (status === "Rejected") return "bg-red-50 text-red-700";
    return "bg-yellow-50 text-yellow-700";
  };

  const pendingCount = payments.filter(
    (payment) => payment.status === "Pending Verification"
  ).length;

  const approvedCount = payments.filter(
    (payment) => payment.status === "Approved"
  ).length;

  const rejectedCount = payments.filter(
    (payment) => payment.status === "Rejected"
  ).length;

  return (
    <div className="admin-page">
      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo-box">M</div>
          <div>
            <div className="logo-title">MedStock</div>
            <div className="logo-subtitle">Admin Portal</div>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            className="menu-item"
            onClick={() => router.push("/admin/dashboard")}
          >
            <span className="menu-icon">📊</span>
            Dashboard
          </button>

          <button className="menu-item active">
            <span className="menu-icon">💳</span>
            Payment Verification
          </button>
        </nav>

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

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Payment Verification</h1>
            <p>Review and verify customer payment submissions</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Pending Verification</div>
            <div className="stat-number yellow">{pendingCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Approved</div>
            <div className="stat-number green">{approvedCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Rejected</div>
            <div className="stat-number red">{rejectedCount}</div>
          </div>
        </div>

        <div className="payment-card">
          <div className="card-header">
            <div>
              <h2>Payment Requests</h2>
              <p>
                Review submitted payment slips before activating subscriptions.
              </p>
            </div>
            <button
              className="refresh-button"
              onClick={loadPayments}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      Loading payment requests...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No payment requests found.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div className="hospital-name">
                          {payment.hospital}
                        </div>
                      </td>
                      <td>
                        <span className="plan-badge">{payment.plan}</span>
                      </td>
                      <td>
                        <strong>
                          ฿{payment.amount.toLocaleString()}
                        </strong>
                      </td>
                      <td>{payment.submittedBy}</td>
                      <td>{payment.submittedDate}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusStyle(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => openReview(payment)}
                          className="review-button"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {selectedPayment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Payment Verification</h2>
                <p>Review payment details</p>
              </div>
              <button onClick={closeModal} className="close-button">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span>Hospital</span>
                <strong>{selectedPayment.hospital}</strong>
              </div>

              <div className="detail-row">
                <span>Plan</span>
                <strong>{selectedPayment.plan}</strong>
              </div>

              <div className="detail-row">
                <span>Amount</span>
                <strong>
                  ฿{selectedPayment.amount.toLocaleString()}
                </strong>
              </div>

              <div className="detail-row">
                <span>Payment Date</span>
                <strong>{selectedPayment.paymentDate}</strong>
              </div>

              <div className="detail-row">
                <span>Submitted By</span>
                <strong>{selectedPayment.submittedBy}</strong>
              </div>

              <div className="slip-box">
                <div className="slip-title">Payment Slip</div>

                {slipUrl ? (
                  <div className="slip-real-preview">
                    {slipType.startsWith("image/") ? (
                      <img src={slipUrl} alt="Uploaded payment slip" />
                    ) : slipType === "application/pdf" ||
                      selectedPayment.slipName?.toLowerCase().endsWith(".pdf") ? (
                      <a href={slipUrl} target="_blank" rel="noreferrer">
                        Open payment slip PDF
                      </a>
                    ) : (
                      <a href={slipUrl} target="_blank" rel="noreferrer">
                        Open uploaded payment slip
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="slip-preview">
                    <div className="slip-icon">🧾</div>
                    <div>
                      <strong>{selectedPayment.slipName}</strong>
                      <p>Loading uploaded payment slip...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="current-status">
                <span>Current Status</span>
                <span
                  className={`status-badge ${getStatusStyle(
                    selectedPayment.status
                  )}`}
                >
                  {selectedPayment.status}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} className="cancel-button">
                Close
              </button>

              {selectedPayment.status === "Pending Verification" && (
                <>
                  <button
                    onClick={() =>
                      reviewPayment(selectedPayment, "reject")
                    }
                    className="reject-button"
                    disabled={reviewing}
                  >
                    {reviewing ? "Please wait..." : "Reject Payment"}
                  </button>

                  <button
                    onClick={() =>
                      reviewPayment(selectedPayment, "approve")
                    }
                    className="approve-button"
                    disabled={reviewing}
                  >
                    {reviewing ? "Please wait..." : "Approve Payment"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: #f6f8fb;
          color: #172033;
          display: flex;
          font-family: Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

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

        .logo-title { font-size: 18px; font-weight: 800; }
        .logo-subtitle { color: #9ba3b0; font-size: 9px; margin-top: 2px; }

        .sidebar-menu { display: flex; flex-direction: column; gap: 5px; }

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

        .menu-item:hover { background: #f0f5fd; color: #1769e0; }
        .menu-item.active { background: #eaf2ff; color: #1769e0; font-weight: 700; }
        .menu-icon { width: 20px; text-align: center; font-size: 16px; }
        .sidebar-bottom { margin-top: auto; }

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

        .user-info strong { display: block; font-size: 11px; }
        .user-info span { display: block; color: #9ba3b0; font-size: 9px; margin-top: 2px; }

        .main-content {
          margin-left: 245px;
          width: calc(100% - 245px);
          padding: 30px 35px 40px;
        }

        .page-header { margin-bottom: 28px; }
        .page-header h1 { margin: 0; font-size: 28px; font-weight: 800; }
        .page-header p { margin: 5px 0 0; color: #7b8494; font-size: 13px; }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 9px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          overflow-wrap: anywhere;
          font-size: 13px;
        }

        .error-message button {
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 25px;
        }

        .stat-card { background: white; border: 1px solid #e0e6ee; border-radius: 12px; padding: 20px; }
        .stat-label { color: #687386; font-size: 13px; }
        .stat-number { margin-top: 8px; font-size: 30px; font-weight: 800; }
        .stat-number.yellow { color: #d99000; }
        .stat-number.green { color: #16a34a; }
        .stat-number.red { color: #dc2626; }

        .payment-card { background: white; border: 1px solid #e0e6ee; border-radius: 12px; overflow: hidden; }

        .card-header {
          padding: 22px 24px;
          border-bottom: 1px solid #e5eaf0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .card-header h2 { margin: 0; font-size: 18px; }
        .card-header p { margin: 6px 0 0; font-size: 13px; color: #7b8494; }

        .refresh-button {
          border: none;
          background: #eaf2ff;
          color: #1769e0;
          padding: 9px 13px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .refresh-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }

        th {
          background: #f8fafc;
          color: #526078;
          text-align: left;
          padding: 15px 18px;
          font-size: 12px;
          font-weight: 700;
          border-bottom: 1px solid #e5eaf0;
        }

        td { padding: 17px 18px; border-bottom: 1px solid #edf0f4; font-size: 13px; color: #475569; }
        tr:last-child td { border-bottom: none; }
        .hospital-name { font-weight: 700; color: #172033; }

        .plan-badge {
          display: inline-flex;
          padding: 5px 10px;
          border-radius: 999px;
          background: #f3e8ff;
          color: #7e22ce;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge { display: inline-flex; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .review-button { border: none; background: #eaf2ff; color: #1769e0; padding: 8px 13px; border-radius: 7px; cursor: pointer; font-size: 12px; font-weight: 600; }
        .review-button:hover { background: #dbeafe; }
        .empty-cell { padding: 50px; text-align: center; color: #94a3b8; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 100;
          overflow-y: auto;
        }

        .modal { width: 100%; max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2); overflow: hidden; }

        .modal-header {
          padding: 22px 24px;
          border-bottom: 1px solid #e5eaf0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .modal-header h2 { margin: 0; font-size: 20px; }
        .modal-header p { margin: 5px 0 0; color: #7b8494; font-size: 13px; }
        .close-button { border: none; background: transparent; color: #94a3b8; font-size: 26px; cursor: pointer; line-height: 1; }
        .close-button:hover { color: #172033; }
        .modal-body { padding: 24px; }

        .detail-row { display: flex; justify-content: space-between; gap: 20px; padding: 12px 0; border-bottom: 1px solid #edf0f4; }
        .detail-row span { color: #64748b; font-size: 13px; }
        .detail-row strong { color: #172033; font-size: 13px; }

        .slip-box { margin-top: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e5eaf0; border-radius: 10px; }
        .slip-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
        .slip-preview { display: flex; align-items: center; gap: 12px; }
        .slip-icon { width: 44px; height: 44px; border-radius: 9px; background: white; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid #e5eaf0; }
        .slip-preview strong { font-size: 13px; }
        .slip-preview p { margin: 4px 0 0; color: #94a3b8; font-size: 11px; }

        .slip-real-preview img {
          display: block;
          max-width: 100%;
          max-height: 360px;
          object-fit: contain;
          border-radius: 8px;
          background: white;
        }

        .slip-real-preview a { color: #1769e0; font-size: 13px; overflow-wrap: anywhere; }

        .current-status { margin-top: 18px; display: flex; align-items: center; justify-content: space-between; }
        .current-status > span:first-child { color: #64748b; font-size: 13px; }

        .modal-footer {
          padding: 18px 24px;
          border-top: 1px solid #e5eaf0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .cancel-button, .reject-button, .approve-button {
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .cancel-button { background: #f1f5f9; color: #475569; }
        .reject-button { background: #fee2e2; color: #dc2626; }
        .approve-button { background: #16a34a; color: white; }
        .approve-button:hover { background: #15803d; }
        .cancel-button:disabled, .reject-button:disabled, .approve-button:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 900px) {
          .sidebar { width: 210px; }
          .main-content { margin-left: 210px; width: calc(100% - 210px); padding: 22px; }
          .stats-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 700px) {
          .sidebar { position: relative; width: 100%; min-height: auto; }
          .admin-page { display: block; }
          .main-content { margin-left: 0; width: 100%; padding: 20px; }
          .detail-row { flex-direction: column; gap: 5px; }
          .modal-footer { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
