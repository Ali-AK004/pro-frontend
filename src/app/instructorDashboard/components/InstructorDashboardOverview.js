'use client';

import React, { useState, useEffect } from 'react';
import { instructorAPI, handleAPIError } from '../services/instructorAPI';
import { useUserData } from '../../../../models/UserContext';
import { toast } from 'react-toastify';
import { FaArrowLeftLong } from "react-icons/fa6";
import 'react-toastify/dist/ReactToastify.css';
import {
  FiBook,
  FiFileText,
  FiUsers,
  FiCode,
} from 'react-icons/fi';
import Link from 'next/link';
import { getInstructorId } from '../../utils/roleHelpers';

const InstructorDashboardOverview = ({ setActiveTab }) => {
  const { user } = useUserData();
  const [stats, setStats] = useState({});
  const [recentCourses, setRecentCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const instructorId = getInstructorId(user);

  useEffect(() => {
    if (instructorId) {
      fetchDashboardData();
    }
  }, [instructorId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard stats using the appropriate instructor ID
      const dashboardStats = await instructorAPI.analytics.getDashboardStats(instructorId);
      setStats(dashboardStats);

      // Fetch recent courses
      const coursesResponse = await instructorAPI.courses.getByInstructor(instructorId);
      const courses = coursesResponse.data || [];
      setRecentCourses(courses.slice(0, 5));

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
    },
    {
      title: 'إجمالي الدروس',
      value: stats.lessons,
      icon: FiFileText,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'إجمالي الطلاب',
      value: stats.students,
      icon: FiUsers,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
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
      <div className="mb-8 flexBetween flex flex-col-reverse gap-6 md:gap-0 md:flex-row">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">
            مرحباً، {user?.fullname}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'INSTRUCTOR' 
              ? 'إليك نظرة عامة على أنشطتك التعليمية' 
              : `مساعد للمدرس ${user?.instructorName} - إليك نظرة عامة على الأنشطة`
            }
          </p>
        </div>
        <Link href={'/'} className="flex items-center border rounded-md px-5 py-1 gap-3 border-secondary text-secondary hover:text-white hover:bg-[#87ceeb] transition duration-300">
          <FaArrowLeftLong /> العودة للرئيسية
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-3 md:gap-0 items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <div className={`text-sm font-medium ${
                  card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </div>
                <div className="text-right">
                  <h3 className="regular-14 text-gray-600 mb-1">{card.title}</h3>
                  <p className="bold-24 text-gray-900 text-center">({card.value})</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Courses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="bold-20 text-gray-900">كورساتك الأخيرة</h3>
          </div>
          <div className="space-y-4 ">
            {recentCourses.length === 0 ? (
              <div className="text-center  py-8">
                <FiBook className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="regular-14 text-gray-600 mb-4">لم تقم بإنشاء أي كورسات بعد</p>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="cursor-pointer bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
                >
                  إنشاء أول كورس
                </button>
              </div>
            ) : (
              recentCourses.map((course) => (
                <div key={course.id} className="flex flex-col md:flex-row md:items-start items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flexCenter">
                    <FiBook className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="bold-16 text-gray-900">{course.name}</p>
                    <p className="regular-14 text-gray-500">{course.description}</p>
                  </div>
                  <p className="regular-12 text-gray-500">{course.lessonCount || 0} درس</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="bold-20 text-gray-900 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('courses')}
            className="cursor-pointer p-4 bg-secondary bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group"
          >
            <FiBook className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-white">إنشاء كورس</p>
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className="cursor-pointer p-4 bg-green-500 bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group"
          >
            <FiFileText className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-white">إضافة درس</p>
          </button>
          <button
            onClick={() => setActiveTab('access-codes')}
            className="cursor-pointer p-4 bg-purple-500 bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all duration-300 text-center group"
          >
            <FiCode className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="regular-14 text-white">إنشاء كود</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardOverview;
