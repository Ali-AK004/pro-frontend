import React, { useState, useEffect } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { Slide } from "react-toastify";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiCode,
  FiPlus,
  FiCopy,
  FiDownload,
  FiSearch,
  FiX,
  FiCheck,
  FiClock,
  FiFileText,
} from "react-icons/fi";

const InstructorAccessCodeManagement = () => {
  const { user } = useUserData();
  const [accessCodes, setAccessCodes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedLesson, setSelectedLesson] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [generateForm, setGenerateForm] = useState({
    lessonId: selectedLesson || "",
    count: 5,
  });

  // Get instructor ID from user object
  const instructorId = user?.instructorId || user?.id;

  useEffect(() => {
    if (instructorId) {
      fetchCourses();
      fetchAccessCodes();
    }
  }, [instructorId]);

  useEffect(() => {
    if (courses.length > 0) {
      fetchAllLessons();
    }
  }, [courses]);

  const fetchCourses = async () => {
    try {
      const response =
        await instructorAPI.courses.getByInstructor(instructorId);
      setCourses(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
    }
  };

  const fetchLessonsForCourse = async (courseId) => {
    try {
      const response = await instructorAPI.courses.getLessons(courseId);
      setLessons((prev) => {
        // Remove old lessons for this course
        const filtered = prev.filter((l) => l.course?.id !== courseId);
        // Add new lessons with course association
        const newLessons = response.data.map((lesson) => ({
          ...lesson,
          course: {
            id: courseId,
            name: courses.find((c) => c.id === courseId)?.name || "",
          },
        }));
        return [...filtered, ...newLessons];
      });
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الدروس"));
    }
  };

  const fetchAllLessons = async () => {
    try {
      const allLessons = [];
      for (const course of courses) {
        const response = await instructorAPI.courses.getLessons(course.id);
        const courseLessons = response.data.map((lesson) => ({
          ...lesson,
          course: { id: course.id, name: course.name },
        }));
        allLessons.push(...courseLessons);
      }
      setLessons(allLessons);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الدروس"));
    }
  };

  const fetchAccessCodes = async () => {
    try {
      setIsLoading(true);
      const response =
        await instructorAPI.accessCodes.getByInstructor(instructorId);
      setAccessCodes(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل أكواد الوصول"));
      console.error("Error fetching access codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAccessCodes = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await instructorAPI.lessons.generateAccessCodes(
        generateForm.lessonId,
        generateForm.count
      );

      toast.success(`تم إنشاء ${generateForm.count} كود وصول بنجاح`);
      setShowGenerateModal(false);
      setGenerateForm({ lessonId: "", count: 5 });

      // Refresh the access codes list
      await fetchAccessCodes();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء أكواد الوصول"));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        toast.success("تم نسخ الكود بنجاح");
      })
      .catch(() => {
        toast.error("فشل في نسخ الكود");
      });
  };

  const downloadCodes = () => {
    const codesText = accessCodes
      .filter((code) => !code.used)
      .map((code) => `${code.code} - ${code.lessonName}`)
      .join("\n");

    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "access-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("تم تحميل الأكواد بنجاح");
  };

  const filteredCodes = accessCodes.filter((code) => {
    // Safety checks for data structure
    if (!code) return false;

    const matchesSearch =
      code.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.lessonName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLesson = !selectedLesson || code.lessonId === selectedLesson;

    return matchesSearch && matchesLesson;
  });

  return (
    <div className="p-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Slide}
        className={`z-50`}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة أكواد الوصول</h1>
          <p className="regular-16 text-gray-600">
            إنشاء وإدارة أكواد الوصول لدروسك
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadCodes}
            className="cursor-pointer bg-green-600 text-white px-6 py-3 rounded-lg bold-16 hover:bg-green-700 transition-all duration-300 flexCenter gap-2"
          >
            <FiDownload className="w-5 h-5" />
            تحميل الأكواد
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="cursor-pointer bg-secondary text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
          >
            <FiPlus className="w-5 h-5" />
            إنشاء أكواد جديدة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center flex-wrap gap-4">
          <div className="relative flex-1/2">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الأكواد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
          </div>

          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="px-4 py-3 border flex-1/4 border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
            <option value="">اختر الدرس</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button className="cursor-pointer flex-1 bg-secondary text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300">
              تطبيق
            </button>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedLesson("");
              }}
              className="cursor-pointer px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiCode className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">إجمالي الأكواد</p>
              <p className="bold-20 text-gray-900">{accessCodes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">أكواد مستخدمة</p>
              <p className="bold-20 text-gray-900">
                {accessCodes.filter((c) => c.used).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiClock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">أكواد متاحة</p>
              <p className="bold-20 text-gray-900">
                {accessCodes.filter((c) => !c.used).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">معدل الاستخدام</p>
              <p className="bold-20 text-gray-900">
                {accessCodes.length > 0
                  ? Math.round(
                      (accessCodes.filter((c) => c.isUsed).length /
                        accessCodes.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Access Codes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكود
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدرس
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنشئ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <FiCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="regular-14 text-gray-600 mb-4">
                      لا توجد أكواد وصول للعرض
                    </p>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="cursor-pointer bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
                    >
                      إنشاء أول كود
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr
                    key={code.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="regular-14 text-gray-900">
                        {code.lessonName || "غير محدد"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="regular-14 text-gray-600">
                        {code.creatorName || "غير محدد"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.used ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheck className="w-3 h-3 mr-1" />
                          مستخدم
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <FiClock className="w-3 h-3 mr-1" />
                          متاح
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="regular-12 text-gray-500">
                        {code.createdAt
                          ? new Date(code.createdAt).toLocaleDateString("ar-EG")
                          : "غير محدد"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="cursor-pointer text-blue-600 hover:text-blue-900 transition-colors"
                          title="نسخ"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Access Codes Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء أكواد وصول</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleGenerateAccessCodes} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  اختر الدرس *
                </label>
                <select
                  required
                  value={generateForm.lessonId}
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      lessonId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
                  <option value="">اختر الدرس</option>
                  {courses.map((course) => {
                    const courseLessons = lessons.filter(
                      (lesson) => lesson.course?.id === course.id
                    );
                    if (courseLessons.length === 0) return null;

                    return (
                      <optgroup key={course.id} label={course.name}>
                        {courseLessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  عدد الأكواد *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={generateForm.count}
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      count: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="5"
                />
                <p className="regular-12 text-gray-500 mt-1">
                  يمكنك إنشاء من 1 إلى 100 كود في المرة الواحدة
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer flex-1 bg-secondary text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري الإنشاء..." : "إنشاء الأكواد"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
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

export default InstructorAccessCodeManagement;
