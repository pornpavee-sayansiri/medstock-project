import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Dashboard() {
  const router = useRouter();

  const [subscription, setSubscription] = useState("Basic");
  const [products, setProducts] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [robotTasks, setRobotTasks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isProfessional = subscription === "Professional";

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const request = async (endpoint) => {
          const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 401) {
            localStorage.removeItem("token");
            router.replace("/login");
            throw new Error("Session expired. Please log in again.");
          }

          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(
              body.detail || `Request failed: ${endpoint}`
            );
          }

          return response.json();
        };

        // Read the subscription from the authenticated backend account.
        const me = await request("/me");

        const plan =
          String(me.subscription || "Basic").toLowerCase() ===
          "professional"
            ? "Professional"
            : "Basic";

        const [productData, stockData, transactionData, warehouseData] =
          await Promise.all([
            request("/products"),
            request("/stock"),
            request("/transactions"),
            request("/warehouses"),
          ]);

        let robotData = [];

        if (plan === "Professional") {
          robotData = await request("/robot/tasks");
        }

        if (cancelled) return;

        setSubscription(plan);
        setProducts(Array.isArray(productData) ? productData : []);
        setStockItems(Array.isArray(stockData) ? stockData : []);
        setTransactions(
          Array.isArray(transactionData) ? transactionData : []
        );
        setWarehouses(
          Array.isArray(warehouseData) ? warehouseData : []
        );
        setRobotTasks(Array.isArray(robotData) ? robotData : []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load dashboard:", err);
          setError(err.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const totalProductsCount = products.length;

  const totalStockQuantity = useMemo(
    () =>
      stockItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
    [stockItems]
  );

  const lowStockItems = useMemo(
    () =>
      stockItems.filter((item) => {
        const quantity = Number(item.quantity || 0);
        const minimum = Number(item.min_stock ?? 0);
        return quantity <= minimum;
      }),
    [stockItems]
  );

  const expiringSoonItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return stockItems.filter((item) => {
      if (!item.expiration_date) return false;

      const expirationDate = new Date(item.expiration_date);
      if (Number.isNaN(expirationDate.getTime())) return false;

      expirationDate.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil(
        (expirationDate - today) / (1000 * 60 * 60 * 24)
      );

      return daysLeft >= 0 && daysLeft <= 30;
    });
  }, [stockItems]);

  const recentTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      ),
    [transactions]
  );

  const recentRobotTasks = useMemo(
    () =>
      [...robotTasks].sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      ),
    [robotTasks]
  );

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-sm text-slate-500">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f6f8fb] text-[#172033]">
      <aside className="fixed left-0 top-0 bottom-0 z-40 flex h-screen w-[245px] flex-col border-r border-[#e8edf3] bg-white px-[14px] py-[23px]">
        <div className="mb-[30px] flex items-center gap-[11px] px-[10px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#1769e0] text-xl font-extrabold text-white">
            M
          </div>
          <div>
            <div className="text-[18px] font-extrabold text-[#172033]">
              MedStock
            </div>
            <div className="mt-[2px] text-[9px] text-[#9ba3b0]">
              Healthcare Inventory
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-[5px]">
          <SidebarItem href="/hosdashboard" icon="📊" label="Dashboard" active />
          <SidebarItem href="/stock" icon="📦" label="Stock" />
          <SidebarItem href="/transactions" icon="🔄" label="Transactions" />
          <SidebarItem href="/products" icon="💊" label="Products" />
          <SidebarItem
            href="/warehouses"
            icon="🏢"
            label="Warehouses"
          />
          
          <SidebarItem
          href="/robot"
          icon="🤖"
          label="Robot Tasks"
          />

        </nav>

        <div className="mt-auto">
          <SidebarItem href="/profile" icon="👤" label="Profile & Settings" />
        </div>
      </aside>

      <main className="ml-[245px] min-w-0 flex-1 space-y-6 p-8">
        
