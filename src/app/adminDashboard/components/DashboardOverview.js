import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiBook,
  FiFileText,
  FiCode,
  FiActivity,
} from "react-icons/fi";
import Link from "next/link";
import { FaArrowLeftLong } from "react-icons/fa6";

const DashboardOverview = ({ setActiveTab }) => {
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
    },
    {
      title: "إجمالي المدرسين",
      value: stats.instructors,
      icon: FiActivity,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "إجمالي الكورسات",
      value: stats.courses,
      icon: FiBook,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "إجمالي الدروس",
      value: stats.lessons,
      icon: FiFileText,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
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
              <div
                key={i}
                className="bg-gradient-to-r from-gray-200 to-gray-300 h-32 rounded-2xl"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-64 rounded-2xl"></div>
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-64 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
            <FiActivity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-600">نظرة عامة على أداء المنصة التعليمية</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1 relative overflow-hidden group"
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50 group-hover:from-blue-50/50 group-hover:to-purple-50/50 transition-all duration-300"></div>

              <div className="relative flex items-center justify-between">
                <div
                  className={`p-4 rounded-2xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-7 h-7 ${card.textColor}`} />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity */}
      <div className="bg-white p-6 rounded-xl shadow-sm text-center md:text-right border border-gray-100">
        <h3 className="bold-20 text-gray-900 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
