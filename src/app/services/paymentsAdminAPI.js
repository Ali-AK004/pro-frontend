import axios from "axios";
import { apiConfig } from "../../config/api";
import { attachAuthRefresh } from "../utils/authRefresh";

// Admin payments center and analytics
const api = axios.create({
  baseURL: `${apiConfig.baseURL}/admin`,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
attachAuthRefresh(api);

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));

export const paymentsAdminAPI = {
  orders: (filters, page = 0, size = 50) => api.get("/payments/orders", { params: clean({ ...filters, page, size }) }),
  order: (id) => api.get(`/payments/orders/${encodeURIComponent(id)}`),
  resolve: (id, note) => api.post(`/payments/orders/${encodeURIComponent(id)}/resolve`, { note }),
  sales: (filters, page = 0, size = 50) => api.get("/payments/sales", { params: clean({ ...filters, page, size }) }),
  refund: (reference, note, endAccess) =>
    api.post(`/payments/sales/${encodeURIComponent(reference)}/refund`, { note, endAccess }),
  reconciliation: (from, to) => api.get("/payments/reconciliation", { params: clean({ from, to }) }),
  analytics: (from, to) => api.get("/analytics", { params: clean({ from, to }) }),
};

export const csvDownload = (filename, header, rows) => {
  const cell = (value) => {
    let v = value == null ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
    return /[",\n\r']/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
