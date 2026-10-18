import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "../../../../models/UserContext";
import { canOpen, roleLabel } from "../permissions";
import axios from "axios";
import {
  FiBarChart2,
  FiShield,
  FiPackage,
  FiDollarSign,
  FiHome,
  FiUsers,
  FiBook,
  FiFileText,
  FiCode,
  FiClock,
  FiLogOut,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiClipboard,
  FiMessageCircle,
  FiMenu,
  FiX,
  FiUserPlus,
  FiCreditCard,
} from "react-icons/fi";
import apiConfig, { API_ENDPOINTS } from "@/config/api";
import { handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, clearUser } = useUserData();

  const handleLogout = async () => {
    try {
      // Clear frontend state immediately
      clearUser();

      axios
        .post(
          `${apiConfig.baseURL}${API_ENDPOINTS.AUTH.LOGOUT}`,
          {},
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        )
        .catch(() => { });

      // Redirect to home page
      router.replace("/");
      window.location.href = "/";
    } catch (error) {
      toast.error(handleAPIError(error, "فشل تسجيل الخروج"));
      router.replace("/");
      window.location.href = "/";
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: FiHome,
      description: "نظرة عامة على النظام",
    },
    {
      id: "analytics",
      label: "التحليلات",
      icon: FiBarChart2,
      description: "المبيعات والتحصيل والطلاب",
    },
    {
      id: "payments",
      label: "مركز المدفوعات",
      icon: FiDollarSign,
      description: "المدفوعات والاسترداد والتسوية",
    },
    {
      id: "users",
      label: "إدارة المستخدمين",
      icon: FiUsers,
      description: "المدرسين والمساعدين والطلاب",
    },
    {
      id: "courses",
      label: "إدارة الكورسات",
      icon: FiBook,
      description: "إنشاء وتعديل الكورسات",
    },
    {
      id: "lessons",
      label: "إدارة الدروس",
      icon: FiFileText,
      description: "إنشاء وتعديل الدروس",
    },
    {
      id: "exams",
      label: "إدارة الامتحانات",
      icon: FiHelpCircle,
      description: "إنشاء وتعديل الامتحانات",
    },
    {
      id: "assignments",
      label: "إدارة الواجبات",
      icon: FiClipboard,
      description: "إنشاء وتعديل الواجبات",
    },
    {
      id: "access-codes",
      label: "أكواد الوصول",
      icon: FiCode,
      description: "إنشاء وإدارة أكواد الوصول",
    },
    {
      id: "wallet",
      label: "المحفظة والكروت",
      icon: FiCreditCard,
      description: "كروت الشحن والمدفوعات",
    },
    {
      id: "bundles",
      label: "الباقات وأكواد الخصم",
      icon: FiPackage,
      description: "باقات الدروس وعروض الخصم",
    },
    {
      id: "earnings",
      label: "أرباح المدرسين",
      icon: FiDollarSign,
      description: "المستحقات والدفعات والعمولات",
    },
    {
      id: "student-lessons",
      label: "تقدم الطلاب",
      icon: FiUserPlus,
      description: "إدارة تقدم الطلاب في الدروس",
    },
    {
      id: "lesson-expiration",
      label: "انتهاء صلاحية الدروس",
      icon: FiClock,
      description: "إدارة ومراقبة انتهاء صلاحية الدروس",
    },
    {
      id: "audit-logs",
      label: "سجل الأحداث",
      icon: FiClock,
      description: "عرض سجل إجراءات المسؤولين",
    },
    {
      id: "ai-chat",
      label: "المساعد الذكي",
      icon: FiMessageCircle,
      description: "تحدث مع المساعد الذكي",
    },
    {
      id: "staff",
      label: "فريق الإدارة",
      icon: FiShield,
      description: "الأعضاء والصلاحيات",
    },
    {
      id: "settings-security",
      label: "الإعدادات والأمان",
      icon: FiSettings,
      description: "قواعد المنصة وحالة الأمان",
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 cursor-pointer right-4 z-50 p-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all duration-150"
      >
        {isMobileMenuOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <FiMenu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 cursor-pointer bg-black/20 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-64 bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/50 z-40 transition- duration-150 ease-in-out flex flex-col   ${isMobileMenuOpen
 ? "translate-x-0"
 : "translate-x-full md:translate-x-0"
 }`}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200/50 bg-brand-500 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

          <div
            className={`relative flex items-center gap-4   ${isMobileMenuOpen ? "mr-14" : ""}`}
          >
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <FiSettings className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-base font-bold">لوحة الإدارة</h1>
              <p className="text-brand-100 text-xs">مرحباً {user?.fullname}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0">
          <ul className="space-y-0.5">
            {menuItems.filter((item) => canOpen(user, item.id)).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false); // Close mobile menu when item is selected
                    }}
                    title={item.description}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${isActive
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                    <span className="truncate text-right flex-1">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200/50 bg-gray-50">
          <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg mb-2 border border-slate-200">
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
              <FiUser className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-right">
              <div className="text-sm font-bold text-gray-900">
                {user?.fullname || user?.username}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                {roleLabel(user)}
              </div>
              <div className="text-xs text-gray-400 mt-1">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 group cursor-pointer border border-slate-200 hover:border-red-200"
          >
            <FiLogOut className="w-5 h-5 group-hover:transform transition-transform" />
            <span className="font-semibold">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
