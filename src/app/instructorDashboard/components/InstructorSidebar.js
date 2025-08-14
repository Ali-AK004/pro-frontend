import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "../../../../models/UserContext";
import axios from "axios";
import {
  FiHome,
  FiBook,
  FiFileText,
  FiCode,
  FiLogOut,
  FiUser,
  FiBarChart,
  FiUsers,
  FiEdit,
  FiMenu,
  FiX,
  FiHelpCircle,
  FiClipboard,
  FiMessageCircle,
} from "react-icons/fi";
import apiConfig, { API_ENDPOINTS } from "@/config/api";
import { toast } from "react-toastify";

const InstructorSidebar = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, clearUser } = useUserData();

  const handleLogout = async () => {
    try {
      // Clear frontend state immediately
      clearUser();

      // Make logout request (don't wait for response)
      axios
        .post(
          `${apiConfig.baseURL}${API_ENDPOINTS.AUTH.LOGOUT}`,
          {},
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        )
        .catch(() => {}); // Ignore any errors
      closeMenus();

      // Redirect to home page
      router.replace("/");
      window.location.href = "/";
    } catch (error) {
      toast.error("خطأ في تسجيل الخروج");
      router.replace("/");
      window.location.href = "/";
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: FiHome,
      description: "نظرة عامة على أدائك",
    },
    {
      id: "courses",
      label: "إدارة الكورسات",
      icon: FiBook,
      description: "كورساتك ومحتواها",
    },
    {
      id: "lessons",
      label: "إدارة الدروس",
      icon: FiFileText,
      description: "دروسك ومحتواها",
    },
    {
      id: "exams",
      label: "إدارة الامتحانات",
      icon: FiHelpCircle,
      description: "امتحانات دروسك",
    },
    {
      id: "assignments",
      label: "إدارة الواجبات",
      icon: FiClipboard,
      description: "واجبات دروسك",
    },
    {
      id: "access-codes",
      label: "أكواد الوصول",
      icon: FiCode,
      description: "إنشاء وإدارة أكواد الوصول",
    },
    {
      id: "ai-chat",
      label: "المساعد الذكي",
      icon: FiMessageCircle,
      description: "تحدث مع المساعد الذكي",
    },
    {
      id: "profile",
      label: "الملف الشخصي",
      icon: FiEdit,
      description: "تحديث معلوماتك الشخصية",
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 cursor-pointer right-4 z-50 p-3 bg-secondary text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-300"
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
          className="lg:hidden fixed inset-0 cursor-pointer bg-black/20 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-80 lg:w-80 sm:w-72 bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/50 z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-green-500 to-emerald-600 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

          <div
            className={`relative flex items-center gap-4 ${isMobileMenuOpen ? "mr-14" : ""}`}
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FiUser className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">لوحة المدرس</h1>
              <p className="text-green-100 text-sm">مرحباً {user?.fullname}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`cursor-pointer w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl transform scale-[1.02]"
                        : "hover:bg-white/80 hover:shadow-lg text-gray-700 hover:text-green-600"
                    }`}
                  >
                    {/* Background decoration for active state */}
                    {isActive && (
                      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                    )}

                    <div
                      className={`relative p-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-white/20 backdrop-blur-sm"
                          : "bg-gray-100 group-hover:bg-green-50 group-hover:scale-110"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-gray-600 group-hover:text-green-600"
                        }`}
                      />
                    </div>

                    <div className="text-right flex-1 relative">
                      <div
                        className={`text-base font-semibold transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-gray-900 group-hover:text-green-600"
                        }`}
                      >
                        {item.label}
                      </div>
                      <div
                        className={`text-sm transition-colors ${
                          isActive
                            ? "text-white/80"
                            : "text-gray-500 group-hover:text-green-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>

                    {/* Hover effect */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-2xl mb-4 shadow-sm border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <FiUser className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-right min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">
                {user?.fullname || user?.username}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                مدرس
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="cursor-pointer w-full flex items-center justify-center gap-3 p-4 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-2xl transition-all duration-300 group border-2 border-red-200 hover:border-red-500 shadow-sm hover:shadow-lg"
          >
            <FiLogOut className="w-5 h-5 group-hover:transform group-hover:translate-x-1 transition-transform" />
            <span className="font-semibold">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default InstructorSidebar;
