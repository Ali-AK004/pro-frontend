// Staff roles on the admin dashboard. The server enforces every rule; this only hides what a
// limited admin can't open, so they never land on a page full of "forbidden" errors.

export const PERMISSIONS = {
  SUPPORT: { label: "المستخدمون والدعم", description: "الحسابات، صلاحيات الطلاب على الدروس، انتهاء الصلاحية، تقارير ولي الأمر" },
  CONTENT: { label: "المحتوى", description: "الكورسات والدروس والامتحانات والواجبات والفيديو والباقات والكوبونات" },
  FINANCE: { label: "المالية", description: "المحفظة والكروت، مركز المدفوعات، التحليلات، أرباح المدرسين، أكواد الوصول" },
  AUDIT: { label: "سجل العمليات", description: "الاطلاع على سجل كل ما تم في لوحة الإدارة" },
};

// null = every admin; "SUPER" = super admins only
export const TAB_PERMISSION = {
  dashboard: null,
  "ai-chat": null,
  analytics: "FINANCE",
  payments: "FINANCE",
  wallet: "FINANCE",
  earnings: "FINANCE",
  "access-codes": "FINANCE",
  users: "SUPPORT",
  "student-lessons": "SUPPORT",
  "lesson-expiration": "SUPPORT",
  courses: "CONTENT",
  lessons: "CONTENT",
  exams: "CONTENT",
  assignments: "CONTENT",
  bundles: "CONTENT",
  "audit-logs": "AUDIT",
  staff: "SUPER",
};

export function can(user, permission) {
  if (user?.role !== "ADMIN") return false;
  if (!permission) return true;
  if (user.superAdmin) return true;
  return permission !== "SUPER" && Array.isArray(user.permissions) && user.permissions.includes(permission);
}

// tabs not listed here are super-admin only
export const canOpen = (user, tab) => can(user, tab in TAB_PERMISSION ? TAB_PERMISSION[tab] : "SUPER");

export function roleLabel(user) {
  if (user?.superAdmin) return "مدير عام";
  const names = (user?.permissions || []).map((p) => PERMISSIONS[p]?.label).filter(Boolean);
  return names.length ? `مشرف: ${names.join("، ")}` : "مشرف";
}
