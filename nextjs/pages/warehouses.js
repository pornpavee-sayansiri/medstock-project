
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

const API_URL = "http://127.0.0.1:8000/api";

const initialForm = {
  name: "",
  location: "",
  description: "",
};

export default function Warehouses() {
  const router = useRouter();

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // Keep the existing login and profile information.
  useEffect(() => {
    const savedToken = sessionStorage.getItem("token");

    if (!savedToken) {
      setError("Please log in before accessing Warehouses.");
      setLoading(false);
      return;
    }

    setToken(savedToken);
  }, []);

  const request = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        const detail = data?.detail;

        throw new Error(
          typeof detail === "string"
            ? detail
            : "The request failed. Please try again."
        );
      }

      return data;
    },
    [token]
  );

  const loadWarehouses = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const data = await request("/warehouses");
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load warehouses.");
    } finally {
      setLoading(false);
    }
  }, [token, request]);

  useEffect(() => {
    if (token) {
      loadWarehouses();
    }
  }, [token, loadWarehouses]);

  function openAddModal() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function openEditModal(warehouse) {
    setEditingId(warehouse.id);
    setForm({
      name: warehouse.name || "",
      location: warehouse.location || "",
      description: warehouse.description || "",
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter a warehouse name.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      name: form.name.trim(),
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    };

    try {
      if (editingId !== null) {
        await request(`/warehouses/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setNotice("Warehouse updated successfully.");
      } else {
        await request("/warehouses", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setNotice("Warehouse created successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);

      await loadWarehouses();
    } catch (err) {
      setError(err.message || "Unable to save the warehouse.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(warehouse) {
    const confirmed = window.confirm(
      `Delete "${warehouse.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await request(`/warehouses/${warehouse.id}`, {
        method: "DELETE",
      });

      setNotice("Warehouse deleted successfully.");
      await loadWarehouses();
    } catch (err) {
      setError(err.message || "Unable to delete the warehouse.");
    }
  }

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const query = search.trim().toLowerCase();

    return (
      (warehouse.name || "").toLowerCase().includes(query) ||
      (warehouse.location || "").toLowerCase().includes(query) ||
      (warehouse.description || "").toLowerCase().includes(query)
    );
  });

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f6f8fb",
      color: "#172033",
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    main: {
      marginLeft: 245,
      width: "calc(100% - 245px)",
      minHeight: "100vh",
      padding: "27px 35px 35px",
      boxSizing: "border-box",
    },
    heading: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 16,
      marginBottom: 28,
    },
    title: {
      fontSize: 28,
      fontWeight: 800,
      margin: 0,
      color: "#172033",
    },
    description: {
      fontSize: 13,
      color: "#7b8494",
      margin: "5px 0 0",
    },
    button: {
      border: "none",
      background: "#1769e0",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: 9,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
    },
    card: {
      background: "#fff",
      border: "1px solid #e8edf3",
      borderRadius: 12,
      padding: 22,
      marginBottom: 22,
    },
    statLabel: {
      fontSize: 12,
      color: "#7b8494",
      marginBottom: 8,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: 750,
      color: "#172033",
    },
    search: {
      width: "100%",
      maxWidth: 360,
      padding: "11px 13px",
      border: "1px solid #dce3ed",
      borderRadius: 8,
      outline: "none",
      fontSize: 13,
      boxSizing: "border-box",
    },
    tableWrap: {
      overflowX: "auto",
      background: "#fff",
      border: "1px solid #e8edf3",
      borderRadius: 12,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 650,
      textAlign: "left",
    },
    th: {
      padding: "15px 18px",
      background: "#fafbfd",
      borderBottom: "1px solid #e8edf3",
      fontSize: 11,
      color: "#7b8798",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    td: {
      padding: "17px 18px",
      borderBottom: "1px solid #edf0f5",
      fontSize: 13,
      color: "#43536b",
      verticalAlign: "middle",
    },
    smallButton: {
      background: "#fff",
      border: "1px solid #dce3ed",
      borderRadius: 6,
      padding: "7px 10px",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      color: "#43536b",
      marginRight: 6,
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(18, 35, 61, 0.42)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      zIndex: 100,
    },
    modal: {
      background: "#fff",
      borderRadius: 14,
      padding: 26,
      width: "100%",
      maxWidth: 500,
      boxSizing: "border-box",
      boxShadow: "0 20px 70px rgba(20, 40, 70, 0.18)",
      maxHeight: "90vh",
      overflowY: "auto",
    },
    fieldLabel: {
      display: "block",
      fontSize: 12,
      fontWeight: 650,
      color: "#43536b",
      marginBottom: 7,
    },
    field: {
      width: "100%",
      padding: "11px 12px",
      border: "1px solid #dce3ed",
      borderRadius: 8,
      fontSize: 13,
      boxSizing: "border-box",
      marginBottom: 17,
      outlineColor: "#1769e0",
      fontFamily: "inherit",
    },
    alert: {
      padding: "12px 15px",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 18,
      lineHeight: 1.5,
    },
  };

  const menuItems = [
    { label: "Dashboard", icon: "📊", href: "/hosdashboard" },
    { label: "Stock", icon: "📦", href: "/stock" },
    { label: "Transactions", icon: "🔄", href: "/transactions" },
    { label: "Products", icon: "💊", href: "/products" },
    { label: "Warehouses", icon: "🏢", href: "/warehouses" },
    { label: "Robot Tasks", icon: "🤖", href: "/robot" },
  ];

  return (
    <div style={styles.page}>
      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo-box">M</div>
          <div>
            <div className="logo-title">MedStock</div>
            <div className="logo-subtitle">Healthcare Inventory</div>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={`menu-item ${
                item.href === "/warehouses" ? "active" : ""
              }`}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="menu-item"
            onClick={() => router.push("/profile")}
          >
            <span className="menu-icon">👤</span>
            <span>Profile &amp; Settings</span>
          </button>

        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.heading}>
          <div>
            <h1 style={styles.title}>Warehouses</h1>
            <p style={styles.description}>
              Manage your medical supply storage locations.
            </p>
          </div>

          <button style={styles.button} onClick={openAddModal}>
            + Add Warehouse
          </button>
        </div>

        {error && !modalOpen && (
          <div
            style={{
              ...styles.alert,
              background: "#fff1f0",
              color: "#b42318",
              border: "1px solid #ffd5d2",
            }}
          >
            {error}

            {error.toLowerCase().includes("log in") && (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#1769e0",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  Go to Login
                </button>
              </div>
            )}

            {token && (
              <button
                type="button"
                onClick={loadWarehouses}
                style={{ ...styles.smallButton, marginTop: 8 }}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {notice && (
          <div
            style={{
              ...styles.alert,
              background: "#ecfdf3",
              color: "#027a48",
              border: "1px solid #abefc6",
            }}
          >
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              style={{
                float: "right",
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.statLabel}>Total Warehouses</div>
          <div style={styles.statNumber}>
            {loading ? "—" : warehouses.length}
          </div>
          <div style={{ color: "#8996a8", fontSize: 11, marginTop: 6 }}>
            Warehouses registered to your account
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>
            All Warehouses
          </h2>

          <input
            style={styles.search}
            type="search"
            placeholder="Search name, location, or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Warehouse</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      padding: 38,
                    }}
                  >
                    Loading warehouses...
                  </td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      padding: 42,
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 10 }}>▥</div>
                    <div style={{ fontWeight: 700, color: "#43536b" }}>
                      {search
                        ? "No matching warehouses"
                        : "No warehouses found"}
                    </div>
                    <div style={{ color: "#8996a8", marginTop: 7 }}>
                      {search
                        ? "Try a different search term."
                        : "Add your first warehouse to get started."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 700, color: "#243550" }}>
                        {warehouse.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#8996a8",
                          marginTop: 5,
                        }}
                      >
                        ID: {warehouse.id}
                      </div>
                    </td>

                    <td style={styles.td}>{warehouse.location || "—"}</td>
                    <td style={styles.td}>
                      {warehouse.description || "—"}
                    </td>
                    <td style={styles.td}>
                      {warehouse.created_at
                        ? new Date(
                            warehouse.created_at
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.smallButton}
                        onClick={() => openEditModal(warehouse)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        style={{
                          ...styles.smallButton,
                          color: "#d92d20",
                          borderColor: "#fecdca",
                          marginRight: 0,
                        }}
                        onClick={() => handleDelete(warehouse)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 11, color: "#8996a8", marginTop: 14 }}>
          Warehouse access is enforced by the backend according to your
          subscription plan.
        </p>
      </main>

      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="warehouse-modal-title"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <div>
                <h2
                  id="warehouse-modal-title"
                  style={{ fontSize: 20, margin: 0, color: "#172b4d" }}
                >
                  {editingId !== null ? "Edit Warehouse" : "Add Warehouse"}
                </h2>
                <p style={{ fontSize: 12, color: "#8996a8", margin: "7px 0 0" }}>
                  Enter your warehouse information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#7b8798",
                  fontSize: 25,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {error && (
              <div
                style={{
                  ...styles.alert,
                  background: "#fff1f0",
                  color: "#b42318",
                  border: "1px solid #ffd5d2",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={styles.fieldLabel} htmlFor="warehouse-name">
                Warehouse Name *
              </label>
              <input
                id="warehouse-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. Main Warehouse"
                maxLength={255}
                required
                style={styles.field}
              />

              <label style={styles.fieldLabel} htmlFor="warehouse-location">
                Location
              </label>
              <input
                id="warehouse-location"
                name="location"
                value={form.location}
                onChange={handleFormChange}
                placeholder="e.g. Bangkok"
                maxLength={500}
                style={styles.field}
              />

              <label style={styles.fieldLabel} htmlFor="warehouse-description">
                Description
              </label>
              <textarea
                id="warehouse-description"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Additional information..."
                rows={3}
                style={{ ...styles.field, resize: "vertical" }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    ...styles.smallButton,
                    padding: "11px 16px",
                    marginRight: 0,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...styles.button,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Create Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 40;
          display: flex;
          flex-direction: column;
          width: 245px;
          height: 100vh;
          box-sizing: border-box;
          border-right: 1px solid #e8edf3;
          background: #fff;
          padding: 23px 14px;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px;
          margin-bottom: 30px;
        }

        .logo-box {
          display: flex;
          height: 40px;
          width: 40px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #1769e0;
          color: #fff;
          font-size: 20px;
          font-weight: 800;
        }

        .logo-title {
          color: #172033;
          font-size: 18px;
          font-weight: 800;
        }

        .logo-subtitle {
          margin-top: 2px;
          color: #9ba3b0;
          font-size: 9px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .menu-item {
          display: flex;
          width: 100%;
          box-sizing: border-box;
          align-items: center;
          gap: 12px;
          border: none;
          border-radius: 9px;
          background: transparent;
          padding: 11px 13px;
          color: #687386;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
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
          flex-shrink: 0;
          text-align: center;
          font-size: 16px;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .user-box {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 13px;
          border-top: 1px solid #edf0f4;
          padding: 14px 8px 0;
        }

        .user-avatar {
          display: flex;
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e5efff;
          color: #1769e0;
          font-size: 10px;
          font-weight: 800;
        }

        .user-info strong {
          display: block;
          color: #172033;
          font-size: 11px;
        }

        .user-info span {
          display: block;
          margin-top: 2px;
          color: #9ba3b0;
          font-size: 9px;
        }

        @media (max-width: 900px) {
          .sidebar {
            width: 210px;
          }

          @media (max-width: 700px) {
            .sidebar {
              position: relative;
              width: 100%;
              height: auto;
              min-height: auto;
            }
          }
        }

        @media (max-width: 900px) {
          :global(main) {
            margin-left: 210px !important;
            width: calc(100% - 210px) !important;
            padding: 22px !important;
          }
        }

        @media (max-width: 700px) {
          :global(main) {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
