import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiCode,
  FiCopy,
  FiDownload,
  FiEye,
  FiX,
  FiFileText,
  FiCalendar,
  FiCheck,
  FiTrash2,
  FiChevronDown,
} from "react-icons/fi";

const AccessCodeManagement = () => {
  const [accessCodes, setAccessCodes] = useState([]);
  const [lessons, setLessons] = useState([]);
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

      let response;
      if (selectedLesson) {
        response = await adminAPI.accessCodes.getByLesson(
          selectedLesson,
          page,
          size
        );
      } else {
        response = await adminAPI.accessCodes.getAll(page, size);
      }

      const newAccessCodes = response.data?.content || [];
      const totalElements = response.data?.totalElements || 0;

      setAccessCodes((prev) =>
        loadMore ? [...prev, ...newAccessCodes] : newAccessCodes
      );
      setPagination((prev) => ({
        ...prev,
        page,
        totalElements,
        hasMore: (page + 1) * size < totalElements,
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
      const courses =
        coursesResponse.data?.content || coursesResponse.data || [];

      let allLessons = [];
      for (const course of courses) {
        try {
          const lessonsResponse = await adminAPI.lessons.getByCourse(
            course.id,
            0,
            100
          );
          const courseLessons =
            lessonsResponse.data?.content || lessonsResponse.data || [];
          allLessons = [...allLessons, ...courseLessons];
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
        `${item.code} - ${item.lesson?.name || 'غير محدد'} - ${
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
    if (!searchTerm.trim() && !selectedLesson) {
      fetchAccessCodes();
      return;
    }

    let filteredCodes = [...accessCodes];

    if (searchTerm.trim()) {
      filteredCodes = filteredCodes.filter(
        (item) =>
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.lesson.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLesson) {
      filteredCodes = filteredCodes.filter(
        (item) => item.lesson.id === selectedLesson
      );
    }

    setAccessCodes(filteredCodes);
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة أكواد الوصول</h1>
          <p className="regular-16 text-gray-600">
            إجمالي الأكواد: {pagination.totalElements} | المعروض:{" "}
            {accessCodes.length}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopyAllCodes}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 flexCenter gap-2"
          >
            <FiCopy className="w-4 h-4" />
            نسخ الكل
          </button>
          <button
            onClick={handleDownloadCodes}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 flexCenter gap-2"
          >
            <FiDownload className="w-4 h-4" />
            تحميل
          </button>
          <button
            onClick={handleDeleteUsedCodes}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 flexCenter gap-2"
          >
            <FiTrash2 className="w-4 h-4" />
            حذف المستخدمة
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
          >
            <FiPlus className="w-5 h-5" />
            إنشاء أكواد جديدة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
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
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">جميع الدروس</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300"
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
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
            >
              إنشاء أول مجموعة أكواد
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right bold-14 text-gray-900">
                      الكود
                    </th>
                    <th className="px-6 py-4 text-right bold-14 text-gray-900">
                      الدرس
                    </th>
                    <th className="px-6 py-4 text-right bold-14 text-gray-900">
                      المنشئ
                    </th>
                    <th className="px-6 py-4 text-right bold-14 text-gray-900">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right bold-14 text-gray-900">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-4 text-right bold-14 text-gray-900">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accessCodes.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                            {item.code}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4 regular-14 text-gray-900">
                        {item.lessonName || "غير محدد"}
                      </td>
                      <td className="px-6 py-4 regular-14 text-gray-900">
                        {item.creatorName || "غير محدد"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            item.used
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.used ? (
                            <>
                              <FiX className="w-3 h-3" />
                              مستخدم
                            </>
                          ) : (
                            <>
                              <FiCheck className="w-3 h-3" />
                              متاح
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 regular-14 text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCopyCode(item.code)}
                          className="p-1 text-gray-500 cursor-pointer hover:text-accent transition-colors"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCode(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <FiTrash2 className="w-4 h-4 cursor-pointer" />
                        </button>
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
                  className="bg-white text-accent px-6 py-2 rounded-lg border border-accent hover:bg-accent hover:text-white transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء أكواد وصول جديدة</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                      {lesson.name} ({lesson.course?.name || "غير محدد"})
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
                  className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري الإنشاء..." : "إنشاء الأكواد"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تأكيد حذف كود الوصول</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCodeToDelete(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg bold-16 hover:bg-red-700 transition-all duration-300 disabled:opacity-50 flexCenter gap-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">
                تأكيد حذف الأكواد المستخدمة
              </h2>
              <button
                onClick={() => setShowDeleteUsedModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteUsedCodes}
                disabled={isDeletingUsed}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg bold-16 hover:bg-red-700 transition-all duration-300 disabled:opacity-50 flexCenter gap-2"
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
