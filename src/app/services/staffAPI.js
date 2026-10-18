import axios from "axios";
import { apiConfig } from "../../config/api";
import { attachAuthRefresh } from "../utils/authRefresh";
import { asList, listParams } from "../utils/pageList";

// Admin team and permissions (super admins only)
const api = axios.create({
  baseURL: `${apiConfig.baseURL}/admin/staff`,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
attachAuthRefresh(api);

export const staffAPI = {
  list: () => api.get("", { params: listParams() }).then(asList),
  create: (body) => api.post("", body),
  update: (id, superAdmin, permissions) => api.put(`/${id}`, { superAdmin, permissions }),
  setEnabled: (id, enabled) => api.post(`/${id}/enabled`, { enabled }),
};
