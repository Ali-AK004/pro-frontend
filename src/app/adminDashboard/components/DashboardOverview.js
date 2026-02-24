import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiBook,
  FiFileText,
  FiCode,
  FiActivity,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import LoadingSpinner from "../../components/LoadingSpinner";

const formatDate = (dateInput) => {
  if (!dateInput) return "";

  // إذا كان timestamp مصفوفة [year, month, day, hour, minute, second, nano]
  if (Array.isArray(dateInput)) {
    const [year, month, day, hour, minute, second] = dateInput;
    return new Date(year, month - 1, day, hour, minute, second).toLocaleString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // إذا كان رقم (milliseconds)
  return new Date(dateInput).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const DashboardOverview = ({ setActiveTab }) => {
  const [stats, setStats] = useState({
    students: 0,
    instructors: 0,
    assistants: 0,
    courses: 0,
    lessons: 0,
    exams: 0,
    assignments: 0,
    totalPaid: 0,
    totalPending: 0,
    totalFailed: 0,
    usedAccessCodes: 0,
    unusedAccessCodes: 0,
    recentLessonViews: [],
    recentExamSubmissions: [],
    recentAssignmentSubmissions: [],
    expiringSoon: []
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.dashboard.getStats();
      const data = response.data || {};
      setStats(prev => ({ ...prev, ...data }));

      // تجميع النشاط الحديث
      const activity = [
        ...(data.recentLessonViews || []).map(item => ({
          type: 'lesson',
          title: `مشاهدة درس: ${item.lessonName || 'غير معروف'}`,
          student: item.studentName || 'طالب مجهول',
          time: item.lastUpdated,
          icon: FiBook,
          color: 'blue'
        })),
        ...(data.recentExamSubmissions || []).map(item => ({
          type: 'exam',
          title: `تقديم امتحان: ${item.examTitle || 'غير معروف'}`,
          student: item.studentName || 'طالب مجهول',
          score: `${item.totalScore || 0}%`,
          time: item.submissionTime,
          icon: FiFileText,
          color: 'green'
        })),
        ...(data.recentAssignmentSubmissions || []).map(item => ({
          type: 'assignment',
          title: `تسليم واجب: ${item.assignment?.title || 'غير معروف'}`,
          student: item.student?.fullname || 'طالب مجهول',
          time: item.submissionDate,
          icon: FiCode,
          color: 'purple'
        })),
      ].sort((a, b) => {
        const timeA = Array.isArray(a.time) ? new Date(a.time[0], a.time[1] - 1, a.time[2], a.time[3], a.time[4], a.time[5]) : new Date(a.time);
        const timeB = Array.isArray(b.time) ? new Date(b.time[0], b.time[1] - 1, b.time[2], b.time[3], b.time[4], b.time[5]) : new Date(b.time);
        return timeB - timeA;
      }).slice(0, 10);

      setRecentActivity(activity);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل تحميل إحصائيات لوحة التحكم"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!stats) return <div className="p-8 text-center text-red-500 text-lg font-bold">خطأ في تحميل البيانات</div>;
  const paymentData = [
    { name: 'مدفوع', value: Number(stats.totalPaid) || 0 },
    { name: 'معلق', value: Number(stats.totalPending) || 0 },
    { name: 'فاشل', value: Number(stats.totalFailed) || 0 },
  ];

  const accessCodeData = [
    { name: 'مستخدم', value: stats.usedAccessCodes || 0 },
    { name: 'غير مستخدم', value: stats.unusedAccessCodes || 0 },
  ];

  // Color mapping helper to ensure Tailwind classes are correctly picked up
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", lightBg: "bg-blue-100" },
    green: { bg: "bg-green-50", text: "text-green-600", lightBg: "bg-green-100" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", lightBg: "bg-orange-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", lightBg: "bg-purple-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", lightBg: "bg-indigo-100" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", lightBg: "bg-pink-100" },
    teal: { bg: "bg-teal-50", text: "text-teal-600", lightBg: "bg-teal-100" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-600", lightBg: "bg-cyan-100" },
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
    const theme = colorMap[color] || colorMap.blue;
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-4 rounded-2xl ${theme.bg}`}>
            <Icon className={`w-8 h-8 ${theme.text}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex">
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الطلاب" value={stats.students} icon={FiUsers} color="blue" />
        <StatCard title="المدرسين" value={stats.instructors} icon={FiUsers} color="green" />
        <StatCard title="المساعدين" value={stats.assistants} icon={FiUsers} color="orange" />
        <StatCard title="إجمالي الإيرادات" value={`${Number(stats.totalPaid || 0).toLocaleString()} ج.م`} icon={FiDollarSign} color="teal" />
        <StatCard title="الكورسات" value={stats.courses} icon={FiBook} color="purple" />
        <StatCard title="الدروس" value={stats.lessons} icon={FiFileText} color="indigo" />
        <StatCard title="الامتحانات" value={stats.exams} icon={FiCheckCircle} color="pink" />
        <StatCard
          title="أكواد الوصول"
          value={`${stats.usedAccessCodes}/${stats.unusedAccessCodes + stats.usedAccessCodes}`}
          subtitle={`مستخدم: ${stats.usedAccessCodes} | متاح: ${stats.unusedAccessCodes}`}
          icon={FiCode}
          color="cyan"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiDollarSign className="text-green-600" />
            إحصائيات المدفوعات (المبالغ)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ج.م`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Access Codes Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiCode className="text-blue-600" />
            حالة أكواد الوصول
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={accessCodeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity & Expiring Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">آخر الأنشطة</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pl-2">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد أنشطة حديثة</p>
            ) : (
              recentActivity.map((act, idx) => {
                const theme = colorMap[act.color] || colorMap.blue;
                return (
                  <div key={idx} className="flex items-start gap-3 border-b border-gray-100 pb-3">
                    <div className={`p-2 rounded-full ${theme.lightBg}`}>
                      <act.icon className={`w-4 h-4 ${theme.text}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{act.title}</p>
                      <p className="text-xs text-gray-500">{act.student}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(act.time)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiClock className="text-orange-500" />
            الصلاحيات المنتهية قريباً (خلال 7 أيام)
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pl-2">
            {!stats.expiringSoon || stats.expiringSoon.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد صلاحيات على وشك الانتهاء</p>
            ) : (
              stats.expiringSoon.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <FiClock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.lessonName || 'درس غير معروف'}</p>
                    <p className="text-xs text-gray-500">{item.studentName || 'طالب مجهول'}</p>
                  </div>
                  <div className="text-xs text-red-500 font-semibold">
                    {formatDate(item.accessExpiryDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => setActiveTab('users')} className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center group">
            <FiUsers className="w-6 h-6 mx-auto mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-900">إدارة المستخدمين</span>
          </button>
          <button onClick={() => setActiveTab('courses')} className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center group">
            <FiBook className="w-6 h-6 mx-auto mb-2 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-900">إدارة الكورسات</span>
          </button>
          <button onClick={() => setActiveTab('exams')} className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center group">
            <FiFileText className="w-6 h-6 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-900">إدارة الامتحانات</span>
          </button>
          <button onClick={() => setActiveTab('access-codes')} className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center group">
            <FiCode className="w-6 h-6 mx-auto mb-2 text-orange-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-orange-900">إنشاء أكواد</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
