import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiCode,
  FiCopy,
  FiDownload,
  FiX,
  FiCheck,
  FiTrash2,
  FiChevronDown,
} from "react-icons/fi";

const AccessCodeManagement = () => {
  const [accessCodes, setAccessCodes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteUsedModal, setShowDeleteUsedModal] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState(null);
  const [isDeletingUsed, setIsDeletingUsed] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    hasMore: true,
  });

  // Form states
  const [generateForm, setGenerateForm] = useState({
    lessonId: "",
    count: 10,
  });

  useEffect(() => {
    fetchAccessCodes();
    fetchLessons();
  }, [selectedLesson]);

  const fetchAccessCodes = async (loadMore = false) => {
    try {
      const loadingState = loadMore ? setIsLoadingMore : setIsLoading;
      loadingState(true);

      const page = loadMore ? pagination.page + 1 : 0;
      const size = pagination.size;

      const response = await adminAPI.accessCodes.getAll(
        selectedLesson === "" ? null : selectedLesson,
        page,
        size
      );
      const newAccessCodes = response.data?.content || [];
      const pageInfo = response.data || {};
      const totalElements = pageInfo.totalElements || 0;
      const totalPages = pageInfo.totalPages || 0;
      const currentPage = pageInfo.number || 0;

      setAccessCodes((prev) =>
        loadMore ? [...prev, ...newAccessCodes] : newAccessCodes
      );

      setPagination((prev) => ({
        ...prev,
        page,
        totalElements,
        totalPages,
        hasMore: newAccessCodes.length > 0 && currentPage + 1 < totalPages,
      }));
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل أكواد الوصول"));
      console.error(error);
      if (!loadMore) setAccessCodes([]);
    } finally {
      if (loadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const fetchLessons = async () => {
    try {
      const coursesResponse = await adminAPI.courses.getAll(0, 100);
      const coursesData =
        coursesResponse.data?.content || coursesResponse.data || [];

      setCourses(coursesData);

      let allLessons = [];
      for (const course of coursesData) {
        try {
          const lessonsResponse = await adminAPI.lessons.getByCourse(
            course.id,
            0,
            100
          );
          const courseLessons =
            lessonsResponse.data?.content || lessonsResponse.data || [];
          // Add course information to each lesson
          const lessonsWithCourse = courseLessons.map((lesson) => ({
            ...lesson,
            courseId: course.id,
            courseName: course.name,
          }));
          allLessons = [...allLessons, ...lessonsWithCourse];
        } catch (error) {
          console.error(
            `Error fetching lessons for course ${course.id}:`,
            error
          );
        }
      }

      setLessons(allLessons);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الدروس"));
      setLessons([]);
      setCourses([]);
    }
  };

  const handleGenerateAccessCodes = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await adminAPI.lessons.generateAccessCodes(
        generateForm.lessonId,
        generateForm.count
      );
      toast.success(`تم إنشاء ${generateForm.count} كود وصول بنجاح`);
      setShowGenerateModal(false);
      setGenerateForm({ lessonId: "", count: 10 });
      fetchAccessCodes();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء أكواد الوصول"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ الكود بنجاح");
  };

  const handleCopyAllCodes = () => {
    const codes = accessCodes.map((item) => item.code).join("\n");
    navigator.clipboard.writeText(codes);
    toast.success("تم نسخ جميع الأكواد بنجاح");
  };

  const handleDownloadCodes = () => {
    const codes = accessCodes
      .map(
        (item) =>
          `${item.code} - ${item.lessonName || "غير محدد"} - ${
            item.used ? "مستخدم" : "غير مستخدم"
          }`
      )
      .join("\n");

    const blob = new Blob([codes], { type: "text/plain" });
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

  const handleSearch = () => {
    // Reset pagination when searching
    setPagination((prev) => ({
      ...prev,
      page: 0,
      hasMore: true,
    }));

    // Fetch fresh data with new filters
    fetchAccessCodes();
  };

  const handleDeleteCode = (codeId) => {
    setCodeToDelete(codeId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!codeToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.accessCodes.delete(codeToDelete);
      toast.success("تم حذف كود الوصول بنجاح");
      fetchAccessCodes();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف كود الوصول"));
      console.error(error);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setCodeToDelete(null);
    }
  };

  const handleDeleteUsedCodes = async () => {
    setShowDeleteUsedModal(true);
  };

  const confirmDeleteUsedCodes = async () => {
    try {
      setIsDeletingUsed(true);
      await adminAPI.accessCodes.deleteUsed();
      toast.success("تم حذف جميع أكواد الوصول المستخدمة بنجاح");
      fetchAccessCodes();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الأكواد المستخدمة"));
      console.error(error);
    } finally {
      setIsDeletingUsed(false);
      setShowDeleteUsedModal(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center flex-col gap-5 lg:gap-0 lg:flex-row justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة أكواد الوصول</h1>
          <p className="regular-16 text-gray-600">
            إجمالي الأكواد: {pagination.totalElements} | المعروض:{" "}
            {accessCodes.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopyAllCodes}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 flexCenter gap-2 cursor-pointer"
          >
            <FiCopy className="w-4 h-4" />
            نسخ الكل
          </button>
          <button
            onClick={handleDownloadCodes}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 flexCenter gap-2 cursor-pointer"
          >
            <FiDownload className="w-4 h-4" />
            تحميل
          </button>
          <button
            onClick={handleDeleteUsedCodes}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 flexCenter gap-2 cursor-pointer"
          >
            <FiTrash2 className="w-4 h-4" />
            حذف المستخدمة
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <FiPlus className="w-5 h-5" />
            إنشاء أكواد جديدة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 md:gap-3 gap-y-4">
          <div className="relative flex col-span-3">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث بالكود أو اسم الدرس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="px-4 py-3 border col-span-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">اختر الدرس</option>
            {courses.map((course) => {
              // Filter lessons that belong to this course
              const courseLessons = lessons.filter(
                (lesson) => lesson.courseId === course.id
              );

              // Only render optgroup if course has lessons
              if (courseLessons.length === 0) return null;

              return (
                <optgroup key={course.id} label={`كورس: ${course.name}`}>
                  {courseLessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <button
            onClick={handleSearch}
            className="bg-accent text-white col-span-1 mr-3 md:mr-0 px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Access Codes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 regular-16 text-gray-600">جاري التحميل...</p>
          </div>
        ) : accessCodes.length === 0 ? (
          <div className="p-8 text-center">
            <FiCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">لا توجد أكواد وصول للعرض</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
            >
              إنشاء أول مجموعة أكواد
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Scroll Hint */}
            <div className="block sm:hidden bg-blue-50 border-l-4 border-blue-400 p-3 mb-0 rounded-t-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-4 w-4 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="mr-3">
                  <p className="text-sm text-blue-700">
                    اسحب يميناً ويساراً لعرض جميع الأعمدة
                  </p>
                </div>
              </div>
            </div>

            {/* Table Container with Enhanced Mobile Scrolling */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 border-t border-gray-200 sm:border-t-0">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-right bold-14 text-gray-900 whitespace-nowrap min-w-[120px]">
                      الكود
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-right bold-14 text-gray-900 whitespace-nowrap min-w-[150px]">
                      الدرس
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-right bold-14 text-gray-900 whitespace-nowrap min-w-[120px]">
                      المنشئ
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-right bold-14 text-gray-900 whitespace-nowrap min-w-[100px]">
                      الحالة
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-right bold-14 text-gray-900 whitespace-nowrap min-w-[120px]">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-right bold-14 text-gray-900 whitespace-nowrap min-w-[100px]">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accessCodes.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm whitespace-nowrap">
                            {item.code}
                          </code>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 regular-12 sm:regular-14 text-gray-900">
                        <div
                          className="max-w-[150px] truncate"
                          title={item.lessonName || "غير محدد"}
                        >
                          {item.lessonName || "غير محدد"}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 regular-12 sm:regular-14 text-gray-900">
                        <div
                          className="max-w-[120px] truncate"
                          title={item.creatorName || "غير محدد"}
                        >
                          {item.creatorName || "غير محدد"}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap ${
                            item.used
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.used ? (
                            <>
                              <FiX className="w-3 h-3" />
                              <span className="hidden sm:inline">مستخدم</span>
                              <span className="sm:hidden">✓</span>
                            </>
                          ) : (
                            <>
                              <FiCheck className="w-3 h-3" />
                              <span className="hidden sm:inline">متاح</span>
                              <span className="sm:hidden">○</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 regular-12 sm:regular-14 text-gray-500">
                        <div className="whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString("ar-EG")}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyCode(item.code)}
                            className="p-1 sm:p-2 text-gray-500 cursor-pointer hover:text-accent transition-colors rounded"
                            title="نسخ الكود"
                          >
                            <FiCopy className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCode(item.id)}
                            className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="حذف الكود"
                          >
                            <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="p-4 flex justify-center border-t border-gray-200">
                <button
                  onClick={() => fetchAccessCodes(true)}
                  disabled={isLoadingMore}
                  className="bg-white text-accent px-6 py-2 rounded-lg border border-accent hover:bg-[#088395] hover:text-white transition-all duration-300 flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:border hover:border-[#088395]"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></span>
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <FiChevronDown className="w-4 h-4" />
                      تحميل المزيد
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generate Access Codes Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء أكواد وصول جديدة</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleGenerateAccessCodes} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  الدرس *
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">اختر الدرس</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name} ({lesson.courseName || "غير محدد"})
                    </option>
                  ))}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="10"
                />
                <p className="regular-12 text-gray-500 mt-1">
                  الحد الأقصى: 100 كود
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? "جاري الإنشاء..." : "إنشاء الأكواد"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تأكيد حذف كود الوصول</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCodeToDelete(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flexCenter flex-col">
                <div className="w-16 h-16 bg-red-100 rounded-full flexCenter mb-4">
                  <FiTrash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="bold-18 text-gray-900 mb-2">
                  هل أنت متأكد من الحذف؟
                </h3>
                <p className="regular-14 text-gray-600 text-center">
                  سيتم حذف كود الوصول بشكل دائم ولن يتمكن الطلاب من استخدامه
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCodeToDelete(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg bold-16 hover:bg-red-700 transition-all duration-300 disabled:opacity-50 flexCenter gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    جاري الحذف...
                  </>
                ) : (
                  "حذف الكود"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Used Codes Confirmation Modal */}
      {showDeleteUsedModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">
                تأكيد حذف الأكواد المستخدمة
              </h2>
              <button
                onClick={() => setShowDeleteUsedModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flexCenter flex-col">
                <div className="w-16 h-16 bg-red-100 rounded-full flexCenter mb-4">
                  <FiTrash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="bold-18 text-gray-900 mb-2">
                  هل أنت متأكد من حذف جميع الأكواد المستخدمة؟
                </h3>
                <p className="regular-14 text-gray-600 text-center">
                  سيتم حذف جميع أكواد الوصول التي تم استخدامها بشكل دائم
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteUsedModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteUsedCodes}
                disabled={isDeletingUsed}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg bold-16 hover:bg-red-700 transition-all duration-300 disabled:opacity-50 flexCenter gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isDeletingUsed ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    جاري الحذف...
                  </>
                ) : (
                  "حذف الأكواد المستخدمة"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessCodeManagement;
