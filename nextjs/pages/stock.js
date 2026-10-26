import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const API_BASE_URL = "http://127.0.0.1:8000/api";

async function stockApiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token")
      : null;

  console.log("Stock token exists:", !!token);

  if (!token) {
    throw new Error("Please log in again to continue.");
  }

  // โค้ดเดิมส่วนที่เหลือเก็บไว้เหมือนเดิม

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || `Request failed (${response.status})`
    );
  }

  return data;
}

const STOCK_STORAGE_KEY = "medstock_stock_items";
const BASIC_STOCK_KEY = "medstock_stock_items_Basic";
const PROFESSIONAL_STOCK_KEY =
  "medstock_stock_items_Professional";

const PRODUCTS_STORAGE_KEY = "medstock_products";
const BASIC_PRODUCTS_KEY = "medstock_basic_products";
const PROFESSIONAL_PRODUCTS_KEY =
  "medstock_professional_products";

const TRANSACTIONS_STORAGE_KEY = "transactions";

const WAREHOUSE_STORAGE_KEY =
  "medstock_warehouses";

const BASIC_WAREHOUSE_KEY =
  "medstock_warehouses_Basic";

const PROFESSIONAL_WAREHOUSE_KEY =
  "medstock_warehouses_Professional";

const fallbackProducts = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    category: "Tablet",
    unit: "tablets",
  },
  {
    id: 2,
    name: "Amoxicillin 500mg",
    category: "Capsule",
    unit: "capsules",
  },
  {
    id: 3,
    name: "Insulin Glargine",
    category: "Injection",
    unit: "vials",
  },
  {
    id: 4,
    name: "Ibuprofen 400mg",
    category: "Tablet",
    unit: "tablets",
  },
  {
    id: 5,
    name: "Ceftriaxone 1g",
    category: "Injection",
    unit: "vials",
  },
  {
    id: 6,
    name: "Omeprazole 20mg",
    category: "Capsule",
    unit: "capsules",
  },
];

const defaultStockData = [
  {
    name: "Paracetamol 500mg",
    quantity: 70,
    minStock: 10,
    expiryDate: "2027-03-15",
    location: "Main Warehouse",
  },
  {
    name: "Amoxicillin 500mg",
    quantity: 18,
    minStock: 30,
    expiryDate: "2026-11-20",
    location: "Main Warehouse",
  },
  {
    name: "Insulin Glargine",
    quantity: 5,
    minStock: 10,
    expiryDate: "2026-10-12",
    location: "Cold Storage",
  },
  {
    name: "Ibuprofen 400mg",
    quantity: 45,
    minStock: 15,
    expiryDate: "2027-02-10",
    location: "Main Warehouse",
  },
  {
    name: "Ceftriaxone 1g",
    quantity: 8,
    minStock: 20,
    expiryDate: "2026-12-05",
    location: "Main Warehouse",
  },
  {
    name: "Omeprazole 20mg",
    quantity: 60,
    minStock: 15,
    expiryDate: "2027-05-20",
    location: "Main Warehouse",
  },
];

function readJSON(key, fallback = null) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error(
      `Failed to read ${key}:`,
      error
    );

    return fallback;
  }
}

function writeJSON(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error(
      `Failed to save ${key}:`,
      error
    );
  }
}

function getStockKey(plan) {
  return plan === "Professional"
    ? PROFESSIONAL_STOCK_KEY
    : BASIC_STOCK_KEY;
}

function getWarehouseKey(plan) {
  return plan === "Professional"
    ? PROFESSIONAL_WAREHOUSE_KEY
    : BASIC_WAREHOUSE_KEY;
}

function makeDefaultWarehouses(plan) {
  const now =
    new Date().toISOString();

  const mainWarehouse = {
    id: "warehouse-1",
    name: "Main Warehouse",
    location: "Bangkok",
    description:
      "Main medicine storage area",
    createdAt: now,
  };

  if (plan === "Professional") {
    return [
      mainWarehouse,
      {
        id: "warehouse-2",
        name: "Cold Storage",
        location: "Bangkok",
        description:
          "Temperature-controlled storage",
        createdAt: now,
      },
      {
        id: "warehouse-3",
        name: "Emergency Storage",
        location: "Bangkok",
        description:
          "Emergency medicine storage",
        createdAt: now,
      },
    ];
  }

  return [mainWarehouse];
}

function loadWarehouses(plan) {
  let warehouses = readJSON(
    getWarehouseKey(plan),
    null
  );

  if (
    !Array.isArray(warehouses) ||
    warehouses.length === 0
  ) {
    warehouses = readJSON(
      WAREHOUSE_STORAGE_KEY,
      null
    );
  }

  if (
    !Array.isArray(warehouses) ||
    warehouses.length === 0
  ) {
    warehouses =
      makeDefaultWarehouses(plan);

    writeJSON(
      getWarehouseKey(plan),
      warehouses
    );
  }

  if (
    plan === "Basic" &&
    warehouses.length > 0
  ) {
    warehouses = [warehouses[0]];
  }

  return warehouses;
}

function findWarehouseId(
  warehouses,
  value
) {
  if (!warehouses.length) {
    return "warehouse-1";
  }

  const text = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  const foundById =
    warehouses.find(
      (warehouse) =>
        String(warehouse.id) ===
        String(value)
    );

  if (foundById) {
    return foundById.id;
  }

  const foundByName =
    warehouses.find(
      (warehouse) =>
        String(
          warehouse.name || ""
        )
          .trim()
          .toLowerCase() === text
    );

  if (foundByName) {
    return foundByName.id;
  }

  const foundByLocation =
    warehouses.find(
      (warehouse) =>
        String(
          warehouse.location || ""
        )
          .trim()
          .toLowerCase() === text
    );

  if (foundByLocation) {
    return foundByLocation.id;
  }

  return warehouses[0].id;
}

