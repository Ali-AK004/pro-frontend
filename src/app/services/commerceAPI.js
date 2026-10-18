import axios from "axios";
import { apiConfig } from "../../config/api";
import { attachAuthRefresh } from "../utils/authRefresh";
import { asList, listParams } from "../utils/pageList";

// Bundles (باقات) and discount coupons (أكواد الخصم)
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
attachAuthRefresh(apiClient);

export const commerceAPI = {
  // Public: bundles on sale for a course or an instructor
  bundlesForCourse: (courseId) => apiClient.get("/public/bundles", { params: listParams({ courseId }) }).then(asList),
  bundlesForInstructor: (instructorId) =>
    apiClient.get("/public/bundles", { params: listParams({ instructorId }) }).then(asList),

  // Student
  buyBundle: (bundleId, paymentMethod, couponCode) =>
    apiClient.post(`/shop/bundles/${bundleId}/purchase`, {
      paymentMethod,
      couponCode: couponCode || null,
    }),
  previewCoupon: ({ code, lessonId, bundleId }) =>
    apiClient.post("/shop/coupons/preview", { code, lessonId: lessonId || null, bundleId: bundleId || null }),

  // Instructor / assistant / admin
  manage: {
    bundles: () => apiClient.get("/manage/bundles", { params: listParams() }).then(asList),
    bundleLessons: (instructorId, q) =>
      apiClient
        .get("/manage/bundle-lessons", { params: listParams({ instructorId: instructorId || undefined, q: q || undefined }) })
        .then(asList),
    createBundle: (data) => apiClient.post("/manage/bundles", data),
    updateBundle: (id, data) => apiClient.put(`/manage/bundles/${id}`, data),
    deleteBundle: (id) => apiClient.delete(`/manage/bundles/${id}`),
    coupons: () => apiClient.get("/manage/coupons", { params: listParams() }).then(asList),
    createCoupon: (data) => apiClient.post("/manage/coupons", data),
    setCouponActive: (id, active) => apiClient.patch(`/manage/coupons/${id}/active`, { active }),
  },
};

/** Arabic message from the API error body, or the fallback. */
export const apiMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors)[0];
    if (first) return String(first);
  }
  return data?.message || data?.error || fallback;
};
