"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "../../../models/UserContext";
import "react-toastify/dist/ReactToastify.css";
// Import components
import InstructorSidebar from "./components/InstructorSidebar";
import InstructorDashboardOverview from "./components/InstructorDashboardOverview";
import InstructorCourseManagement from "./components/InstructorCourseManagement";
import InstructorLessonManagement from "./components/InstructorLessonManagement";
import InstructorExamManagement from "./components/InstructorExamManagement";
import InstructorAssignmentManagement from "./components/InstructorAssignmentManagement";
import InstructorAccessCodeManagement from "./components/InstructorAccessCodeManagement";
import InstructorProfileManagement from "./components/InstructorProfileManagement";
import AIChat from "../components/AIChat";
import { canAccessInstructorDashboard } from "../utils/roleHelpers";
import { toast } from "react-toastify";

const InstructorDashboard = () => {
  const router = useRouter();
  const { user, loading } = useUserData();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check if user can access instructor dashboard
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!canAccessInstructorDashboard(user)) {
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
        return <InstructorDashboardOverview setActiveTab={setActiveTab} />;
      case "courses":
        return <InstructorCourseManagement />;
      case "lessons":
        return <InstructorLessonManagement />;
      case "exams":
        return <InstructorExamManagement />;
      case "assignments":
        return <InstructorAssignmentManagement />;
      case "ai-chat":
        return (
          <div className="overflow-hidden p-4" style={{ height: "100vh" }}>
            <AIChat isOpen={true} onClose={() => {}} />
          </div>
        );
      case "access-codes":
        return <InstructorAccessCodeManagement />;
      case "students":
        return <InstructorStudentsView />;
      case "analytics":
        return <InstructorAnalytics />;
      case "profile":
        return <InstructorProfileManagement />;
      default:
        return <InstructorDashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30 flex relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-green-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl"></div>

      {/* Sidebar */}
      <InstructorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 lg:mr-80 mr-0 relative">
        <div className="pt-16 lg:pt-0">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};
export default InstructorDashboard;
