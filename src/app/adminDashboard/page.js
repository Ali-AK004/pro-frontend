'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '../../../models/UserContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import AdminSidebar from './components/AdminSidebar';
import DashboardOverview from './components/DashboardOverview';
import UserManagement from './components/UserManagement';
import CourseManagement from './components/CourseManagement';
import LessonManagement from './components/LessonManagement';
import AccessCodeManagement from './components/AccessCodeManagement';

const AdminDashboard = () => {
  const router = useRouter();
  const { user, loading } = useUserData();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if user is admin
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // if (user.role !== 'ADMIN') {
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
          <p className="mt-4 regular-16 text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // Render main content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UserManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'lessons':
        return <LessonManagement />;
      case 'access-codes':
        return <AccessCodeManagement />;
      case 'analytics':
        return <DashboardOverview />; // For now, use the same component
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 mr-80">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;