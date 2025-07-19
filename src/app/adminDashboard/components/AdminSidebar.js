import React from "react";
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
  FiBarChart,
  FiHelpCircle,
  FiClipboard,
  FiMessageCircle,
} from "react-icons/fi";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
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
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-40">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-accent to-secondary">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flexCenter">
            <FiSettings className="w-6 h-6 text-accent" />
          </div>
          <div className="text-white">
            <h1 className="bold-20">لوحة التحكم</h1>
            <p className="regular-14 opacity-90">
              مرحباً، {user?.fullname || user?.username}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? "bg-accent text-white shadow-lg transform scale-[1.02]"
                      : "hover:bg-gray-50 text-gray-700 hover:text-accent"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isActive
                        ? "bg-white bg-opacity-20"
                        : "bg-gray-100 group-hover:bg-accent group-hover:bg-opacity-10"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-white"
                          : "text-gray-600 group-hover:text-accent"
                      }`}
                    />
                  </div>
                  <div className="text-right flex-1">
                    <div
                      className={`bold-16 ${
                        isActive ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`regular-12 ${
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
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg mb-3">
          <div className="w-10 h-10 bg-accent rounded-full flexCenter">
            <FiUser className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-right">
            <div className="bold-14 text-gray-900">
              {user?.fullname || user?.username}
            </div>
            <div className="regular-12 text-gray-500">{user?.email}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 group"
        >
          <FiLogOut className="w-4 h-4 group-hover:transform group-hover:translate-x-1 transition-transform" />
          <span className="bold-14">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