function getWarehouseName(
  warehouses,
  warehouseId
) {
  const warehouse =
    warehouses.find(
      (item) =>
        String(item.id) ===
        String(warehouseId)
    );

  return warehouse
    ? warehouse.name
    : "Main Warehouse";
}

function makeInitialStock(
  products,
  warehouses
) {
  return products.map(
    (product, index) => {
      const defaultData =
        defaultStockData.find(
          (item) =>
            item.name === product.name
        ) || {};

      return {
        id:
          product.id !== undefined
            ? product.id
            : `product-${index + 1}`,

        productId:
          product.id !== undefined
            ? product.id
            : `product-${index + 1}`,

        warehouseId:
          findWarehouseId(
            warehouses,
            defaultData.location ||
              "Main Warehouse"
          ),

        name:
          product.name ||
          "Unnamed Product",

        category:
          product.category ||
          "Medical Supply",

        quantity:
          defaultData.quantity !==
          undefined
            ? defaultData.quantity
            : 0,

        unit:
          product.unit ||
          defaultData.unit ||
          "units",

        minStock:
          defaultData.minStock !==
          undefined
            ? defaultData.minStock
            : 10,

        expiryDate:
          defaultData.expiryDate ||
          "",

        transactions: [],
      };
    }
  );
}

function migrateStock(
  stock,
  warehouses
) {
  if (!Array.isArray(stock)) {
    return [];
  }

  return stock.map(
    (item, index) => ({
      ...item,

      id:
        item.id !== undefined
          ? item.id
          : `stock-${index + 1}`,

      productId:
        item.productId !==
          undefined &&
        item.productId !== null
          ? item.productId
          : item.id,

      warehouseId:
        findWarehouseId(
          warehouses,
          item.warehouseId ||
            item.location ||
            "Main Warehouse"
        ),

      quantity: Number(
        item.quantity || 0
      ),

      minStock: Number(
        item.minStock || 0
      ),

      transactions:
        Array.isArray(
          item.transactions
        )
          ? item.transactions
          : [],
    })
  );
}

function mergeProductsWithStock(
  products,
  previousStock,
  warehouses
) {
  const migrated =
    migrateStock(
      previousStock,
      warehouses
    );

  return products.map(
    (product, index) => {
      const existing =
        migrated.find(
          (item) =>
            String(
              item.productId
            ) ===
              String(
                product.id
              ) ||
            item.name ===
              product.name
        );

      if (existing) {
        return {
          ...existing,

          productId:
            product.id !==
            undefined
              ? product.id
              : existing.productId,

          name: product.name,

          category:
            product.category ||
            existing.category ||
            "Medical Supply",

          unit:
            product.unit ||
            existing.unit ||
            "units",
        };
      }

      const defaultData =
        defaultStockData.find(
          (item) =>
            item.name ===
            product.name
        ) || {};

      return {
        id:
          product.id !==
          undefined
            ? product.id
            : `product-${index + 1}`,

        productId:
          product.id !==
          undefined
            ? product.id
            : `product-${index + 1}`,

        warehouseId:
          findWarehouseId(
            warehouses,
            defaultData.location ||
              "Main Warehouse"
          ),

        name:
          product.name,

        category:
          product.category ||
          "Medical Supply",

        quantity:
          defaultData.quantity !==
          undefined
            ? defaultData.quantity
            : 0,

        unit:
          product.unit ||
          "units",

        minStock:
          defaultData.minStock !==
          undefined
            ? defaultData.minStock
            : 10,

        expiryDate:
          defaultData.expiryDate ||
          "",

        transactions: [],
      };
    }
  );
}

