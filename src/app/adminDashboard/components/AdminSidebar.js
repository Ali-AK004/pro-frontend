import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "../../../../models/UserContext";
import {
  FiHome,
  FiUsers,
  FiBook,
  FiFileText,
  FiCode,
  FiLogOut,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiClipboard,
  FiMessageCircle,
  FiMenu,
  FiX,
} from "react-icons/fi";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, clearUser } = useUserData();

  const handleLogout = async () => {
    try {
      clearUser();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
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
      id: "ai-chat",
      label: "المساعد الذكي",
      icon: FiMessageCircle,
      description: "تحدث مع المساعد الذكي",
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 cursor-pointer right-4 z-50 p-3 bg-accent text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-300"
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
        className={`fixed inset-y-0 right-0 w-80 lg:w-80 sm:w-72 bg-white shadow-2xl border-l border-gray-200 z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-accent to-secondary">
          <div
            className={`flex items-center gap-3 ${isMobileMenuOpen ? "mr-14" : ""}`}
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-full flexCenter">
              <FiSettings className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
            </div>
            <div className="text-gray-600">
              <h1 className="bold-16 lg:bold-20">لوحة التحكم</h1>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden mr-auto p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 lg:p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1 lg:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false); // Close mobile menu when item is selected
                    }}
                    className={`w-full flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl transition-all duration-300 group cursor-pointer ${
                      isActive
                        ? "bg-secondary text-white shadow-lg transform scale-[1.02]"
                        : "hover:bg-gray-200 text-gray-700 hover:text-[#87ceeb]"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? "bg-white bg-opacity-20"
                          : "bg-gray-100 group-hover:bg-gray-50 group-hover:bg-opacity-10"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 lg:w-5 lg:h-5 ${
                          isActive ? "text-gray-600" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="text-right flex-1">
                      <div
                        className={`bold-14 lg:bold-16 ${
                          isActive ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.label}
                      </div>
                      <div
                        className={`regular-11 lg:regular-12 ${
                          isActive
                            ? "text-white text-opacity-80"
                            : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 lg:p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-white rounded-lg mb-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-accent rounded-full flexCenter">
              <FiUser className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="flex-1 text-right">
              <div className="bold-12 lg:bold-14 text-gray-900">
                {user?.fullname || user?.username}
              </div>
              <div className="regular-10 lg:regular-12 text-gray-500">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 lg:p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 group cursor-pointer"
          >
            <FiLogOut className="w-3 h-3 lg:w-4 lg:h-4 group-hover:transform group-hover:translate-x-1 transition-transform" />
            <span className="bold-12 lg:bold-14">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
