"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "../../../models/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import components
import AdminSidebar from "./components/AdminSidebar";
import { canOpen } from "./permissions";
import dynamic from "next/dynamic";

// Each tab is its own chunk, downloaded the first time it is opened
const TabLoading = () => (
  <div className="p-6 space-y-3">
    <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
    <div className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse" />
  </div>
);
const lazyTab = (load) => dynamic(load, { loading: TabLoading });
const DashboardOverview = lazyTab(() => import("./components/DashboardOverview"));
const UserManagement = lazyTab(() => import("./components/UserManagement"));
const CourseManagement = lazyTab(() => import("./components/CourseManagement"));
const LessonManagement = lazyTab(() => import("./components/LessonManagement"));
const ExamManagement = lazyTab(() => import("./components/ExamManagement"));
const AssignmentManagement = lazyTab(() => import("./components/AssignmentManagement"));
const AccessCodeManagement = lazyTab(() => import("./components/AccessCodeManagement"));
const LessonExpirationManagement = lazyTab(() => import("./components/LessonExpirationManagement"));
const AIChat = lazyTab(() => import("../components/AIChat"));
const AdminStudentLessonsPage = lazyTab(() => import("./components/AdminStudentLessonsPage"));
const AuditLogsPage = lazyTab(() => import("./components/AuditLogsPage"));
const WalletManagement = lazyTab(() => import("./components/WalletManagement"));
const BundleCouponPage = lazyTab(() => import("./components/BundleCouponPage"));
const AdminEarningsPage = lazyTab(() => import("./components/AdminEarningsPage"));
const AnalyticsPage = lazyTab(() => import("./components/AnalyticsPage"));
const PaymentsCenterPage = lazyTab(() => import("./components/PaymentsCenterPage"));
const StaffPage = lazyTab(() => import("./components/StaffPage"));

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
    if (!canOpen(user, activeTab)) {
      return (
        <div className="py-24 text-center" dir="rtl">
          <p className="text-lg font-semibold text-slate-800">هذه الصفحة غير متاحة لحسابك</p>
          <p className="mt-2 text-sm text-slate-500">اطلب الصلاحية من المدير العام.</p>
        </div>
      );
    }
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
      case "staff":
        return <StaffPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl"></div>

      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 md:mr-64 mr-0 relative">
        <div className="pt-16 md:pt-0">
          <div className="px-4 mx-auto">{renderContent()}</div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
