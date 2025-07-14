"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "../../../models/UserContext";
import { toast } from "react-toastify";
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

const InstructorDashboard = () => {
  const router = useRouter();
  const { user, loading } = useUserData();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check if user is instructor
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // if (user.role !== 'INSTRUCTOR') {
    //   toast.error('غير مصرح لك بالوصول لهذه الصفحة');
    //   router.push('/');
    //   return;
    // }
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
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="bold-32 text-gray-900 mb-8">المساعد الذكي</h1>
              <div
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                style={{ height: "600px" }}
              >
                <AIChat isOpen={true} onClose={() => {}} className="h-full" />
              </div>
            </div>
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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <InstructorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 lg:mr-80 mr-0">
        <div className="pt-16 lg:pt-0">{renderContent()}</div>
      </div>
    </div>
  );
};

// Placeholder components for students and analytics
const InstructorStudentsView = () => (
  <div className="p-8">
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
      <h2 className="bold-24 text-gray-900 mb-4">عرض الطلاب</h2>
      <p className="regular-16 text-gray-600 mb-6">
        هذه الميزة قيد التطوير. ستتمكن قريباً من عرض قائمة طلابك ومتابعة تقدمهم.
      </p>
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="bold-18 text-gray-900 mb-2">الميزات القادمة:</h3>
        <ul className="text-right space-y-2 regular-14 text-gray-600">
          <li>• عرض قائمة الطلاب المسجلين في كورساتك</li>
          <li>• متابعة تقدم الطلاب في الدروس</li>
          <li>• إحصائيات أداء الطلاب</li>
          <li>• التواصل مع الطلاب</li>
        </ul>
      </div>
    </div>
  </div>
);

const InstructorAnalytics = () => (
  <div className="p-8">
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
      <h2 className="bold-24 text-gray-900 mb-4">التحليلات والإحصائيات</h2>
      <p className="regular-16 text-gray-600 mb-6">
        هذه الميزة قيد التطوير. ستتمكن قريباً من عرض تحليلات مفصلة لأداء
        كورساتك.
      </p>
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="bold-18 text-gray-900 mb-2">التحليلات القادمة:</h3>
        <ul className="text-right space-y-2 regular-14 text-gray-600">
          <li>• إحصائيات المبيعات والإيرادات</li>
          <li>• معدلات إكمال الدروس</li>
          <li>• تقييمات الطلاب</li>
          <li>• نمو عدد الطلاب</li>
          <li>• أداء الكورسات المختلفة</li>
        </ul>
      </div>
    </div>
  </div>
);

export default InstructorDashboard;
