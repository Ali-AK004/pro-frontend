import React, { useState, useEffect } from 'react';
import { instructorAPI, handleAPIError } from '../services/instructorAPI';
import { useUserData } from '../../../../models/UserContext';
import { toast } from 'react-toastify';
import {
  FiBook,
  FiFileText,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiEye,
  FiPlus,
  FiCode,
} from 'react-icons/fi';

const InstructorDashboardOverview = () => {
  const { user } = useUserData();
  const [stats, setStats] = useState({
    courses: 0,
    lessons: 0,
    students: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard stats
      const dashboardStats = await instructorAPI.analytics.getDashboardStats(user.id);
      setStats(dashboardStats);

      // Fetch recent courses
      const coursesResponse = await instructorAPI.courses.getByInstructor(user.id);
      const courses = coursesResponse.data || [];
      setRecentCourses(courses.slice(0, 5));

      // Mock recent activity for now
      setRecentActivity([
        {
          id: 1,
          type: 'student_enrolled',
          message: 'طالب جديد انضم لكورس البرمجة',
          time: '5 دقائق مضت',
          icon: FiUsers,
          color: 'text-green-600'
        },
        {
          id: 2,
          type: 'lesson_completed',
          message: 'تم إكمال درس جديد بواسطة طالب',
          time: '15 دقيقة مضت',
          icon: FiFileText,
          color: 'text-blue-600'
        },
        {
          id: 3,
          type: 'code_generated',
          message: 'تم إنشاء أكواد وصول جديدة',
          time: '30 دقيقة مضت',
          icon: FiCode,
          color: 'text-purple-600'
        },
      ]);

    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل بيانات لوحة التحكم'));
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'إجمالي الكورسات',
      value: stats.courses,
      icon: FiBook,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'إجمالي الدروس',
      value: stats.lessons,
      icon: FiFileText,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'إجمالي الطلاب',
      value: stats.students,
      icon: FiUsers,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.revenue} جنيه`,
      icon: FiDollarSign,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      change: '+20%',
      changeType: 'increase'
    },
  ];

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
        <h1 className="bold-32 text-gray-900 mb-2">مرحباً، {user?.fullname || user?.username}</h1>
        <p className="regular-16 text-gray-600">نظرة عامة على أداء كورساتك ودروسك</p>
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
                <div className={`text-sm font-medium ${
                  card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </div>
              </div>
              <div className="text-right">
                <h3 className="regular-14 text-gray-600 mb-1">{card.title}</h3>
                <p className="bold-24 text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="bold-20 text-gray-900 mb-4">النشاط الأخير</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-lg bg-gray-100`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="regular-14 text-gray-900">{activity.message}</p>
                    <p className="regular-12 text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Courses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="bold-20 text-gray-900">كورساتك الأخيرة</h3>
            <button className="text-secondary hover:text-opacity-80 transition-colors">
              <FiEye className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {recentCourses.length === 0 ? (
              <div className="text-center py-8">
                <FiBook className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="regular-14 text-gray-600 mb-4">لم تقم بإنشاء أي كورسات بعد</p>
                <button className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300">
                  إنشاء أول كورس
                </button>
              </div>
            ) : (
              recentCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flexCenter">
                    <FiBook className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="bold-14 text-gray-900">{course.name}</p>
                    <p className="regular-12 text-gray-500">{course.lessonCount || 0} درس</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="bold-20 text-gray-900 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-secondary bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group">
            <FiBook className="w-6 h-6 text-secondary mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-secondary">إنشاء كورس</p>
          </button>
          <button className="p-4 bg-green-500 bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group">
            <FiFileText className="w-6 h-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-green-600">إضافة درس</p>
          </button>
          <button className="p-4 bg-purple-500 bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group">
            <FiCode className="w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-purple-600">إنشاء كود</p>
          </button>
          <button className="p-4 bg-blue-500 bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group">
            <FiUsers className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-blue-600">عرض الطلاب</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardOverview;
