
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function apiRequest(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const error = await response.json();
      message = error.detail || error.message || message;
    } catch {}

    throw new Error(message);
  }

  if (response.status === 204) return null;

  return response.json();
}

export const productsAPI = {
  getAll: () => apiRequest("/api/products"),

  getById: (id) => apiRequest(`/api/products/${id}`),

  create: (data) =>
    apiRequest("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiRequest(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiRequest(`/api/products/${id}`, {
      method: "DELETE",
    }),

  buy: (id) =>
    apiRequest(`/api/products/${id}/buy`, {
      method: "POST",
    }),
};
