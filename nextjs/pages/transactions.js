
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("Please log in again.");
        }

        const response = await fetch(
          "http://127.0.0.1:8000/api/transactions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(
            result.detail || "Failed to load transactions."
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid transaction data from server.");
        }

        const mappedTransactions = data.map((row) => ({
          id: row.id,
          product: row.product_name || "Unknown Product",
          type: row.transaction_type,
          quantity: Number(row.quantity || 0),
          unit: row.unit || "",
          date: row.created_at
            ? String(row.created_at).slice(0, 10)
            : "",
          user: row.user_name || "Staff",
          warehouse: row.warehouse_name || "",
          note: row.note || "",
          stockAfter: Number(row.stock_after || 0),
        }));

        if (!cancelled) {
          setTransactions(mappedTransactions);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load transactions:", err);

        if (!cancelled) {
          setError(err.message || "Failed to load transactions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    // Refresh when returning to this browser tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadTransactions();
      }
    };

    window.addEventListener("focus", loadTransactions);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadTransactions);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);


  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const productName = transaction.product || "";
    const userName = transaction.user || "";

    const matchesSearch =
      productName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      userName
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesType =
      typeFilter === "All" ||
      transaction.type === typeFilter;

    const matchesDate =
      dateFilter === "" ||
      transaction.date === dateFilter;
    return (
      matchesSearch &&
      matchesType &&
      matchesDate
    );
  });

  // Statistics
  const stockInCount = transactions.filter(
    (transaction) =>
      transaction.type === "Stock In"
  ).length;

  const stockOutCount = transactions.filter(
    (transaction) =>
      transaction.type === "Stock Out"
  ).length;

  const totalStockIn = transactions
    .filter(
      (transaction) =>
        transaction.type === "Stock In"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.quantity || 0),
      0
    );

  const totalStockOut = transactions
    .filter(
      (transaction) =>
        transaction.type === "Stock Out"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.quantity || 0),
      0
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            M
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-800">
              MedStock
            </h1>

            <p className="text-xs text-slate-500">
              Healthcare Inventory
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <Link
            href="/hosdashboard"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <span>📊</span>
            Dashboard
          </Link>

          <Link
            href="/stock"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <span>📦</span>
            Stock
          </Link>

          {/* Active */}
          <Link
            href="/transactions"
            className="mb-1 flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-600"
          >
            <span>🔄</span>
            Transactions
          </Link>

          <Link
            href="/products"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <span>💊</span>
            Products
          </Link>

          <Link
            href="/warehouses"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <span>🏢</span>
            Warehouses
          </Link>

          <Link
            href="/robot"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <span>🤖</span>
            Robot Tasks
          </Link>
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white p-4">
          <Link
            href="/profile"
            className="mb-3 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <span>👤</span>
            Profile & Settings
          </Link>

        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="border-b bg-white px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View stock in and stock out history
            </p>
          </div>
        </header>

        <div className="p-8">
          {/* Statistics */}
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {/* Stock In */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Stock In
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-slate-800">
                    {stockInCount}
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-xl">
                  📥
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {totalStockIn} total units
              </p>
            </div>

            {/* Stock Out */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Stock Out
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-slate-800">
                    {stockOutCount}
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-xl">
                  📤
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {totalStockOut} total units
              </p>
            </div>

            {/* Total Transactions */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Transactions
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-slate-800">
                    {transactions.length}
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl">
                  🔄
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                All transaction records
              </p>
            </div>

            {/* Net Stock */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Net Stock Change
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-slate-800">
                    {totalStockIn - totalStockOut}
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-xl">
                  📊
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Stock In − Stock Out
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Search */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search
                </label>

                <input
                  type="text"
                  placeholder="Search product or user..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Transaction Type
                </label>

                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="All">
                    All Types
                  </option>

                  <option value="Stock In">
                    Stock In
                  </option>

                  <option value="Stock Out">
                    Stock Out
                  </option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <h3 className="font-semibold text-slate-800">
                Transaction History
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Records of all stock movements
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Product
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Quantity
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      User
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
  <tr>
    <td colSpan="5" className="px-6 py-16 text-center">
      Loading transactions...
    </td>
  </tr>
) : error ? (
  <tr>
    <td
      colSpan="5"
      className="px-6 py-16 text-center text-red-600"
    >
      {error}
    </td>
  </tr>
) : filteredTransactions.length > 0 ? (
  filteredTransactions.map(
    (transaction, index) => (
      <tr
        key={
          transaction.id ||
          `${transaction.product}-${transaction.date}-${index}`
        }
        className="hover:bg-slate-50"
      >
        <td className="px-6 py-4">
          <p className="font-medium text-slate-800">
            {transaction.product || "Unknown Product"}
          </p>
        </td>

                          <td className="px-6 py-4">
                            {transaction.type ===
                            "Stock In" ? (
                              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Stock In
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                Stock Out
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={
                                transaction.type ===
                                "Stock In"
                                  ? "font-semibold text-green-600"
                                  : "font-semibold text-red-600"
                              }
                            >
                              {transaction.type ===
                              "Stock In"
                                ? "+"
                                : "-"}
                              {transaction.quantity || 0}{" "}
                              {transaction.unit || ""}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {transaction.date ||
                              "-"}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {transaction.user ||
                              "John Doe"}
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-16 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                            🔄
                          </div>

                          <h4 className="text-base font-semibold text-slate-700">
                            No transactions found
                          </h4>

                          <p className="mt-1 max-w-md text-sm text-slate-500">
                            There is no transaction
                            history yet. Stock In and
                            Stock Out transactions will
                            appear here when they are
                            recorded.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}