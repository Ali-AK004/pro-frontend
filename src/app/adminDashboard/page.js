"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "../../../models/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import components
import AdminSidebar from "./components/AdminSidebar";
import DashboardOverview from "./components/DashboardOverview";
import UserManagement from "./components/UserManagement";
import CourseManagement from "./components/CourseManagement";
import LessonManagement from "./components/LessonManagement";
import ExamManagement from "./components/ExamManagement";
import AssignmentManagement from "./components/AssignmentManagement";
import AccessCodeManagement from "./components/AccessCodeManagement";
import LessonExpirationManagement from "./components/LessonExpirationManagement";
import AIChat from "../components/AIChat";
import PerformanceMonitor from "../components/PerformanceMonitor";
import AdminStudentLessonsPage from "./components/AdminStudentLessonsPage";
import AuditLogsPage from "./components/AuditLogsPage";
import WalletManagement from "./components/WalletManagement";
import BundleCouponPage from "./components/BundleCouponPage";
import AdminEarningsPage from "./components/AdminEarningsPage";
import AnalyticsPage from "./components/AnalyticsPage";
import PaymentsCenterPage from "./components/PaymentsCenterPage";

const AdminDashboard = () => {
  const router = useRouter();
  const { user, loading } = useUserData();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check if user is admin
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      toast.error("غير مصرح لك بالوصول لهذه الصفحة");
      router.push("/");
      return;
    }
  }, [user, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flexCenter">
        <div className="flexCenter flex-col">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 regular-16 text-gray-600">
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      </div>
    );
  }

  // Render main content
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview setActiveTab={setActiveTab} />;
      case "users":
        return <UserManagement />;
      case "courses":
        return <CourseManagement />;
      case "lessons":
        return <LessonManagement />;
      case "exams":
        return <ExamManagement />;
      case "assignments":
        return <AssignmentManagement />;
      case "ai-chat":
        return (
          <div
            className="p-4 shadow-sm overflow-hidden"
            style={{ height: "100vh" }}
          >
            <AIChat isOpen={true} onClose={() => { }} />
          </div>
        );
      case "access-codes":
        return <AccessCodeManagement />;
      case "wallet":
        return <WalletManagement />;
      case "bundles":
        return <BundleCouponPage />;
      case "earnings":
        return <AdminEarningsPage />;
      case "student-lessons":
        return <AdminStudentLessonsPage />;
      case "lesson-expiration":
        return <LessonExpirationManagement />;
      case "audit-logs":
        return <AuditLogsPage />;
      case "analytics":
        return <AnalyticsPage onNavigate={setActiveTab} />;
      case "payments":
        return <PaymentsCenterPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-brand-50/30 to-brand-50/30 flex relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl"></div>

      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 md:mr-80 mr-0 relative">
        <div className="pt-16 md:pt-0">
          <div className="px-4 mx-auto">{renderContent()}</div>
        </div>
      </div>

      {/* Performance Monitor - Only in Admin Dashboard */}
      <PerformanceMonitor />
    </div>
  );
};

export default AdminDashboard;