export default function Stock() {
  const router = useRouter();

  const [subscription, setSubscription] =
    useState("Basic");

  const [items, setItems] =
    useState([]);

  const [productCatalog, setProductCatalog] =
    useState([]);

  const [warehouses, setWarehouses] =
    useState([]);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [warehouseFilter, setWarehouseFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [
    showTransactionModal,
    setShowTransactionModal,
  ] = useState(false);

  const [
    transactionType,
    setTransactionType,
  ] = useState("Stock In");

  const [
    transactionQuantity,
    setTransactionQuantity,
  ] = useState("");

  const [
    showAddModal,
    setShowAddModal,
  ] = useState(false);

  const [newItem, setNewItem] =
    useState({
      name: "",
      category: "",
      quantity: "",
      unit: "",
      minStock: "",
      expiryDate: "",
      warehouseId: "",
    });

  const today = new Date();
  const [planLoaded, setPlanLoaded] = useState(false);

  /*
   * =====================================================
   * LOAD PLAN + PRODUCTS + WAREHOUSES + STOCK
   * =====================================================
   */

  

useEffect(() => {
  let cancelled = false;

  async function loadStockFromBackend() {
    try {
      const token = sessionStorage.getItem("token")

        

      if (!token) {
        throw new Error("Please log in again.");
      }

      const userResponse = await fetch(
        "http://127.0.0.1:8000/api/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = await userResponse.json().catch(() => ({}));

      if (!userResponse.ok) {
        throw new Error(user.detail || "Unable to load account.");
      }

      const plan =
        user.subscription === "Professional"
          ? "Professional"
          : "Basic";

      const warehouseData = await stockApiFetch("/warehouses");
      if (!Array.isArray(warehouseData)) {
        throw new Error("Unable to load warehouses.");
      }

      const data = await stockApiFetch("/stock");
      console.log("Stock API data:", data);
console.log("Warehouse API data:", warehouseData);
console.log("First stock row:", data[0]);

      if (!Array.isArray(data)) {
        throw new Error("Invalid stock data received from server.");
      }

      if (cancelled) return;

      const productsMap = new Map();
      const warehousesMap = new Map();

      const backendItems = data.map((row) => {
        const productId = Number(row.product_id);

        const warehouseId = Number(row.warehouse_id);

        if (!productsMap.has(productId)) {
          productsMap.set(productId, {
            id: productId,
            name: row.product_name,
            category: row.category || "Medical Supply",
            unit: row.unit || "units",
            manufacturer: row.manufacturer || "",
          });
        }

        
        return {
          id:
            Number(row.stock_item_id) > 0
              ? Number(row.stock_item_id)
              : `stock-${productId}-${warehouseId}`,
          stockItemId:
            Number(row.stock_item_id) > 0
              ? Number(row.stock_item_id)
              : null,
          productId,
          warehouseId,
          name: row.product_name,
          category: row.category || "Medical Supply",
          unit: row.unit || "units",
          quantity: Number(row.quantity || 0),
          minStock: Number(row.min_stock || 0),
          expiryDate: row.expiration_date || "",
          location: row.storage_location || "",
          transactions: [],
        };
      });

      setSubscription(plan);
      setItems(backendItems);
      setProductCatalog(Array.from(productsMap.values()));
      setWarehouses(
        warehouseData.map((warehouse) => ({
          id: Number(warehouse.id),
          name: warehouse.name,
          location: warehouse.location || "",
      description: warehouse.description || "",
  }))
);

      setNewItem((current) => ({
  ...current,
  warehouseId:
    current.warehouseId &&
    warehouseData.some(
      (warehouse) =>
        String(warehouse.id) ===
        String(current.warehouseId)
    )
      ? current.warehouseId
      : warehouseData[0]?.id
        ? String(warehouseData[0].id)
        : "",
}));

      await loadTransactionsFromBackend();
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load stock:", error);

      if (!cancelled) {
        alert(`Unable to load stock: ${error.message}`);
      }
    }
  }


  loadStockFromBackend();

  return () => {
    cancelled = true;
  };
}, []);



  /*
   * =====================================================
   * SAVE STOCK
   * =====================================================
   */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const key =
      getStockKey(
        subscription
      );

    writeJSON(
      key,
      items
    );

    /*
     * Keep old key for compatibility
     * with older pages.
     */

    writeJSON(
      STOCK_STORAGE_KEY,
      items
    );
  }, [
    items,
    subscription,
    isLoaded,
  ]);



  /*
   * =====================================================
   * STATUS
   * =====================================================
   */

  const getStatus = (
    item
  ) => {
    if (
      Number(
        item.quantity
      ) === 0
    ) {
      return {
        text: "Out of Stock",
        className:
          "status status-red",
      };
    }

    if (
      item.expiryDate
    ) {
      const expiry =
        new Date(
          item.expiryDate
        );

      const diffDays =
        (expiry -
          today) /
        (1000 *
          60 *
          60 *
          24);

      if (
        expiry < today
      ) {
        return {
          text: "Expired",
          className:
            "status status-red",
        };
      }

      if (
        diffDays <= 30
      ) {
        return {
          text:
            "Expiring Soon",
          className:
            "status status-orange",
        };
      }
    }

    if (
      Number(
        item.quantity
      ) <=
      Number(
        item.minStock
      )
    ) {
      return {
        text: "Low Stock",
        className:
          "status status-yellow",
      };
    }

    return {
      text: "In Stock",
      className:
        "status status-green",
    };
  };

  /*
   * =====================================================
   * FILTER OPTIONS
   * =====================================================
   */

  const categories =
    useMemo(() => {
      return [
        "All",
        ...Array.from(
          new Set(
            items
              .map(
                (item) =>
                  item.category
              )
              .filter(Boolean)
          )
        ),
      ];
    }, [items]);

  const warehouseOptions =
    useMemo(() => {
      return [
        "All",
        ...warehouses.map(
          (warehouse) =>
            String(
              warehouse.id
            )
        ),
      ];
    }, [warehouses]);

  const warehouseName = (
    warehouseId
  ) => {
    return getWarehouseName(
      warehouses,
      warehouseId
    );
  };

  /*
   * =====================================================
   * FILTERED ITEMS
   * =====================================================
   */

  const filteredItems =
    useMemo(() => {
      return items.filter(
        (item) => {
          const status =
            getStatus(
              item
            ).text;

          const searchText =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            item.name
              .toLowerCase()
              .includes(
                searchText
              );

          const matchesCategory =
            categoryFilter ===
              "All" ||
            item.category ===
              categoryFilter;

          const matchesWarehouse =
            warehouseFilter ===
              "All" ||
            String(
              item.warehouseId
            ) ===
              String(
                warehouseFilter
              );

          const matchesStatus =
            statusFilter ===
              "All" ||
            status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesWarehouse &&
            matchesStatus
          );
        }
      );
    }, [
      items,
      search,
      categoryFilter,
      warehouseFilter,
      statusFilter,
      warehouses,
    ]);

  /*
   * =====================================================
   * STATISTICS
   * =====================================================
   */

  const totalItems =
    items.length;

  const totalQuantity =
    items.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  const lowStockCount = items.filter(
  (item) =>
    Number(item.quantity ?? 0) <=
    Number(item.minStock ?? 0)
).length;

  const expiringCount =
    items.filter(
      (item) => {
        if (
          !item.expiryDate
        ) {
          return false;
        }

        const expiry =
          new Date(
            item.expiryDate
          );

        const diffDays =
          (expiry -
            today) /
          (1000 *
            60 *
            60 *
            24);

        return (
          diffDays >= 0 &&
          diffDays <= 30
        );
      }
    ).length;

  const outOfStockCount =
    items.filter(
      (item) =>
        Number(
          item.quantity
        ) === 0
    ).length;

  /*
   * =====================================================
   * OPEN TRANSACTION
   * =====================================================
   */

  const openTransactionModal =
    (
      item,
      type
    ) => {
      setSelectedItem(
        item
      );

      setTransactionType(
        type
      );

      setTransactionQuantity(
        ""
      );

      setShowTransactionModal(
        true
      );
    };


