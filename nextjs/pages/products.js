
import { useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000/api";

export default function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [subscription, setSubscription] = useState("Basic");
  const [products, setProducts] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "Tablet",
    unit: "Tablets",
    manufacturer: "",
    description: "",
  });

 
  /* LOAD PRODUCTS AND LATEST USER PLAN FROM BACKEND */

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      const token = sessionStorage.getItem("token");

      if (!token) {
        setError("Please log in to view products.");
        setLoading(false);
        return;
      }

      try {
        // Get the latest subscription and role from the backend
        const userResponse = await fetch(`${API_URL}/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userResponse.status === 401) {
          if (!cancelled) {
            setError("Your session has expired. Please log in again.");
            setProducts([]);
          }
          return;
        }

        if (!userResponse.ok) {
          throw new Error(
            `Failed to load account information (${userResponse.status})`
          );
        }

        const userData = await userResponse.json();

        if (cancelled) return;

        const latestSubscription =
          userData.subscription || "Basic";

        setSubscription(latestSubscription);
        setRole(userData.role || "");

        // Update the cached values for this browser tab
        sessionStorage.setItem("subscription", latestSubscription);
        sessionStorage.setItem("role", userData.role || "");

        // Load products using the same account token
        const response = await fetch(`${API_URL}/products`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          if (!cancelled) {
            setProducts([]);
            setError("Your session has expired. Please log in again.");
          }
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Failed to load products (${response.status})`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        console.error("Error loading products:", err);

        if (!cancelled) {
          setError(err.message || "Unable to load products.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);


  /* PLAN AND PERMISSIONS */

  const isProfessional = subscription === "Professional";
  const canManageProducts = role === "STAFF" || role === "ADMIN";
  const productLimit = isProfessional ? Infinity : 500;

  /* FILTER PRODUCTS */

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const manufacturer = (product.manufacturer || "").toLowerCase();
      const searchText = search.toLowerCase();

      const matchesSearch =
        name.includes(searchText) ||
        manufacturer.includes(searchText);

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  /* STATISTICS */

  const totalProducts = products.length;

  const totalTablets = products.filter(
    (product) => product.category === "Tablet"
  ).length;

  const totalCapsules = products.filter(
    (product) => product.category === "Capsule"
  ).length;

  const totalInjections = products.filter(
    (product) => product.category === "Injection"
  ).length;

  /* RESET FORM */

  const resetForm = () => {
    setForm({
      name: "",
      category: "Tablet",
      unit: "Tablets",
      manufacturer: "",
      description: "",
    });

    setEditingProduct(null);
    setShowModal(false);
  };

  /* OPEN ADD PRODUCT MODAL */

  const openAddModal = () => {
    if (!canManageProducts) {
      alert("You do not have permission to add products.");
      return;
    }

    if (!isProfessional && products.length >= productLimit) {
      alert(
        `You have reached the Basic plan limit of ${productLimit} products.`
      );
      return;
    }

    setError("");
    setEditingProduct(null);

    setForm({
      name: "",
      category: "Tablet",
      unit: "Tablets",
      manufacturer: "",
      description: "",
    });

    setShowModal(true);
  };

  /* OPEN EDIT PRODUCT MODAL */

  const openEditModal = (product) => {
    if (!canManageProducts) {
      alert("You do not have permission to edit products.");
      return;
    }

    setError("");
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      category: product.category || "Tablet",
      unit: product.unit || "Tablets",
      manufacturer: product.manufacturer || "",
      description: product.description || "",
    });

    setShowModal(true);
  };

  /* ADD / EDIT PRODUCT THROUGH FASTAPI */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.manufacturer.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!canManageProducts) {
      alert("You do not have permission to manage products.");
      return;
    }

    if (
      !editingProduct &&
      !isProfessional &&
      products.length >= productLimit
    ) {
      alert(
        `You have reached the Basic plan limit of ${productLimit} products.`
      );
      return;
    }

    const token = sessionStorage.getItem("token")

    if (!token) {
      alert("Please log in again.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      manufacturer: form.manufacturer.trim(),
      description: form.description.trim() || null,
      price: 0,
      stock: 0,
      plan_level: subscription,
    };

    try {
      const isEditing = Boolean(editingProduct);

      const response = await fetch(
        isEditing
          ? `${API_URL}/products/${editingProduct.id}`
          : `${API_URL}/products`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Unable to save product (${response.status})`
        );
      }

      const savedProduct = await response.json();

      setProducts((currentProducts) => {
        if (isEditing) {
          return currentProducts.map((product) =>
            product.id === savedProduct.id ? savedProduct : product
          );
        }

        return [...currentProducts, savedProduct];
      });

      resetForm();

      alert(
        isEditing
          ? "Product updated successfully."
          : "Product added successfully."
      );
    } catch (err) {
      console.error("Failed to save product:", err);
      setError(err.message);
      alert(err.message);
    }
  };

  /* DELETE PRODUCT THROUGH FASTAPI */

  const deleteProduct = async (id) => {
    if (!canManageProducts) {
      alert("You do not have permission to delete products.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    const token = sessionStorage.getItem("token")

    if (!token) {
      alert("Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Unable to delete product (${response.status})`
        );
      }

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );

      alert("Product deleted successfully.");
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError(err.message);
      alert(err.message);
    }
  };

  return (
    <div className="page">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo-box">M</div>

          <div>
            <div className="logo-title">MedStock</div>
            <div className="logo-subtitle">Healthcare Inventory</div>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            className="menu-item"
            onClick={() => {
              window.location.href = "/hosdashboard";
            }}
          >
            <span className="menu-icon">📊</span>
            Dashboard
          </button>

          <button
            className="menu-item"
            onClick={() => {
              window.location.href = "/stock";
            }}
          >
            <span className="menu-icon">📦</span>
            Stock
          </button>

          <button
            className="menu-item"
            onClick={() => {
              window.location.href = "/transactions";
            }}
          >
            <span className="menu-icon">🔄</span>
            Transactions
          </button>

          <button
            className="menu-item active"
            onClick={() => {
              window.location.href = "/products";
            }}
          >
            <span className="menu-icon">💊</span>
            Products
          </button>

          <button
            className="menu-item"
            onClick={() => {
              window.location.href = "/warehouses";
            }}
          >
            <span className="menu-icon">🏢</span>
            Warehouses
          </button>

          <button
            className="menu-item"
            onClick={() => {
              window.location.href = "/robot";
            }}
          >
            <span className="menu-icon">🤖</span>
            Robot Tasks
          </button>
        </nav>

        {/* PROFILE LINK ONLY — USER BOX REMOVED */}
        <div className="sidebar-bottom">
          <button
            className="menu-item"
            onClick={() => {
              window.location.href = "/profile";
            }}
          >
            <span className="menu-icon">👤</span>
            Profile &amp; Settings
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Products</h1>
            <p>Manage medicine and medical supply products</p>
          </div>

          {canManageProducts && (
            <button
              className="add-button"
              onClick={openAddModal}
              disabled={loading}
            >
              + Add Product
            </button>
          )}
        </div>

        {/* PLAN INFORMATION */}
        <div
          className={
            isProfessional
              ? "plan-card professional"
              : "plan-card basic"
          }
        >
          <div className="plan-left">
            <div className="plan-icon">
              {isProfessional ? "⭐" : "📦"}
            </div>

            <div>
              <div className="plan-title">{subscription} Plan</div>

              <div className="plan-description">
                {isProfessional
                  ? "Professional inventory access"
                  : "Basic inventory access"}
              </div>
            </div>
          </div>

          <div className="plan-right">
            <strong>
              {isProfessional
                ? `${totalProducts} / Unlimited`
                : `${totalProducts} / ${productLimit}`}
            </strong>
            <span>products shown</span>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-message">
            <span>{error}</span>

            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {/* SEARCH AND CATEGORY */}
        <div className="toolbar">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Injection">Injection</option>
            <option value="Medical Supply">Medical Supply</option>
          </select>
        </div>

        {/* STATISTICS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">💊</div>
            <div>
              <span>Total Products</span>
              <h2>{totalProducts}</h2>
              <small>
                {isProfessional ? "Professional plan" : "Basic plan"}
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">💊</div>
            <div>
              <span>Tablets</span>
              <h2>{totalTablets}</h2>
              <small>Tablet products</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">💊</div>
            <div>
              <span>Capsules</span>
              <h2>{totalCapsules}</h2>
              <small>Capsule products</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">💉</div>
            <div>
              <span>Injections</span>
              <h2>{totalInjections}</h2>
              <small>Injection products</small>
            </div>
          </div>
        </div>

        {/* PRODUCT TABLE */}
        <div className="table-card">
          <div className="table-header">
            <div>
              <h2>Product List</h2>
              <p>
                {loading
                  ? "Loading products..."
                  : `${filteredProducts.length} products found`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">
              Loading products from database...
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Manufacturer</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>

                      <td>
                        <span className="badge">{product.category}</span>
                      </td>

                      <td>{product.unit || "—"}</td>
                      <td>{product.manufacturer || "—"}</td>

                      <td className="description">
                        {product.description || "—"}
                      </td>

                      <td>
                        {canManageProducts ? (
                          <div className="actions">
                            <button
                              type="button"
                              className="edit-button"
                              onClick={() => openEditModal(product)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => deleteProduct(product.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span>View only</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty">
                        {error
                          ? "Products could not be loaded."
                          : "No products found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>
                <p>Enter product information below</p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Product Name *

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Paracetamol 500mg"
                />
              </label>

              <label>
                Category

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Injection">Injection</option>
                  <option value="Medical Supply">Medical Supply</option>
                </select>
              </label>

              <label>
                Unit

                <select
                  value={form.unit}
                  onChange={(event) =>
                    setForm({ ...form, unit: event.target.value })
                  }
                >
                  <option value="Tablets">Tablets</option>
                  <option value="Capsules">Capsules</option>
                  <option value="Vials">Vials</option>
                  <option value="Pieces">Pieces</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Packs">Packs</option>
                </select>
              </label>

              <label>
                Manufacturer *

                <input
                  required
                  value={form.manufacturer}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      manufacturer: event.target.value,
                    })
                  }
                  placeholder="e.g. Pfizer"
                />
              </label>

              <label>
                Description

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Product description..."
                  rows="3"
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button type="submit" className="save-button">
                  {editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS */}
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
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
          background: #fff;
          border-right: 1px solid #e8edf3;
          padding: 23px 14px;
          display: flex;
          flex-direction: column;
          z-index: 10;
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
          flex-shrink: 0;
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
          flex-shrink: 0;
          text-align: center;
          font-size: 16px;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .main-content {
          margin-left: 245px;
          width: calc(100% - 245px);
          min-width: 0;
          padding: 27px 35px 35px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
        }

        .page-header p {
          margin: 6px 0 0;
          color: #8d97a7;
          font-size: 13px;
        }

        .add-button {
          flex-shrink: 0;
          border: none;
          background: #1769e0;
          color: white;
          padding: 11px 17px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .add-button:hover,
        .save-button:hover {
          background: #125bc4;
        }

        .add-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .plan-card {
          border-radius: 13px;
          padding: 15px 18px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          border: 1px solid;
        }

        .plan-card.basic {
          background: #f8fbff;
          border-color: #dceaff;
        }

        .plan-card.professional {
          background: #faf8ff;
          border-color: #e4dbff;
        }

        .plan-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .plan-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 10px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .plan-title {
          font-size: 14px;
          font-weight: 800;
        }

        .plan-description {
          margin-top: 3px;
          color: #8b95a5;
          font-size: 11px;
        }

        .plan-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .plan-right strong {
          font-size: 18px;
          color: #1769e0;
        }

        .plan-right span {
          color: #8b95a5;
          font-size: 10px;
          margin-top: 2px;
        }

        .error-message {
          background: #fff0f0;
          color: #c53d3d;
          border: 1px solid #ffd8d8;
          border-radius: 10px;
          padding: 12px 15px;
          margin-bottom: 16px;
          font-size: 12px;
          overflow-wrap: anywhere;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .error-message button {
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
        }

        .toolbar {
          background: white;
          border: 1px solid #e7ebf1;
          border-radius: 13px;
          padding: 15px;
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .toolbar input,
        .toolbar select {
          min-width: 0;
          padding: 10px 13px;
          border: 1px solid #dfe5ec;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          background: white;
        }

        .toolbar input {
          flex: 1;
        }

        .toolbar input:focus,
        .toolbar select:focus {
          border-color: #1769e0;
          box-shadow: 0 0 0 3px rgba(23, 105, 224, 0.08);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          min-width: 0;
          background: white;
          border: 1px solid #e7ebf1;
          border-radius: 13px;
          padding: 18px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .stat-icon {
          width: 45px;
          height: 45px;
          flex-shrink: 0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .stat-icon.blue {
          background: #eaf2ff;
        }

        .stat-icon.green {
          background: #eaf8f0;
        }

        .stat-icon.purple {
          background: #f0ebff;
        }

        .stat-icon.orange {
          background: #fff4df;
        }

        .stat-card span {
          color: #8993a3;
          font-size: 12px;
        }

        .stat-card h2 {
          margin: 4px 0;
          font-size: 24px;
        }

        .stat-card small {
          color: #a2aab6;
          font-size: 10px;
        }

        .table-card {
          background: white;
          border: 1px solid #e7ebf1;
          border-radius: 13px;
          overflow: hidden;
        }

        .table-header {
          padding: 20px;
          border-bottom: 1px solid #edf0f4;
        }

        .table-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .table-header p {
          margin: 5px 0 0;
          color: #9aa3b1;
          font-size: 12px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 15px 18px;
          text-align: left;
          border-bottom: 1px solid #f0f2f5;
          font-size: 13px;
        }

        th {
          background: #fafbfc;
          color: #7d8797;
          font-weight: 700;
          white-space: nowrap;
        }

        td strong {
          color: #172033;
        }

        .badge {
          display: inline-block;
          background: #eaf2ff;
          color: #1769e0;
          padding: 5px 9px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .description {
          color: #8993a3;
          max-width: 220px;
          overflow-wrap: anywhere;
        }

        .actions {
          display: flex;
          gap: 7px;
        }

        .edit-button,
        .delete-button {
          border: none;
          padding: 7px 10px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 11px;
          white-space: nowrap;
        }

        .edit-button {
          background: #eaf2ff;
          color: #1769e0;
        }

        .delete-button {
          background: #fff0f0;
          color: #d84b4b;
        }

        .edit-button:hover {
          background: #dceaff;
        }

        .delete-button:hover {
          background: #ffe1e1;
        }

        .empty,
        .loading-message {
          text-align: center;
          padding: 40px;
          color: #9aa3b1;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .modal {
          width: 520px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #8d97a7;
          font-size: 12px;
        }

        .close-button {
          border: none;
          background: transparent;
          font-size: 25px;
          cursor: pointer;
          color: #7d8797;
          align-self: flex-start;
        }

        form label {
          display: block;
          margin-bottom: 15px;
          font-size: 13px;
          font-weight: 600;
        }

        form input,
        form select,
        form textarea {
          width: 100%;
          margin-top: 7px;
          padding: 10px;
          border: 1px solid #dfe5ec;
          border-radius: 8px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          background: white;
        }

        form input:focus,
        form select:focus,
        form textarea:focus {
          border-color: #1769e0;
          box-shadow: 0 0 0 3px rgba(23, 105, 224, 0.08);
        }

        form textarea {
          resize: vertical;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .cancel-button,
        .save-button {
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        .cancel-button {
          background: #f1f3f6;
          color: #596579;
        }

        .save-button {
          background: #1769e0;
          color: white;
        }

        @media (max-width: 1100px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .main-content {
            padding-left: 25px;
            padding-right: 25px;
          }
        }

        @media (max-width: 750px) {
          .sidebar {
            width: 75px;
            padding: 20px 8px;
          }

          .logo-area {
            justify-content: center;
            padding: 0;
          }

          .logo-area > div:last-child {
            display: none;
          }

          .menu-item {
            justify-content: center;
            font-size: 0;
            padding-left: 8px;
            padding-right: 8px;
          }

          .menu-icon {
            font-size: 16px;
          }

          .main-content {
            margin-left: 75px;
            width: calc(100% - 75px);
            padding: 20px 14px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .plan-card {
            align-items: flex-start;
          }

          .plan-right {
            align-items: flex-start;
          }

          .toolbar {
            flex-direction: column;
          }
        }

        @media (max-width: 420px) {
          .plan-card {
            flex-direction: column;
          }

          .modal {
            padding: 18px;
          }

          .modal-actions {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
