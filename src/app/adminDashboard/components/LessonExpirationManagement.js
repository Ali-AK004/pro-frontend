import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiClock,
  FiRefreshCw,
  FiBarChart3,
  FiUserX,
  FiPlus,
  FiCheck,
  FiAlertTriangle,
  FiCalendar,
  FiUser,
  FiBook,
} from "react-icons/fi";

const LessonExpirationManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [daysFilter, setDaysFilter] = useState(7);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [additionalDays, setAdditionalDays] = useState(7);
  const [studentId, setStudentId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [repurchaseCheck, setRepurchaseCheck] = useState(null);

  useEffect(() => {
    fetchStatistics();
    fetchExpiringSoon();
  }, [daysFilter]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response =
        await adminAPI.lessonExpiration.getExpirationStatistics();
      setStatistics(response.data);
    } catch (error) {
      toast.error(
        handleAPIError(error, "فشل في تحميل إحصائيات انتهاء الصلاحية")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpiringSoon = async () => {
    try {
      const response =
        await adminAPI.lessonExpiration.getLessonsExpiringSoon(daysFilter);
      console.log(response.data);
      setExpiringSoon(response.data || []);
    } catch (error) {
      toast.error(
        handleAPIError(error, "فشل في تحميل الدروس المنتهية الصلاحية قريباً")
      );
    }
  };

  const handleProcessExpired = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.lessonExpiration.processExpiredLessons();
      toast.success(
        response.data.message || "تم معالجة الدروس المنتهية الصلاحية بنجاح"
      );
      fetchStatistics();
      fetchExpiringSoon();
    } catch (error) {
      toast.error(
        handleAPIError(error, "فشل في معالجة الدروس المنتهية الصلاحية")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendAccess = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await adminAPI.lessonExpiration.extendLessonAccess(
        selectedStudent,
        selectedLesson,
        additionalDays
      );
      toast.success(response.data.message || "تم تمديد الوصول بنجاح");
      setShowExtendModal(false);
      fetchExpiringSoon();
      resetExtendForm();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تمديد الوصول"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStudentData = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await adminAPI.lessonExpiration.resetStudentLessonData(
        selectedStudent,
        selectedLesson
      );
      toast.success(
        response.data.message || "تم إعادة تعيين بيانات الطالب بنجاح"
      );
      setShowResetModal(false);
      fetchExpiringSoon();
      resetResetForm();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إعادة تعيين بيانات الطالب"));
    } finally {
      setIsLoading(false);
    }
  };

  const checkRepurchaseEligibility = async () => {
    if (!studentId || !lessonId) {
      toast.error("يرجى إدخال معرف الطالب ومعرف الدرس");
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminAPI.lessonExpiration.canRepurchaseLesson(
        studentId,
        lessonId
      );
      setRepurchaseCheck(response.data);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في فحص أهلية إعادة الشراء"));
    } finally {
      setIsLoading(false);
    }
  };

  const resetExtendForm = () => {
    setSelectedStudent("");
    setSelectedLesson("");
    setAdditionalDays(7);
  };

  const resetResetForm = () => {
    setSelectedStudent("");
    setSelectedLesson("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">
            إدارة انتهاء صلاحية الدروس
          </h1>
          <p className="regular-16 text-gray-600">
            إدارة ومراقبة انتهاء صلاحية الدروس وتمديد الوصول
          </p>
        </div>
        <button
          onClick={handleProcessExpired}
          disabled={isLoading}
          className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
        >
          <FiRefreshCw
            className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
          />
          معالجة الدروس المنتهية
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="regular-14 text-gray-600 mb-1">
                  إجمالي الدروس المنتهية
                </p>
                <p className="bold-24 text-red-600">
                  {statistics.totalExpired || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FiClock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="regular-14 text-gray-600 mb-1">
                  تنتهي خلال 7 أيام
                </p>
                <p className="bold-24 text-orange-600">
                  {statistics.expiringSoon || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiAlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="regular-14 text-gray-600 mb-1">الدروس النشطة</p>
                <p className="bold-24 text-green-600">
                  {statistics.activeLessons || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="regular-14 text-gray-600 mb-1">
                  إجمالي الطلاب المتأثرين
                </p>
                <p className="bold-24 text-blue-600">
                  {statistics.affectedStudents || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUser className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setShowExtendModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg bold-16 hover:bg-blue-700 transition-all duration-300 flexCenter gap-2"
        >
          <FiPlus className="w-5 h-5" />
          تمديد الوصول
        </button>
        <button
          onClick={() => setShowResetModal(true)}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg bold-16 hover:bg-orange-700 transition-all duration-300 flexCenter gap-2"
        >
          <FiUserX className="w-5 h-5" />
          إعادة تعيين بيانات الطالب
        </button>
      </div>

      {/* Days Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="bold-18 text-gray-900 mb-4">
          فلترة الدروس المنتهية قريباً
        </h3>
        <div className="flex items-center gap-4">
          <label className="regular-16 text-gray-700">
            عرض الدروس التي تنتهي خلال:
          </label>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value={1}>يوم واحد</option>
            <option value={3}>3 أيام</option>
            <option value={7}>7 أيام</option>
            <option value={14}>14 يوم</option>
            <option value={30}>30 يوم</option>
          </select>
        </div>
      </div>

      {/* Expiring Soon Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="bold-18 text-gray-900">
            الدروس المنتهية الصلاحية قريباً
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right regular-14 font-medium text-gray-900">
                  معرف الطالب
                </th>
                <th className="px-6 py-4 text-right regular-14 font-medium text-gray-900">
                  معرف الدرس
                </th>
                <th className="px-6 py-4 text-right regular-14 font-medium text-gray-900">
                  اسم الدرس
                </th>
                <th className="px-6 py-4 text-right regular-14 font-medium text-gray-900">
                  تاريخ انتهاء الصلاحية
                </th>
                <th className="px-6 py-4 text-right regular-14 font-medium text-gray-900">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expiringSoon.length > 0 ? (
                expiringSoon.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 regular-14 text-gray-900">
                      {item[0] || "غير محدد"}
                    </td>
                    <td className="px-6 py-4 regular-14 text-gray-900">
                      {item[1] || "غير محدد"}
                    </td>
                    <td className="px-6 py-4 regular-14 text-gray-900">
                      {item[2] || "غير محدد"}
                    </td>
                    <td className="px-6 py-4 regular-14 text-gray-900">
                      {formatDate(item[3])}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ينتهي قريباً
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center regular-16 text-gray-500"
                  >
                    لا توجد دروس تنتهي صلاحيتها قريباً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repurchase Check Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="bold-18 text-gray-900 mb-4">فحص أهلية إعادة الشراء</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block regular-14 text-gray-700 mb-2">
              معرف الطالب
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="أدخل معرف الطالب"
            />
          </div>
          <div>
            <label className="block regular-14 text-gray-700 mb-2">
              معرف الدرس
            </label>
            <input
              type="text"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="أدخل معرف الدرس"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={checkRepurchaseEligibility}
              disabled={isLoading || !studentId || !lessonId}
              className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg bold-16 hover:bg-purple-700 transition-all duration-300 disabled:opacity-50"
            >
              فحص الأهلية
            </button>
          </div>
        </div>

        {repurchaseCheck && (
          <div
            className={`p-4 rounded-lg ${repurchaseCheck.canRepurchase ? "bg-green-100 border border-green-200" : "bg-red-100 border border-red-200"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {repurchaseCheck.canRepurchase ? (
                <FiCheck className="w-5 h-5 text-green-600" />
              ) : (
                <FiAlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span
                className={`bold-16 ${repurchaseCheck.canRepurchase ? "text-green-800" : "text-red-800"}`}
              >
                {repurchaseCheck.canRepurchase
                  ? "يمكن إعادة الشراء"
                  : "لا يمكن إعادة الشراء"}
              </span>
            </div>
            <p
              className={`regular-14 ${repurchaseCheck.canRepurchase ? "text-green-700" : "text-red-700"}`}
            >
              الطالب: {repurchaseCheck.studentId} | الدرس:{" "}
              {repurchaseCheck.lessonId}
            </p>
          </div>
        )}
      </div>

      {/* Extend Access Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="bold-18 text-gray-900">تمديد الوصول للدرس</h3>
            </div>
            <form onSubmit={handleExtendAccess} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block regular-14 text-gray-700 mb-2">
                    معرف الطالب
                  </label>
                  <input
                    type="text"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="أدخل معرف الطالب"
                    required
                  />
                </div>
                <div>
                  <label className="block regular-14 text-gray-700 mb-2">
                    معرف الدرس
                  </label>
                  <input
                    type="text"
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="أدخل معرف الدرس"
                    required
                  />
                </div>
                <div>
                  <label className="block regular-14 text-gray-700 mb-2">
                    عدد الأيام الإضافية
                  </label>
                  <input
                    type="number"
                    value={additionalDays}
                    onChange={(e) =>
                      setAdditionalDays(parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    min="1"
                    max="365"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent text-white py-2 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  تمديد الوصول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExtendModal(false);
                    resetExtendForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg bold-16 hover:bg-gray-400 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Student Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="bold-18 text-gray-900">
                إعادة تعيين بيانات الطالب
              </h3>
            </div>
            <form onSubmit={handleResetStudentData} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block regular-14 text-gray-700 mb-2">
                    معرف الطالب
                  </label>
                  <input
                    type="text"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="أدخل معرف الطالب"
                    required
                  />
                </div>
                <div>
                  <label className="block regular-14 text-gray-700 mb-2">
                    معرف الدرس
                  </label>
                  <input
                    type="text"
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="أدخل معرف الدرس"
                    required
                  />
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FiAlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="bold-14 text-red-800">تحذير</span>
                  </div>
                  <p className="regular-12 text-red-700">
                    سيؤدي هذا الإجراء إلى حذف جميع بيانات الطالب المتعلقة بهذا
                    الدرس نهائياً.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg bold-16 hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
                >
                  إعادة تعيين البيانات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    resetResetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg bold-16 hover:bg-gray-400 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonExpirationManagement;
