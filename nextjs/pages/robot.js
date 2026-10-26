import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function RobotTasks() {
  const router = useRouter();

  // Demo default: Basic plan
  
  const API_URL = "http://127.0.0.1:8000/api";

  const [subscription, setSubscription] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
  taskName: "",
  type: "Restock",
  fromWarehouseId: "",
  product: "",
  quantity: "",
});
  const getToken = () => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("token");
};

const apiRequest = async (path, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

const loadData = async () => {
  setLoading(true);
  setError("");

  try {
    const [me, warehouseData, taskData] = await Promise.all([
      apiRequest("/me"),
      apiRequest("/warehouses"),
      apiRequest("/robot/tasks"),
    ]);

    setSubscription(me.subscription || "Basic");
    setWarehouses(Array.isArray(warehouseData) ? warehouseData : []);

    setTasks(
      (Array.isArray(taskData) ? taskData : []).map((task) => ({
        id: task.id,
        taskName: task.task_name,
        type: task.task_type,
        from: task.from_warehouse || "",
        to: task.to_warehouse || "",
        product: task.product_name || "",
        quantity: task.quantity,
        status: task.status,
        createdBy: task.created_by || "",
        date: task.created_at
          ? new Date(task.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
      }))
    );

    try {
      const productData = await apiRequest("/products");
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (productError) {
      console.error("Failed to load products:", productError);
      setProducts([]);
    }
  } catch (err) {
    console.error("Failed to load Robot Tasks:", err);
    setError(err.message || "Failed to load Robot Tasks.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadData();
}, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const searchText =
        `${task.taskName} ${task.product} ${task.type}`.toLowerCase();

      const matchSearch = searchText.includes(
        search.trim().toLowerCase()
      );

      const matchStatus =
        statusFilter === "All" ||
        task.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

  const pendingCount = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const failedCount = tasks.filter(
    (task) => task.status === "Failed"
  ).length;

  const openCreateModal = () => {
  if (subscription?.toLowerCase() !== "professional") {
    alert(
      "Robot Task Automation is available only for Professional customers. Please upgrade your subscription."
    );
    router.push("/price");
    return;
  }

  setShowModal(true);
};

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (subscription?.toLowerCase() !== "professional") {
    alert("Robot Tasks are available only on the Professional plan.");
    router.push("/price");
    return;
  }

  if (!form.taskName.trim()) {
    alert("Please enter task name.");
    return;
  }

  if (!form.fromWarehouseId) {
    alert("Please select a warehouse.");
    return;
  }

  if (!form.product.trim()) {
    alert("Please select a product.");
    return;
  }

  if (!form.quantity || Number(form.quantity) <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  setSubmitting(true);

  try {
    await apiRequest("/robot/tasks", {
      method: "POST",
      body: JSON.stringify({
        taskName: form.taskName.trim(),
        type: "Restock",
        fromWarehouseId: Number(form.fromWarehouseId),
        product: form.product,
        quantity: Number(form.quantity),
      }),
    });

    setShowModal(false);
    setForm({
      taskName: "",
      type: "Restock",
      fromWarehouseId: "",
      product: "",
      quantity: "",
    });

    await loadData();
    alert("Robot task created successfully. Status: Pending");
  } catch (err) {
    console.error("Create task failed:", err);
    alert(`Unable to create task: ${err.message}`);
  } finally {
    setSubmitting(false);
  }
};

    

  const updateTaskStatus = async (id, newStatus) => {
  if (subscription?.toLowerCase() !== "professional") {
    alert("Upgrade to Professional to access Robot Tasks.");
    return;
  }

  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  if (task.status === "Completed") {
    alert("This task has already been completed.");
    return;
  }

  try {
    await apiRequest(`/robot/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });

    await loadData();

    if (newStatus === "Completed") {
      alert("Task completed. Stock has been updated.");
    }
  } catch (err) {
    console.error("Update task failed:", err);
    alert(`Unable to update task: ${err.message}`);
  }
};

const deleteTask = async (id) => {
  if (subscription?.toLowerCase() !== "professional") {
    alert("Upgrade to Professional to access Robot Tasks.");
    return;
  }

  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  if (task.status === "Completed") {
    alert("Completed tasks cannot be deleted.");
    return;
  }

  if (!window.confirm(`Delete task "${task.taskName}"?`)) {
    return;
  }

  try {
    await apiRequest(`/robot/tasks/${id}`, {
      method: "DELETE",
    });

    await loadData();
  } catch (err) {
    console.error("Delete task failed:", err);
    alert(`Unable to delete task: ${err.message}`);
  }
};

  const getStatusStyle = (status) => {
    if (status === "Completed") {
      return "bg-green-50 text-green-700";
    }

    if (status === "In Progress") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "Pending") {
      return "bg-yellow-50 text-yellow-700";
    }

    if (status === "Failed") {
      return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  
return (
  <div className="robot-page">
    <aside className="sidebar">
      <div className="logo-area">
        <div className="logo-box">M</div>
        <div>
          <div className="logo-title">MedStock</div>
          <div className="logo-subtitle">Healthcare Inventory</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <button className="menu-item" onClick={() => router.push("/hosdashboard")}>
          <span className="menu-icon">📊</span> Dashboard
        </button>
        <button className="menu-item" onClick={() => router.push("/stock")}>
          <span className="menu-icon">📦</span> Stock
        </button>
        <button className="menu-item" onClick={() => router.push("/transactions")}>
          <span className="menu-icon">🔄</span> Transactions
        </button>
        <button className="menu-item" onClick={() => router.push("/products")}>
          <span className="menu-icon">💊</span> Products
        </button>
        <button className="menu-item" onClick={() => router.push("/warehouses")}>
          <span className="menu-icon">🏢</span> Warehouses
        </button>
        <button className="menu-item active">
          <span className="menu-icon">🤖</span> Robot Tasks
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button className="menu-item" onClick={() => router.push("/profile")}>
          <span className="menu-icon">👤</span> Profile &amp; Settings
        </button>
      </div>
    </aside>

    <main className="main-content">
      <div className="page-header">
        <div>
          <h1>Robot Tasks</h1>
          <p>Create and manage warehouse restock tasks</p>
        </div>
        {subscription?.toLowerCase() === "professional" && (
  <button onClick={openCreateModal}>
    + Create Task
  </button>
)}
      </div>


      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="text-sm text-slate-500">Current Subscription</div>
        <div className="flex items-center gap-3 mt-2">
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
            {subscription || "Loading..."}
          </span>
          <span className="text-sm text-slate-500">
            {subscription?.toLowerCase() === "professional"
              ? "Restock task management enabled"
              : "Robot Tasks require Professional"}
          </span>
        </div>
      </div>

      {subscription?.toLowerCase() !== "professional" && !loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-lg font-semibold text-slate-900">
            Professional Feature
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Restock task management is available on the Professional plan.
          </p>
          
        </div>
      )}

      {subscription?.toLowerCase() === "professional" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <StatCard title="Pending" value={pendingCount} color="text-yellow-600" />
            <StatCard title="In Progress" value={inProgressCount} color="text-blue-600" />
            <StatCard title="Completed" value={completedCount} color="text-green-600" />
            <StatCard title="Failed" value={failedCount} color="text-red-600" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search task or product..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Restock Task History
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {filteredTasks.length} task(s) found
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-sm text-slate-600">
                    <th className="px-6 py-4">Task</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Warehouse</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                        No robot tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{task.taskName}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Created by {task.createdBy || "User"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">
                            {task.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{task.product}</td>
                        <td className="px-6 py-4 text-slate-700">{task.from || "-"}</td>
                        <td className="px-6 py-4 font-medium">{task.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{task.date || "-"}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {task.status === "Pending" && (
                              <button
                                onClick={() => updateTaskStatus(task.id, "In Progress")}
                                className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm"
                              >
                                Start
                              </button>
                            )}
                            {task.status === "In Progress" && (
                              <button
                                onClick={() => updateTaskStatus(task.id, "Completed")}
                                className="px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm"
                              >
                                Complete
                              </button>
                            )}
                            {task.status !== "Completed" && task.status !== "Failed" && (
                              <button
                                onClick={() => updateTaskStatus(task.id, "Failed")}
                                className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm"
                              >
                                Fail
                              </button>
                            )}
                            {task.status !== "Completed" && (
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>

    {showModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Restock Task</h2>
              <p className="text-sm text-slate-500 mt-1">
                Select a warehouse, product, and restock quantity
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="text-slate-400 hover:text-slate-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Task Name *
                </label>
                <input
                  type="text"
                  value={form.taskName}
                  onChange={(e) => setForm({ ...form, taskName: e.target.value })}
                  placeholder="e.g. Restock Paracetamol"
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Warehouse *
                </label>
                <select
                  value={form.fromWarehouseId}
                  onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white"
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Product *
                  </label>
                  <select
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white"
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.name}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 50"
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-3"
                  />
                </div>
              </div>

              {warehouses.length === 0 && (
                <p className="text-sm text-red-600">
                  No warehouses found. Create a warehouse first.
                </p>
              )}
              {products.length === 0 && (
                <p className="text-sm text-red-600">
                  No products found. Check that the products API is working.
                </p>
              )}
            </div>

            <div className="px-6 py-5 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || warehouses.length === 0 || products.length === 0}
                className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Restock Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    <style jsx>{`
      .robot-page {
        min-height: 100vh;
        background: #f6f8fb;
        color: #172033;
        display: flex;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
      .main-content {
        margin-left: 245px;
        width: calc(100% - 245px);
        padding: 27px 35px 35px;
      }
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px;
      }
      .page-header h1 { margin: 0; font-size: 28px; font-weight: 800; color: #172033; }
      .page-header p { margin: 5px 0 0; font-size: 13px; color: #7b8494; }
      .create-button {
        background: #1769e0;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 9px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
      }
      .create-button:hover { background: #125ac2; }
      @media (max-width: 900px) {
        .sidebar { width: 210px; }
        .main-content { margin-left: 210px; width: calc(100% - 210px); padding: 22px; }
      }
            @media (max-width: 700px) {
        .sidebar { position: relative; width: 100%; min-height: auto; }
        .robot-page { display: block; }
        .main-content { margin-left: 0; width: 100%; padding: 20px; }
        .page-header { flex-direction: column; align-items: flex-start; gap: 15px; }
      }
    `}</style>
  </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </div>
    </div>
  );
}