"use client";
import React, { useState } from "react";
import { adminAPI, handleAPIError } from "./adminDashboard/services/adminAPI";
import { toast } from "react-toastify";
import {
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaPlay,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const TestAdminAPI = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [studentsData, setStudentsData] = useState([]);
  const [instructorsData, setInstructorsData] = useState([]);
  const [assistantsData, setAssistantsData] = useState([]);

  const apiTests = [
    {
      id: "get-students",
      name: "جلب بيانات الطلاب",
      endpoint: "/api/admin/students",
      description: "اختبار جلب قائمة جميع الطلاب",
      method: "GET",
    },
    {
      id: "get-instructors",
      name: "جلب بيانات المدرسين",
      endpoint: "/api/admin/instructors",
      description: "اختبار جلب قائمة جميع المدرسين",
      method: "GET",
    },
    {
      id: "get-assistants",
      name: "جلب بيانات المساعدين",
      endpoint: "/api/admin/assistants",
      description: "اختبار جلب قائمة جميع المساعدين",
      method: "GET",
    },
    {
      id: "search-students",
      name: "البحث في الطلاب",
      endpoint: "/api/admin/search",
      description: "اختبار البحث في قائمة الطلاب",
      method: "POST",
    },
    {
      id: "dashboard-stats",
      name: "إحصائيات لوحة التحكم",
      endpoint: "Multiple endpoints",
      description: "اختبار جلب إحصائيات لوحة التحكم",
      method: "GET",
    },
  ];

  const testGetStudents = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.users.getAllStudents();
      console.log("Students API Response:", response);

      setStudentsData(response.data || []);
      setTestResults((prev) => ({
        ...prev,
        "get-students": {
          success: true,
          data: response.data,
          count: response.data?.length || 0,
          message: `تم جلب ${response.data?.length || 0} طالب بنجاح`,
        },
      }));

      toast.success(`تم جلب ${response.data?.length || 0} طالب بنجاح`);
    } catch (error) {
      console.error("Students API Error:", error);
      setTestResults((prev) => ({
        ...prev,
        "get-students": {
          success: false,
          error: handleAPIError(error),
          message: "فشل في جلب بيانات الطلاب",
        },
      }));

      toast.error(handleAPIError(error, "فشل في جلب بيانات الطلاب"));
    } finally {
      setIsLoading(false);
    }
  };

  const testGetInstructors = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.users.getAllInstructors();
      console.log("Instructors API Response:", response);

      const instructorsList = response.data?.content || response.data || [];
      setInstructorsData(instructorsList);
      setTestResults((prev) => ({
        ...prev,
        "get-instructors": {
          success: true,
          data: instructorsList,
          count: instructorsList.length,
          message: `تم جلب ${instructorsList.length} مدرس بنجاح`,
        },
      }));

      toast.success(`تم جلب ${instructorsList.length} مدرس بنجاح`);
    } catch (error) {
      console.error("Instructors API Error:", error);
      setTestResults((prev) => ({
        ...prev,
        "get-instructors": {
          success: false,
          error: handleAPIError(error),
          message: "فشل في جلب بيانات المدرسين",
        },
      }));

      toast.error(handleAPIError(error, "فشل في جلب بيانات المدرسين"));
    } finally {
      setIsLoading(false);
    }
  };

  const testSearchStudents = async () => {
    try {
      setIsLoading(true);
      const searchTerm = "test"; // Test search term
      const response = await adminAPI.users.searchStudents(searchTerm);
      console.log("Search API Response:", response);

      setTestResults((prev) => ({
        ...prev,
        "search-students": {
          success: true,
          data: response.data,
          count: response.data?.length || 0,
          searchTerm,
          message: `تم العثور على ${response.data?.length || 0} نتيجة للبحث عن "${searchTerm}"`,
        },
      }));

      toast.success(`تم العثور على ${response.data?.length || 0} نتيجة`);
    } catch (error) {
      console.error("Search API Error:", error);
      setTestResults((prev) => ({
        ...prev,
        "search-students": {
          success: false,
          error: handleAPIError(error),
          message: "فشل في البحث",
        },
      }));

      toast.error(handleAPIError(error, "فشل في البحث"));
    } finally {
      setIsLoading(false);
    }
  };

  const testDashboardStats = async () => {
    try {
      setIsLoading(true);
      const stats = await adminAPI.analytics.getDashboardStats();
      console.log("Dashboard Stats:", stats);

      setTestResults((prev) => ({
        ...prev,
        "dashboard-stats": {
          success: true,
          data: stats,
          message: "تم جلب الإحصائيات بنجاح",
        },
      }));

      toast.success("تم جلب الإحصائيات بنجاح");
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
      setTestResults((prev) => ({
        ...prev,
        "dashboard-stats": {
          success: false,
          error: handleAPIError(error),
          message: "فشل في جلب الإحصائيات",
        },
      }));

      toast.error(handleAPIError(error, "فشل في جلب الإحصائيات"));
    } finally {
      setIsLoading(false);
    }
  };

  const runTest = (testId) => {
    switch (testId) {
      case "get-students":
        testGetStudents();
        break;
      case "get-instructors":
        testGetInstructors();
        break;
      case "search-students":
        testSearchStudents();
        break;
      case "dashboard-stats":
        testDashboardStats();
        break;
      default:
        console.log("Unknown test:", testId);
    }
  };

  const runAllTests = async () => {
    for (const test of apiTests) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second between tests
      runTest(test.id);
    }
  };

  const getTestIcon = (testId) => {
    const result = testResults[testId];
    if (!result) return <FaPlay className="w-5 h-5 text-gray-400" />;

    return result.success ? (
      <FaCheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <FaExclamationTriangle className="w-5 h-5 text-red-500" />
    );
  };

  const getTestColor = (testId) => {
    const result = testResults[testId];
    if (!result) return "border-gray-200";

    return result.success
      ? "border-green-200 bg-green-50"
      : "border-red-200 bg-red-50";
  };

  return (
    <div className="min-h-screen bg-main p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="bold-32 text-gray-900 mb-4">اختبار Admin API</h1>
          <p className="regular-16 text-gray-600">
            اختبار جميع endpoints الخاصة بإدارة المستخدمين
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="bold-24 text-gray-900">اختبارات API</h2>
            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="bg-accent text-white px-6 py-2 rounded-lg bold-14 hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "جاري التشغيل..." : "تشغيل جميع الاختبارات"}
            </button>
          </div>

          {/* API Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiTests.map((test) => (
              <div
                key={test.id}
                className={`border-2 rounded-lg p-4 transition-all ${getTestColor(test.id)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTestIcon(test.id)}
                    <h3 className="bold-16 text-gray-900">{test.name}</h3>
                  </div>
                  <button
                    onClick={() => runTest(test.id)}
                    disabled={isLoading}
                    className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    اختبار
                  </button>
                </div>

                <p className="regular-14 text-gray-600 mb-3">
                  {test.description}
                </p>

                <div className="bg-gray-100 rounded p-3 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{test.method}</span>
                    <code className="text-gray-700">{test.endpoint}</code>
                  </div>
                </div>

                {testResults[test.id] && (
                  <div
                    className={`rounded p-3 border ${
                      testResults[test.id].success
                        ? "bg-green-100 border-green-200"
                        : "bg-red-100 border-red-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        testResults[test.id].success
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {testResults[test.id].message}
                    </p>

                    {testResults[test.id].count !== undefined && (
                      <p className="text-xs text-gray-600 mt-1">
                        عدد العناصر: {testResults[test.id].count}
                      </p>
                    )}

                    {testResults[test.id].error && (
                      <p className="text-xs text-red-600 mt-1">
                        خطأ: {testResults[test.id].error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data Display */}
        {(studentsData.length > 0 || instructorsData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Students Data */}
            {studentsData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaUserGraduate className="w-6 h-6 text-blue-500" />
                  <h3 className="bold-20 text-gray-900">
                    بيانات الطلاب ({studentsData.length})
                  </h3>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {studentsData.slice(0, 5).map((student, index) => (
                    <div
                      key={student.id || index}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="bold-14 text-gray-900">
                            {student.fullname || student.username}
                          </p>
                          <p className="regular-12 text-gray-600">
                            {student.email}
                          </p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          طالب
                        </span>
                      </div>
                    </div>
                  ))}
                  {studentsData.length > 5 && (
                    <p className="text-center text-gray-500 text-sm">
                      و {studentsData.length - 5} طالب آخر...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Instructors Data */}
            {instructorsData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaChalkboardTeacher className="w-6 h-6 text-green-500" />
                  <h3 className="bold-20 text-gray-900">
                    بيانات المدرسين ({instructorsData.length})
                  </h3>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {instructorsData.slice(0, 5).map((instructor, index) => (
                    <div
                      key={instructor.id || index}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="bold-14 text-gray-900">
                            {instructor.fullname || instructor.username}
                          </p>
                          <p className="regular-12 text-gray-600">
                            {instructor.email}
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          مدرس
                        </span>
                      </div>
                    </div>
                  ))}
                  {instructorsData.length > 5 && (
                    <p className="text-center text-gray-500 text-sm">
                      و {instructorsData.length - 5} مدرس آخر...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="bold-18 text-blue-900 mb-3">تعليمات الاختبار</h3>
          <ol className="space-y-2 text-blue-800">
            <li>1. تأكد من تشغيل الخادم على localhost:8080</li>
            <li>2. تأكد من وجود بيانات في قاعدة البيانات</li>
            <li>3. اضغط على "تشغيل جميع الاختبارات" أو اختبر كل API منفرداً</li>
            <li>4. تحقق من النتائج في Console للمزيد من التفاصيل</li>
            <li>5. إذا فشل اختبار، تحقق من حالة الخادم و endpoints</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestAdminAPI;