<div className="flex items-center justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold text-[#172033]">
      Dashboard
    </h1>
    <p className="mt-1 text-sm text-[#7b8494]">
      Overview of your healthcare inventory
    </p>
  </div>

  <div className="flex items-center gap-3">
    <span
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        isProfessional
          ? "bg-purple-100 text-purple-700"
          : "bg-slate-200 text-slate-700"
      }`}
    >
      {subscription} Plan
    </span>

    {!isProfessional && (
      <button
        type="button"
        onClick={() => router.push("/price")}
        className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
      >
        Upgrade Plan →
      </button>
    )}
  </div>
</div>


        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Could not load all dashboard data.</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {!isProfessional && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <h3 className="font-bold text-purple-900">
              🔒 Professional Features
            </h3>
            <p className="mt-1 text-sm text-purple-700">
              Multiple Warehouses and Robot Task Automation are
              available exclusively on the Professional plan.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon="📦"
            title="Total Products"
            value={totalProductsCount}
            subtitle="Products available to your account"
          />
          <MetricCard
            icon="📊"
            title="Total Stock"
            value={totalStockQuantity}
            subtitle="Units currently available"
          />
          <MetricCard
            icon="⚠️"
            title="Low Stock"
            value={lowStockItems.length}
            subtitle="Stock rows at or below minimum"
          />
          <MetricCard
            icon="⏰"
            title="Expiring Soon"
            value={expiringSoonItems.length}
            subtitle="Within 30 days"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AlertBanner
            icon="⚠️"
            title="Low Stock Alert"
            message={`${lowStockItems.length} stock entries are at or below their minimum level.`}
            buttonText="Check Stock →"
            onClick={() => router.push("/stock")}
            color="amber"
          />
          <AlertBanner
            icon="⏰"
            title="Expiration Alert"
            message={`${expiringSoonItems.length} stock entries are approaching their expiration date.`}
            buttonText="View Items →"
            onClick={() => router.push("/stock")}
            color="rose"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Recent Transactions"
              subtitle="Latest inventory movements"
              onClick={() => router.push("/transactions")}
            />

            <div className="space-y-3">
              {recentTransactions.length ? (
                recentTransactions.slice(0, 4).map((tx, idx) => {
                  const type = tx.transaction_type || "Unknown";
                  const isStockIn = type === "Stock In";

                  return (
                    <div
                      key={tx.id ?? idx}
                      className="flex items-center justify-between border-b border-slate-100 pb-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            isStockIn
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isStockIn ? "↓" : "↑"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {tx.product_name || "Product"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {type} · {tx.warehouse_name || "Warehouse"}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-xs font-bold ${
                          isStockIn ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isStockIn ? "+" : "-"}
                        {tx.quantity} units
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState text="No recent transactions" />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Low Stock Items"
              subtitle="Items below or at minimum level"
              onClick={() => router.push("/stock")}
            />

            <div className="space-y-4">
              {lowStockItems.length ? (
                lowStockItems.slice(0, 4).map((item, idx) => {
                  const quantity = Number(item.quantity || 0);
                  const minimum = Number(item.min_stock ?? 0);
                  const progress =
                    minimum > 0
                      ? Math.min(100, (quantity / minimum) * 100)
                      : 0;

                  return (
                    <div key={`${item.product_id}-${item.warehouse_id}-${idx}`} className="space-y-1">
                      <div className="flex justify-between gap-3 text-xs font-semibold">
                        <span>{item.product_name || "Item"}</span>
                        <span className="whitespace-nowrap text-amber-600">
                          {quantity} / {minimum}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>
                          {item.warehouse_name || "Warehouse"} · {item.unit || "units"}
                        </span>
                        <span className="font-medium text-amber-600">
                          Need restock
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState text="No low stock items" />
              )}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Expiring Soon"
              subtitle="Products approaching expiration"
              onClick={() => router.push("/stock")}
            />

            <div className="space-y-3">
              {expiringSoonItems.length ? (
                expiringSoonItems.slice(0, 3).map((item, idx) => {
                  const date = new Date(item.expiration_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  date.setHours(0, 0, 0, 0);

                  const daysLeft = Math.ceil(
                    (date - today) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={`${item.product_id}-${item.warehouse_id}-${idx}`}
                      className="flex items-center justify-between border-b border-slate-100 pb-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                          ⏰
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {item.product_name || "Product"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.warehouse_name || "Warehouse"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">
                          {formatDate(item.expiration_date)}
                        </div>
                        <div className="text-xs font-medium text-rose-600">
                          {daysLeft} days left
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState text="No items expiring soon" />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Robot Tasks"
              subtitle="Current automation activity"
              onClick={
                isProfessional ? () => router.push("/robot") : undefined
              }
            />

            {!isProfessional ? (
              <div className="py-6 text-center">
                <div className="mb-2 text-3xl">🔒</div>
                <div className="text-sm font-semibold text-slate-800">
                  Professional Feature
                </div>
                <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">
                  Robot Task Automation is available on the Professional plan.
                </p>
                <p className="mt-4 text-xs text-purple-700">
                  Contact your administrator to upgrade your subscription.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRobotTasks.length ? (
                  recentRobotTasks.slice(0, 3).map((task, idx) => (
                    <div
                      key={task.id ?? idx}
                      className="flex items-center justify-between border-b border-slate-100 pb-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          🤖
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {task.task_name || "Robot Task"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {task.task_type || "Restock"} · {formatDate(task.created_at)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                          task.status === "Completed"
                            ? "bg-green-50 text-green-600"
                            : task.status === "In Progress"
                            ? "bg-blue-50 text-blue-600"
                            : task.status === "Failed"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {task.status || "Pending"}
                      </span>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No active robot tasks" />
                )}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Warehouses</h3>
              <p className="mt-1 text-xs text-slate-400">
                {warehouses.length} warehouse(s) configured
                {!isProfessional && " · Basic plan allows one warehouse"}
              </p>
            </div>
            <button
              onClick={() =>
                router.push(isProfessional ? "/warehouses" : "/price")
              }
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {isProfessional ? "Manage Warehouses" : "View Plan Features"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 font-bold text-slate-800">Quick Actions</h3>
          <p className="mb-4 text-xs text-slate-400">
            Frequently used inventory actions
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <QuickActionBtn
              title="Manage Stock"
              desc="Add or remove inventory"
              onClick={() => router.push("/stock")}
            />
            <QuickActionBtn
              title="Products"
              desc="Manage medicine products"
              onClick={() => router.push("/products")}
            />
            <QuickActionBtn
              title="Robot Tasks"
              desc="Professional automation"
              onClick={() =>
                router.push(isProfessional ? "/robot" : "/price")
              }
            />
            <QuickActionBtn
              title="Transactions"
              desc="View stock history"
              onClick={() => router.push("/transactions")}
            />
          </div>
        </section>
      </main>

      <style jsx>{`
        @media (max-width: 900px) {
          main {
            padding: 22px;
          }
        }

        @media (max-width: 700px) {
          aside {
            position: relative;
            width: 100%;
            height: auto;
            min-height: auto;
          }

          main {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}

function SidebarItem({ href, icon, label, active = false }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`mb-1 flex w-full items-center gap-3 rounded-[9px] border-none px-[13px] py-[11px] text-left text-xs transition ${
        active
          ? "bg-[#eaf2ff] font-bold text-[#1769e0]"
          : "bg-transparent font-medium text-[#687386] hover:bg-[#f0f5fd] hover:text-[#1769e0]"
      }`}
    >
      <span className="w-5 shrink-0 text-center text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MetricCard({ icon, title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </div>
        <div>
          <div className="text-xs text-slate-400">{title}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, onClick }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      {onClick && (
        <button
          onClick={onClick}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          View All
        </button>
      )}
    </div>
  );
}

function AlertBanner({ icon, title, message, buttonText, onClick, color }) {
  const colors =
    color === "rose"
      ? "border-rose-200 bg-rose-50/60 text-rose-900"
      : "border-amber-200 bg-amber-50/60 text-amber-900";

  const messageColor =
    color === "rose" ? "text-rose-700" : "text-amber-700";

  return (
    <div className={`flex items-center justify-between rounded-2xl border p-4 ${colors}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className={`text-xs ${messageColor}`}>{message}</div>
        </div>
      </div>
      <button
        onClick={onClick}
        className="shrink-0 text-xs font-semibold hover:underline"
      >
        {buttonText}
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="py-6 text-center text-xs text-slate-400">{text}</div>
  );
}

function QuickActionBtn({ title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50/50"
    >
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="mt-1 text-xs text-slate-400">{desc}</div>
      </div>
      <span className="text-slate-400">→</span>
    </button>
  );
}