const loadTransactionsFromBackend = async () => {
  try {
    const data = await stockApiFetch("/transactions");

    const list = Array.isArray(data)
      ? data
      : data.transactions || data.items || [data];

    const transactions = list.map((row) => ({
      id: row.id,
      product: row.product_name || "Unknown Product",
      type: row.transaction_type,
      quantity: Number(row.quantity || 0),
      stockAfter: Number(row.stock_after || 0),
      note: row.note || "",
      unit: row.unit || "units",
      warehouseId: Number(row.warehouse_id),
      warehouse: row.warehouse_name || "Warehouse",
      date: row.created_at
        ? new Date(row.created_at).toLocaleString()
        : "",
      user: row.user_name || "Staff",
    }));

    writeJSON(TRANSACTIONS_STORAGE_KEY, transactions);
  } catch (error) {
    console.error("Failed to load transactions:", error);
  }
};

  /*
   * =====================================================
   * STOCK IN / STOCK OUT
   * =====================================================
   */

 
const handleTransaction = async () => {
  if (!selectedItem) return;

  const amount = Number(transactionQuantity);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  if (
    transactionType === "Stock Out" &&
    amount > Number(selectedItem.quantity)
  ) {
    alert(
      `Insufficient stock.\n\nCurrent stock: ${selectedItem.quantity} ${selectedItem.unit}`
    );
    return;
  }

  const productId = Number(selectedItem.productId);
  const warehouseId = Number(selectedItem.warehouseId);

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(warehouseId) ||
    warehouseId <= 0
  ) {
    alert("Invalid product or warehouse ID.");
    return;
  }

  try {
    // Save transaction to the backend / PostgreSQL
    const result = await stockApiFetch("/stock/movements", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        warehouse_id: warehouseId,
        transaction_type: transactionType,
        quantity: amount,
        note: "",
      }),
    });

    const transactionDate = new Date()
      .toISOString()
      .split("T")[0];

    const historyEntry = {
      id: Date.now(),
      type: transactionType,
      quantity: amount,
      date: transactionDate,
      user: "Staff",
    };

    const newTransaction = {
      id: Date.now(),
      product: selectedItem.name,
      type: transactionType,
      quantity: amount,
      unit: selectedItem.unit,
      date: transactionDate,
      user: "John Doe",
      warehouseId,
      warehouse: warehouseName(warehouseId),
    };

    // Use the actual stock quantity returned by the backend
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              quantity: Number(result.stock_after),
              transactions: [
                ...(item.transactions || []),
                historyEntry,
              ],
            }
          : item
      )
    );

    // Temporary local display history; database remains the source of truth
    const oldTransactions = readJSON(
      TRANSACTIONS_STORAGE_KEY,
      []
    );

    await loadTransactionsFromBackend();

    setShowTransactionModal(false);
    setSelectedItem(null);
    setTransactionQuantity("");

    alert(`${transactionType} completed successfully.`);
  } catch (error) {
    console.error("Transaction failed:", error);
    alert(`Unable to save transaction: ${error.message}`);
  }
};

  /*
   * =====================================================
   * ADD INVENTORY
   * =====================================================
   */

  
