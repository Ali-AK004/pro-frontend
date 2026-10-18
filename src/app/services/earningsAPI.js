import axios from "axios";
import { apiConfig } from "../../config/api";
import { attachAuthRefresh } from "../utils/authRefresh";

// Instructor earnings (أرباح المدرسين) and payouts
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
attachAuthRefresh(apiClient);

const range = (from, to) => ({ ...(from ? { from } : {}), ...(to ? { to } : {}) });

/** The signed-in instructor's own numbers. */
export const myEarningsAPI = {
  summary: (from, to) => apiClient.get("/earnings/me/summary", { params: range(from, to) }),
  sales: (from, to, page = 0, size = 50) =>
    apiClient.get("/earnings/me/sales", { params: { ...range(from, to), page, size } }),
  payouts: () => apiClient.get("/earnings/me/payouts"),
};

/** Admin: one instructor's numbers, same shape as myEarningsAPI. */
export const instructorEarningsAPI = (instructorId) => ({
  summary: (from, to) =>
    apiClient.get(`/admin/earnings/instructors/${instructorId}/summary`, { params: range(from, to) }),
  sales: (from, to, page = 0, size = 50) =>
    apiClient.get(`/admin/earnings/instructors/${instructorId}/sales`, { params: { ...range(from, to), page, size } }),
  payouts: () => apiClient.get(`/admin/earnings/instructors/${instructorId}/payouts`),
  recordPayout: (data) => apiClient.post(`/admin/earnings/instructors/${instructorId}/payouts`, data),
  setCommission: (percent) =>
    apiClient.put(`/admin/earnings/instructors/${instructorId}/commission`, { percent }),
});

export const adminEarningsAPI = {
  balances: () => apiClient.get("/admin/earnings/instructors"),
};
