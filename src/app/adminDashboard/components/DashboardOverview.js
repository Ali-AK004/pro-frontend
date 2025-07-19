import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiBook,
  FiFileText,
  FiCode,
  FiTrendingUp,
  FiActivity,
  FiDollarSign,
  FiEye,
} from "react-icons/fi";

const DashboardOverview = ({setActiveTab}) => {
  const [stats, setStats] = useState({
    students: 0,
    instructors: 0,
    courses: 0,
    lessons: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch dashboard stats
      const dashboardStats = await adminAPI.analytics.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل بيانات لوحة التحكم"));
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "إجمالي الطلاب",
      value: stats.students,
      icon: FiUsers,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      changeType: "increase",
    },
    {
      title: "إجمالي المدرسين",
      value: stats.instructors,
      icon: FiActivity,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      changeType: "increase",
    },
    {
      title: "إجمالي الكورسات",
      value: stats.courses,
      icon: FiBook,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      changeType: "increase",
    },
    {
      title: "إجمالي الدروس",
      value: stats.lessons,
      icon: FiFileText,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      changeType: "increase",
    },
  ];

  const navigateToTab = (tabId) => {
    setActiveTab(tabId);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-64 rounded-xl"></div>
            <div className="bg-gray-200 h-64 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="bold-32 text-gray-900 mb-2">لوحة التحكم</h1>
        <p className="regular-16 text-gray-600">
          نظرة عامة على أداء المنصة التعليمية
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <div
                  className={`text-sm font-medium ${
                    card.changeType === "increase"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {card.change}
                </div>
              </div>
              <div className="text-right">
                <h3 className="regular-14 text-gray-600 mb-1">{card.title}</h3>
                <p className="bold-24 text-gray-900">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="bold-20 text-gray-900 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigateToTab("users")}
            className="p-4 bg-accent cursor-pointer bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group"
          >
            <FiUsers className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-white">إضافة مدرس</p>
          </button>
          <button
            onClick={() => navigateToTab("courses")}
            className="p-4 bg-secondary cursor-pointer bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group"
          >
            <FiBook className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-white">إنشاء كورس</p>
          </button>
          <button
            onClick={() => navigateToTab("lessons")}
            className="p-4 bg-green-500 cursor-pointer bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group"
          >
            <FiFileText className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-white">إضافة درس</p>
          </button>
          <button
            onClick={() => navigateToTab("access-codes")}
            className="p-4 bg-purple-500 cursor-pointer bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group"
          >
            <FiCode className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-white">إنشاء كود</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
