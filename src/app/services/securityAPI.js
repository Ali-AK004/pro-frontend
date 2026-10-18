import axios from "axios";
import { apiConfig } from "../../config/api";
import { attachAuthRefresh } from "../utils/authRefresh";

// Platform settings and the security page (super admins only)
const api = axios.create({
  baseURL: `${apiConfig.baseURL}/admin`,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
attachAuthRefresh(api);

export const securityAPI = {
  settings: () => api.get("/settings"),
  saveSettings: (values) => api.put("/settings", values),
  overview: () => api.get("/security/overview"),
  lockedUsers: (page, size) => api.get("/security/locked-users", { params: { page, size } }),
  unlock: (id) => api.post(`/security/users/${id}/unlock`),
  signOutUser: (id) => api.post(`/security/users/${id}/sign-out`),
  signOutEveryone: (confirmation) => api.post("/security/sign-out-everyone", { confirmation }),
  events: (page, size) => api.get("/security/events", { params: { page, size } }),
};