const handleAddItem = async () => {
  if (
    !newItem.name.trim() ||
    !newItem.category ||
    newItem.quantity === "" ||
    !newItem.unit ||
    newItem.minStock === "" ||
    !newItem.expiryDate ||
    !newItem.warehouseId
  ) {
    alert("Please complete all required fields.");
    return;
  }

  const quantity = Number(newItem.quantity);
  const minStock = Number(newItem.minStock);

  if (
    !Number.isFinite(quantity) ||
    !Number.isFinite(minStock) ||
    quantity < 0 ||
    minStock < 0
  ) {
    alert("Please enter valid non-negative numbers.");
    return;
  }

  try {
    // 1. Load the real product catalog to avoid duplicating
    // shared seed products that are not yet in stock.
    const catalogData = await stockApiFetch("/products");

    const serverProducts = Array.isArray(catalogData)
      ? catalogData
      : catalogData.products;

    if (!Array.isArray(serverProducts)) {
      throw new Error("Unable to read the product catalog.");
    }

    let product = serverProducts.find(
      (p) =>
        p.name?.trim().toLowerCase() ===
        newItem.name.trim().toLowerCase()
    );

    // 2. Create a product only if it does not already exist.
    if (!product) {
      product = await stockApiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          name: newItem.name.trim(),
          category: newItem.category,
          unit: newItem.unit,
          manufacturer: "Unknown",
          description: "",
          price: 0,
          stock: 0,
          plan_level: subscription,
        }),
      });
    }

    const productId = Number(product.id);
    const warehouseId = Number(newItem.warehouseId);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(warehouseId) ||
      warehouseId <= 0
    ) {
      throw new Error("Invalid product or warehouse ID.");
    }

    
    // 3. Save expiry date and minimum stock.
    // Always use the backend stock item ID when available.
    const stockData = await stockApiFetch("/stock");

    const stockRows = Array.isArray(stockData)
      ? stockData
      : stockData.items || stockData.stock || [];

    const existingRow = stockRows.find((row) =>
      Number(row.product_id) === productId &&
      Number(row.warehouse_id) === warehouseId
    );

    if (existingRow && Number(existingRow.stock_item_id) > 0) {
      await stockApiFetch(
        `/stock/items/${Number(existingRow.stock_item_id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            min_stock: minStock,
            expiration_date: newItem.expiryDate,
          }),
        }
      );
    } else {
      await stockApiFetch("/stock/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: warehouseId,
          min_stock: minStock,
          expiration_date: newItem.expiryDate,
          storage_location: "",
        }),
      });
    }


    // 4. Record the initial quantity in the backend.
    if (quantity > 0) {
      await stockApiFetch("/stock/movements", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: warehouseId,
          transaction_type: "Stock In",
          quantity,
          note: "Initial stock entry",
        }),
      });
    }

    setShowAddModal(false);

    setNewItem({
      name: "",
      category: "",
      quantity: "",
      unit: "",
      minStock: "",
      expiryDate: "",
      warehouseId: warehouses[0]?.id || "",
    });

    alert("Inventory item saved successfully.");

    // Reload the page so stock is read back from the backend.
    router.reload();
  } catch (error) {
    console.error("Failed to add inventory item:", error);
    alert(`Unable to add inventory item: ${error.message}`);
  }
};


  /*
   * =====================================================
   * DELETE
   * =====================================================
   */

  const deleteItem = (
    id
  ) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this inventory item?"
      );

    if (
      !confirmDelete
    ) {
      return;
    }

    setItems(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );

    if (
      selectedItem?.id ===
      id
    ) {
      setSelectedItem(
        null
      );
    }

    alert(
      "Inventory item deleted successfully."
    );
  };

  /*
   * =====================================================
   * NAVIGATION
   * =====================================================
   */

  const goTo = (
    path
  ) => {
    router.push(
      path
    );
  };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="stock-page">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-box">
            M
          </div>

          <div>
            <div className="brand-name">
              MedStock
            </div>

            <div className="brand-subtitle">
              Healthcare Inventory
            </div>
          </div>
        </div>

        <nav className="navigation">
          <button
            className="nav-item"
            onClick={() =>
              goTo(
                "/hosdashboard"
              )
            }
          >
            <span className="nav-icon">
              📊
            </span>

            <span>
              Dashboard
            </span>
          </button>

          <button
            className="nav-item active"
            onClick={() =>
              goTo("/stock")
            }
          >
            <span className="nav-icon">
              📦
            </span>

            <span>
              Stock
            </span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              goTo(
                "/transactions"
              )
            }
          >
            <span className="nav-icon">
              🔄
            </span>

            <span>
              Transactions
            </span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              goTo(
                "/products"
              )
            }
          >
            <span className="nav-icon">
              💊
            </span>

            <span>
              Products
            </span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              goTo(
                "/warehouses"
              )
            }
          >
            <span className="nav-icon">
              🏢
            </span>

            <span>
              Warehouses
            </span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              goTo("/robot")
            }
          >
            <span className="nav-icon">
              🤖
            </span>

            <span>
              Robot Tasks
            </span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() =>
              goTo(
                "/profile"
              )
            }
          >
            <span className="nav-icon">
              👤
            </span>

            <span>
              Profile & Settings
            </span>
          </button>

          
          
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="breadcrumb">
              Inventory
              <span>›</span>
              Stock
            </div>

            <h1>
              Stock Management
            </h1>

            <p>
              Monitor inventory
              levels, manage
              stock movement,
              and identify
              restocking needs.
            </p>
          </div>

          <div className="header-actions">
            

            <div className="current-plan">
              Current Plan:
              <strong>
                {subscription}
              </strong>
            </div>

            <button
              className="add-button"
              onClick={() =>
                setShowAddModal(
                  true
                )
              }
            >
              + Add Inventory
            </button>
          </div>
        </div>

        <div className="plan-banner">
          <div>
            <strong>
              {subscription} Plan
            </strong>

            <span>
              {" "}
              ·{" "}
              {
                productCatalog.length
              }{" "}
              products available
            </span>
          </div>

          <div>
            {subscription ===
            "Professional"
              ? "Unlimited products"
              : "Up to 500 products"}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              📦
            </div>

            <div>
              <div className="stat-label">
                Total Products
              </div>

              <div className="stat-value">
                {totalItems}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              📊
            </div>

            <div>
              <div className="stat-label">
                Total Quantity
              </div>

              <div className="stat-value">
                {totalQuantity.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              ⚠️
            </div>

            <div>
              <div className="stat-label">
                Low Stock
              </div>

              <div className="stat-value">
                {lowStockCount}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              ⏰
            </div>

            <div>
              <div className="stat-label">
                Expiring Soon
              </div>

              <div className="stat-value">
                {expiringCount}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              🚫
            </div>

            <div>
              <div className="stat-label">
                Out of Stock
              </div>

              <div className="stat-value">
                {outOfStockCount}
              </div>
            </div>
          </div>
        </div>

        <section className="inventory-section">
          <div className="section-header">
            <div>
              <h2>
                Inventory Items
              </h2>

              <p>
                Products are
                synchronized with
                Product Master.
                Warehouse totals
                are managed on
                the Warehouses
                page.
              </p>
            </div>
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <span>
                🔍
              </span>

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={
                categoryFilter
              }
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >
              {categories.map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <select
              value={
                warehouseFilter
              }
              onChange={(event) =>
                setWarehouseFilter(
                  event.target.value
                )
              }
            >
              {warehouseOptions.map(
                (warehouseId) => (
                  <option
                    key={
                      warehouseId
                    }
                    value={
                      warehouseId
                    }
                  >
                    {warehouseId ===
                    "All"
                      ? "All Warehouses"
                      : warehouseName(
                          warehouseId
                        )}
                  </option>
                )
              )}
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="In Stock">
                In Stock
              </option>

              <option value="Low Stock">
                Low Stock
              </option>

              <option value="Expiring Soon">
                Expiring Soon
              </option>

              <option value="Out of Stock">
                Out of Stock
              </option>

              <option value="Expired">
                Expired
              </option>
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    Product
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Current Stock
                  </th>

                  <th>
                    Min. Stock
                  </th>

                  <th>
                    Expiry Date
                  </th>

                  <th>
                    Warehouse
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="empty-state"
                    >
                      <div className="empty-icon">
                        📦
                      </div>

                      <strong>
                        No inventory
                        items found
                      </strong>

                      <span>
                        Try changing
                        your search
                        or filters.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(
                    (item) => {
                      const status =
                        getStatus(
                          item
                        );

                      return (
                        <tr
                          key={`${item.id}-${item.warehouseId}`}
                        >
                          <td>
                            <div className="product-name">
                              {
                                item.name
                              }
                            </div>

                            <div className="product-unit">
                              Unit:{" "}
                              {
                                item.unit
                              }
                            </div>
                          </td>

                          <td>
                            {
                              item.category
                            }
                          </td>

                          <td>
                            <strong>
                              {Number(
                                item.quantity
                              ).toLocaleString()}
                            </strong>{" "}
                            {
                              item.unit
                            }
                          </td>

                          <td>
                            {
                              item.minStock
                            }{" "}
                            {
                              item.unit
                            }
                          </td>

                          <td>
                            {
                              item.expiryDate ||
                              "-"
                            }
                          </td>

                          <td>
                            <span className="warehouse-badge">
                              🏢{" "}
                              {warehouseName(
                                item.warehouseId
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                status.className
                              }
                            >
                              {
                                status.text
                              }
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                className="view-button"
                                onClick={() =>
                                  setSelectedItem(
                                    item
                                  )
                                }
                              >
                                View
                              </button>

                              <button
                                className="in-button"
                                onClick={() =>
                                  openTransactionModal(
                                    item,
                                    "Stock In"
                                  )
                                }
                              >
                                In
                              </button>

                              <button
                                className="out-button"
                                onClick={() =>
                                  openTransactionModal(
                                    item,
                                    "Stock Out"
                                  )
                                }
                              >
                                Out
                              </button>

                              <button
                                className="delete-button"
                                onClick={() =>
                                  deleteItem(
                                    item.id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showTransactionModal &&
        selectedItem && (
          <div className="modal-overlay">
            <div className="modal transaction-modal">
              <div className="modal-header">
                <div>
                  <h2>
                    {
                      transactionType
                    }
                  </h2>

                  <p>
                    {
                      selectedItem.name
                    }
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={() => {
                    setShowTransactionModal(
                      false
                    );

                    setSelectedItem(
                      null
                    );
                  }}
                >
                  ×
                </button>
              </div>

              <div className="transaction-summary">
                <div>
                  <span>
                    Warehouse
                  </span>

                  <strong>
                    {warehouseName(
                      selectedItem.warehouseId
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Current Stock
                  </span>

                  <strong>
                    {
                      selectedItem.quantity
                    }{" "}
                    {
                      selectedItem.unit
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Minimum Stock
                  </span>

                  <strong>
                    {
                      selectedItem.minStock
                    }{" "}
                    {
                      selectedItem.unit
                    }
                  </strong>
                </div>
              </div>

              <label>
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={
                  transactionQuantity
                }
                onChange={(event) =>
                  setTransactionQuantity(
                    event.target.value
                  )
                }
                placeholder="Enter quantity"
                autoFocus
              />

              {transactionType ===
                "Stock Out" && (
                <div className="helper-text">
                  Maximum available:
                  {" "}
                  {
                    selectedItem.quantity
                  }{" "}
                  {
                    selectedItem.unit
                  }
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setShowTransactionModal(
                      false
                    );

                    setSelectedItem(
                      null
                    );
                  }}
                >
                  Cancel
                </button>

                <button
                  className={
                    transactionType ===
                    "Stock In"
                      ? "confirm-in-button"
                      : "confirm-out-button"
                  }
                  onClick={
                    handleTransaction
                  }
                >
                  Confirm{" "}
                  {
                    transactionType
                  }
                </button>
              </div>
            </div>
          </div>
        )}

      {selectedItem &&
        !showTransactionModal && (
          <div className="modal-overlay">
            <div className="modal details-modal">
              <div className="modal-header">
                <div>
                  <h2>
                    Product Details
                  </h2>

                  <p>
                    {
                      selectedItem.name
                    }
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setSelectedItem(
                      null
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="details-grid">
                <div className="detail-box">
                  <span>
                    Product
                  </span>

                  <strong>
                    {
                      selectedItem.name
                    }
                  </strong>
                </div>

                <div className="detail-box">
                  <span>
                    Category
                  </span>

                  <strong>
                    {
                      selectedItem.category
                    }
                  </strong>
                </div>

                <div className="detail-box">
                  <span>
                    Current Stock
                  </span>

                  <strong>
                    {
                      selectedItem.quantity
                    }{" "}
                    {
                      selectedItem.unit
                    }
                  </strong>
                </div>

                <div className="detail-box">
                  <span>
                    Minimum Stock
                  </span>

                  <strong>
                    {
                      selectedItem.minStock
                    }{" "}
                    {
                      selectedItem.unit
                    }
                  </strong>
                </div>

                <div className="detail-box">
                  <span>
                    Expiry Date
                  </span>

                  <strong>
                    {
                      selectedItem.expiryDate ||
                      "-"
                    }
                  </strong>
                </div>

                <div className="detail-box">
                  <span>
                    Warehouse
                  </span>

                  <strong>
                    {warehouseName(
                      selectedItem.warehouseId
                    )}
                  </strong>
                </div>
              </div>

              <div className="history-section">
                <h3>
                  Transaction
                  History
                </h3>

                {(
                  selectedItem.transactions ||
                  []
                ).length === 0 ? (
                  <div className="no-history">
                    No transactions
                    recorded yet.
                  </div>
                ) : (
                  <div className="history-list">
                    {[
                      ...(
                        selectedItem.transactions ||
                        []
                      ),
                    ]
                      .reverse()
                      .map(
                        (
                          transaction
                        ) => (
                          <div
                            className="history-row"
                            key={
                              transaction.id
                            }
                          >
                            <div>
                              <strong>
                                {
                                  transaction.type
                                }
                              </strong>

                              <span>
                                {
                                  transaction.date
                                }
                              </span>
                            </div>

                            <strong
                              className={
                                transaction.type ===
                                "Stock In"
                                  ? "history-in"
                                  : "history-out"
                              }
                            >
                              {transaction.type ===
                              "Stock In"
                                ? "+"
                                : "-"}
                              {
                                transaction.quantity
                              }{" "}
                              {
                                selectedItem.unit
                              }
                            </strong>
                          </div>
                        )
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal add-modal">
            <div className="modal-header">
              <div>
                <h2>
                  Add Inventory
                </h2>

                <p>
                  Add a product to a
                  warehouse.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <div className="form-field full">
                <label>
                  Product Name *
                </label>

                <input
                  list="product-list"
                  value={
                    newItem.name
                  }
                  onChange={(event) => {
                    const value =
                      event.target
                        .value;

                    const selectedProduct =
                      productCatalog.find(
                        (product) =>
                          product.name ===
                          value
                      );

                    setNewItem(
                      (current) => ({
                        ...current,

                        name:
                          value,

                        category:
                          selectedProduct?.category ||
                          current.category,

                        unit:
                          selectedProduct?.unit ||
                          current.unit,
                      })
                    );
                  }}
                  placeholder="Select or enter product"
                />

                <datalist id="product-list">
                  {productCatalog.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.name
                        }
                      >
                        {
                          product.category
                        }
                      </option>
                    )
                  )}
                </datalist>
              </div>

              <div className="form-field">
                <label>
                  Category *
                </label>

                <select
                  value={
                    newItem.category
                  }
                  onChange={(event) =>
                    setNewItem(
                      (current) => ({
                        ...current,
                        category:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  <option value="">
                    Select category
                  </option>

                  <option>
                    Tablet
                  </option>

                  <option>
                    Capsule
                  </option>

                  <option>
                    Injection
                  </option>

                  <option>
                    Medical Supply
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label>
                  Unit *
                </label>

                <input
                  value={
                    newItem.unit
                  }
                  onChange={(event) =>
                    setNewItem(
                      (current) => ({
                        ...current,
                        unit:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. tablets"
                />
              </div>

              <div className="form-field">
                <label>
                  Quantity *
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    newItem.quantity
                  }
                  onChange={(event) =>
                    setNewItem(
                      (current) => ({
                        ...current,
                        quantity:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Minimum Stock *
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    newItem.minStock
                  }
                  onChange={(event) =>
                    setNewItem(
                      (current) => ({
                        ...current,
                        minStock:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Expiry Date *
                </label>

                <input
                  type="date"
                  value={
                    newItem.expiryDate
                  }
                  onChange={(event) =>
                    setNewItem(
                      (current) => ({
                        ...current,
                        expiryDate:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Warehouse *
                </label>

                <select
                  value={
                    newItem.warehouseId
                  }
                  onChange={(event) =>
                    setNewItem(
                      (current) => ({
                        ...current,
                        warehouseId:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={
                          warehouse.id
                        }
                        value={
                          warehouse.id
                        }
                      >
                        {
                          warehouse.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() =>
                  setShowAddModal(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                className="confirm-blue-button"
                onClick={
                  handleAddItem
                }
              >
                Add Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .stock-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family:
            Inter,
            Arial,
            sans-serif;
        }

        .sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 250px;
          background: #fff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 22px 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .logo-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          display: grid;
          place-items: center;
          font-size: 20px;
          font-weight: 800;
        }

        .brand-name {
          font-weight: 800;
          font-size: 17px;
        }

        .brand-subtitle {
          color: #94a3b8;
          font-size: 10px;
          margin-top: 2px;
        }

        .navigation {
          padding: 16px 12px;
        }

        .nav-item {
          width: 100%;
          border: 0;
          background: transparent;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 13px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          text-align: left;
          margin-bottom: 4px;
        }

        .nav-item:hover {
          background: #f8fafc;
          color: #2563eb;
        }

        .nav-item.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 700;
        }

        .nav-icon {
          width: 22px;
          text-align: center;
        }

        .sidebar-bottom {
          margin-top: auto;
          padding: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .user-card {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 10px 5px 5px;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 800;
        }

        .user-name {
          font-size: 12px;
          font-weight: 700;
        }

        .user-role {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .main-content {
          margin-left: 250px;
          padding: 30px 34px 50px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-end;
        }

        .breadcrumb {
          color: #94a3b8;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .breadcrumb span {
          margin: 0 7px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: -0.5px;
        }

        .page-header p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .plan-switch {
          display: flex;
          background: #e2e8f0;
          padding: 3px;
          border-radius: 9px;
        }

        .plan-button {
          border: 0;
          background: transparent;
          padding: 8px 13px;
          border-radius: 7px;
          cursor: pointer;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        .plan-button.selected {
          background: #fff;
          color: #2563eb;
          box-shadow:
            0 1px 4px
              rgba(
                15,
                23,
                42,
                0.1
              );
        }

        .current-plan {
          font-size: 11px;
          color: #64748b;
        }

        .current-plan strong {
          color: #0f172a;
          margin-left: 3px;
        }

        .add-button {
          border: 0;
          background: #2563eb;
          color: #fff;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .plan-banner {
          margin-top: 22px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 10px;
          padding: 12px 15px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          color: #1d4ed8;
          font-size: 11px;
        }

        .plan-banner span {
          color: #64748b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          gap: 12px;
          margin: 16px 0;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          padding: 15px;
          display: flex;
          gap: 11px;
          align-items: center;
        }

        .stat-icon {
          width: 35px;
          height: 35px;
          border-radius: 9px;
          display: grid;
          place-items: center;
        }

        .stat-icon.blue {
          background: #eff6ff;
        }

        .stat-icon.purple {
          background: #f5f3ff;
        }

        .stat-icon.yellow {
          background: #fefce8;
        }

        .stat-icon.orange {
          background: #fff7ed;
        }

        .stat-icon.red {
          background: #fef2f2;
        }

        .stat-label {
          font-size: 10px;
          color: #64748b;
        }

        .stat-value {
          font-size: 19px;
          font-weight: 800;
          margin-top: 2px;
        }

        .inventory-section {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .section-header {
          padding: 18px 19px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 16px;
        }

        .section-header p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .filter-bar {
          padding: 12px 18px;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          display: grid;
          grid-template-columns:
            2fr 1fr 1.2fr 1.2fr;
          gap: 9px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0 10px;
        }

        .search-box input {
          border: 0 !important;
          margin: 0 !important;
          outline: 0;
          flex: 1;
        }

        .filter-bar select,
        .search-box input {
          width: 100%;
          height: 36px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0 10px;
          color: #475569;
          font-size: 11px;
          background: #fff;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        th {
          background: #f8fafc;
          color: #64748b;
          text-align: left;
          font-size: 10px;
          padding: 11px 14px;
          white-space: nowrap;
        }

        td {
          border-top: 1px solid #f1f5f9;
          padding: 13px 14px;
          font-size: 11px;
          vertical-align: middle;
        }

        .product-name {
          font-weight: 700;
          color: #0f172a;
        }

        .product-unit {
          font-size: 9px;
          color: #94a3b8;
          margin-top: 3px;
        }

        .warehouse-badge {
          display: inline-block;
          padding: 5px 7px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          color: #475569;
          white-space: nowrap;
        }

        .status {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-green {
          background: #dcfce7;
          color: #15803d;
        }

        .status-yellow {
          background: #fef9c3;
          color: #a16207;
        }

        .status-orange {
          background: #ffedd5;
          color: #c2410c;
        }

        .status-red {
          background: #fee2e2;
          color: #b91c1c;
        }

        .action-buttons {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .action-buttons button {
          border: 0;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .view-button {
          background: #f1f5f9;
          color: #475569;
        }

        .in-button {
          background: #dcfce7;
          color: #15803d;
        }

        .out-button {
          background: #fee2e2;
          color: #b91c1c;
        }

        .delete-button {
          background: #f8fafc;
          color: #64748b;
        }

        .empty-state {
          text-align: center;
          padding: 55px !important;
        }

        .empty-state div {
          font-size: 30px;
        }

        .empty-state strong,
        .empty-state span {
          display: block;
          margin-top: 7px;
        }

        .empty-state span {
          color: #94a3b8;
          font-size: 11px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background:
            rgba(
              15,
              23,
              42,
              0.42
            );
          display: grid;
          place-items: center;
          padding: 20px;
          z-index: 50;
        }

        .modal {
          background: #fff;
          width: min(
            650px,
            100%
          );
          max-height: 90vh;
          overflow: auto;
          border-radius: 13px;
          padding: 20px;
          box-shadow:
            0 20px 60px
              rgba(
                15,
                23,
                42,
                0.2
              );
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 17px;
        }

        .modal-header p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .close-button {
          border: 0;
          background: #f1f5f9;
          width: 30px;
          height: 30px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 20px;
          color: #64748b;
        }

        .transaction-summary {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 9px;
          margin-bottom: 17px;
        }

        .transaction-summary > div,
        .detail-box {
          padding: 11px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .transaction-summary span,
        .detail-box span {
          display: block;
          color: #64748b;
          font-size: 9px;
          margin-bottom: 4px;
        }

        .transaction-summary strong,
        .detail-box strong {
          font-size: 11px;
        }

        .modal label,
        .form-field label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .modal input,
        .modal select {
          width: 100%;
          height: 38px;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          padding: 0 10px;
          font-size: 11px;
          margin-bottom: 13px;
          outline: none;
        }

        .modal input:focus,
        .modal select:focus {
          border-color: #60a5fa;
          box-shadow:
            0 0 0 3px
              rgba(
                96,
                165,
                250,
                0.12
              );
        }

        .helper-text {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 9px 11px;
          border-radius: 7px;
          font-size: 10px;
          margin-bottom: 13px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
        }

        .modal-actions button {
          border: 0;
          border-radius: 7px;
          padding: 9px 13px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .cancel-button {
          background: #f1f5f9;
          color: #475569;
        }

        .confirm-in-button {
          background: #16a34a;
          color: #fff;
        }

        .confirm-out-button {
          background: #dc2626;
          color: #fff;
        }

        .confirm-blue-button {
          background: #2563eb;
          color: #fff;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .history-section {
          margin-top: 20px;
        }

        .history-section h3 {
          margin: 0 0 9px;
          font-size: 14px;
        }

        .history-list {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .history-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 11px;
          border-bottom: 1px solid #f1f5f9;
        }

        .history-row:last-child {
          border-bottom: 0;
        }

        .history-row div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .history-row span {
          color: #64748b;
          font-size: 9px;
        }

        .history-in {
          color: #16a34a;
        }

        .history-out {
          color: #dc2626;
        }

        .no-history {
          background: #f8fafc;
          border-radius: 8px;
          padding: 14px;
          color: #64748b;
          font-size: 11px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-field.full {
          grid-column: 1 / -1;
        }

        .form-field input,
        .form-field select {
          margin-bottom: 0;
        }

        @media (max-width: 1300px) {
          .stats-grid {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .filter-bar {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (max-width: 900px) {
          .sidebar {
            width: 75px;
          }

          .brand {
            justify-content: center;
            padding: 15px 8px;
          }

          .brand > div:last-child {
            display: none;
          }

          .nav-item {
            justify-content: center;
            padding: 0;
            height: 42px;
          }

          .nav-item span:last-child {
            display: none;
          }

          .user-card {
            justify-content: center;
          }

          .user-info {
            display: none;
          }

          .main-content {
            margin-left: 75px;
            width: calc(
              100% - 75px
            );
            padding: 22px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            justify-content: flex-start;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .main-content {
            padding: 15px;
          }

          .stats-grid,
          .filter-bar,
          .form-grid,
          .details-grid {
            grid-template-columns: 1fr;
          }

          .form-field.full {
            grid-column: auto;
          }

          .plan-banner {
            flex-direction: column;
            align-items: flex-start;
          }

          .transaction-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}