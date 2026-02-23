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
  FiX,
  FiCheck,
  FiClock,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

const InstructorAccessCodeManagement = () => {
  const { user } = useUserData();
  const [accessCodes, setAccessCodes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    hasMore: true,
  });

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
  }, [selectedLesson, pagination.page, instructorId]);

  useEffect(() => {
    if (courses.length > 0) {
      fetchAllLessons();
    }
  }, [courses]);

  // Fetch access codes when selectedLesson changes
  useEffect(() => {
    if (instructorId && selectedLesson !== "") {
      // Reset pagination when lesson selection changes
      setPagination((prev) => ({
        ...prev,
        page: 0,
        hasMore: true,
      }));
      fetchAccessCodes();
    }
  }, [selectedLesson, instructorId]);

  const fetchCourses = async () => {
    try {
      const response =
        await instructorAPI.courses.getByInstructor(instructorId);
      setCourses(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
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

  const fetchAccessCodes = async (loadMore = false) => {
    try {
      const loadingState = loadMore ? setIsLoadingMore : setIsLoading;
      loadingState(true);

      // Use the current pagination state
      const currentPage = loadMore ? pagination.page + 1 : 0;
      const size = pagination.size;
      const sort = "id,desc";

      const response = selectedLesson
        ? await instructorAPI.accessCodes.getByLesson(
            instructorId,
            selectedLesson,
            currentPage,
            size,
            sort
          )
        : await instructorAPI.accessCodes.getByInstructor(
            instructorId,
            currentPage,
            size,
            sort
          );

      const newAccessCodes = response.data?.content || [];

      if (loadMore) {
        setAccessCodes((prev) => [...prev, ...newAccessCodes]);
      } else {
        setAccessCodes(newAccessCodes);
      }

      setPagination({
        page: response.data?.number || 0,
        size: response.data?.size || size,
        totalElements: response.data?.totalElements || 0,
        totalPages: response.data?.totalPages || 0,
        hasMore: !response.data?.last,
      });
    } catch (error) {
      toast.error(handleAPIError("خطأ في إحضار اكواد الوصول"));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // const handleGenerateAccessCodes = async (e) => {
  //   e.preventDefault();
  //   try {
  //     setIsLoading(true);
  //     await instructorAPI.lessons.generateAccessCodes(
  //       generateForm.lessonId,
  //       generateForm.count
  //     );

  //     toast.success(`تم إنشاء ${generateForm.count} كود وصول بنجاح`);
  //     setShowGenerateModal(false);
  //     setGenerateForm({ lessonId: "", count: 5 });

  //     // Reset pagination and refresh the access codes list
  //     setPagination((prev) => ({
  //       ...prev,
  //       page: 0,
  //       hasMore: true,
  //     }));
  //     await fetchAccessCodes();
  //   } catch (error) {
  //     toast.error(handleAPIError(error, "فشل في إنشاء أكواد الوصول"));
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
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

  const toggleCardExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
    <div className="p-4 lg:p-8">
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
        transition={Slide}
        className={`z-50`}
      />
      {/* Header */}
      <div className="flex items-center flex-col lg:flex-row justify-between mb-6 lg:mb-8 gap-4 lg:gap-0">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة أكواد الوصول</h1>
          <p className="regular-14 lg:regular-16 text-gray-600">
            إنشاء وإدارة أكواد الوصول لدروسك
          </p>
        </div>
        <div className="flex gap-2 lg:gap-3 w-full lg:w-auto md:justify-end">
          <button
            onClick={downloadCodes}
            className="cursor-pointer flex-1/2 bg-green-600 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg bold-14 lg:bold-16 hover:bg-green-700 transition-all duration-300 flexCenter gap-2"
          >
            <FiDownload className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden sm:inline">تحميل الأكواد</span>
            <span className="sm:hidden">تحميل</span>
          </button>
          {/* <button
            onClick={() => setShowGenerateModal(true)}
            className="cursor-pointer bg-secondary flex-1/2 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg bold-14 lg:bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
          >
            <FiPlus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden sm:inline">إنشاء أكواد جديدة</span>
            <span className="sm:hidden">جديد</span>
          </button> */}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 lg:flex lg:flex-wrap gap-3 lg:gap-4">
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="px-3 lg:px-4 py-2 lg:py-3 border lg:flex-1/4 border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm lg:text-base"
          >
            <option value="">اختر الدرس</option>
            {courses.map((course) => {
              const courseLessons = lessons.filter(
                (lesson) => lesson.course?.id === course.id
              );
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
            onClick={() => {
              setSearchTerm("");
              setSelectedLesson("");
              setPagination((prev) => ({
                ...prev,
                page: 0,
                hasMore: true,
              }));
            }}
            className="bg-accent flexCenter flex text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-6">
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
              <FiCode className="w-5 lg:w-6 h-5 lg:h-6 text-blue-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">إجمالي الأكواد</p>
              <p className="bold-16 lg:bold-20 text-gray-900">
                {accessCodes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 lg:p-3 bg-green-100 rounded-lg">
              <FiCheck className="w-5 lg:w-6 h-5 lg:h-6 text-green-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">أكواد مستخدمة</p>
              <p className="bold-16 lg:bold-20 text-gray-900">
                {accessCodes.filter((c) => c.used).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 lg:p-3 bg-orange-100 rounded-lg">
              <FiClock className="w-5 lg:w-6 h-5 lg:h-6 text-orange-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">أكواد متاحة</p>
              <p className="bold-16 lg:bold-20 text-gray-900">
                {accessCodes.filter((c) => !c.used).length}
              </p>
            </div>
          </div>
        </div>  
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 border-t border-gray-200">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  الكود
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                  الدرس
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  المنشئ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
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
                    {/* <button
                      onClick={() => setShowGenerateModal(true)}
                      className="cursor-pointer bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
                    >
                      إنشاء أول كود
                    </button> */}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code, index) => (
                  <tr
                    key={code.id || `code-${index}-${code.code}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="max-w-[150px] truncate"
                        title={code.lessonName || "غير محدد"}
                      >
                        <p className="regular-14 text-gray-900">
                          {code.lessonName || "غير محدد"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="max-w-[120px] truncate"
                        title={code.creatorName || "غير محدد"}
                      >
                        <p className="regular-14 text-gray-600">
                          {code.creatorName || "غير محدد"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.used ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheck className="w-3 h-3 mr-1" />
                          <span>مستخدم</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <FiClock className="w-3 h-3 mr-1" />
                          <span>متاح</span>
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="cursor-pointer text-blue-600 hover:text-blue-900 transition-colors p-2 rounded"
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

        {pagination.hasMore && (
          <div className="p-4 flex justify-center border-t border-gray-200">
            <button
              onClick={() => fetchAccessCodes(true)}
              disabled={isLoadingMore}
              className="bg-white text-secondary px-6 py-2 rounded-lg border border-secondary hover:bg-secondary hover:text-white transition-all duration-300 flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:border hover:border-secondary"
            >
              {isLoadingMore ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></span>
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
      </div>

      {/* Mobile Card View */}
      <div className="xl:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-6"></div>
              </div>
            </div>
          ))
        ) : filteredCodes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FiCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="regular-14 text-gray-600 mb-4">
              لا توجد أكواد وصول للعرض
            </p>
            {/* <button
              onClick={() => setShowGenerateModal(true)}
              className="cursor-pointer bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
            >
              إنشاء أول كود
            </button> */}
          </div>
        ) : (
          filteredCodes.map((code, index) => (
            <div
              key={code.id || `code-${index}-${code.code}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleCardExpand(code.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        code.used ? "bg-green-100" : "bg-orange-100"
                      }`}
                    >
                      {code.used ? (
                        <FiCheck className="w-5 h-5 text-green-600" />
                      ) : (
                        <FiClock className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="bold-16 text-gray-900 truncate max-w-[180px]">
                      {code.lessonName || "غير محدد"}
                    </h3>
                    <p className="regular-12 text-gray-500">
                      {code.createdAt
                        ? new Date(code.createdAt).toLocaleDateString("ar-EG")
                        : "غير محدد"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardExpand(code.id);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedCards[code.id] ? (
                    <FiChevronUp className="w-5 h-5" />
                  ) : (
                    <FiChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {expandedCards[code.id] && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="regular-12 text-gray-500">الكود</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="regular-12 text-gray-500">المنشئ</p>
                      <p className="regular-14 text-gray-900 truncate">
                        {code.creatorName || "غير محدد"}
                      </p>
                    </div>
                    <div>
                      <p className="regular-12 text-gray-500">الحالة</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          code.used
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {code.used ? (
                          <>
                            <FiCheck className="w-3 h-3" />
                            <span>مستخدم</span>
                          </>
                        ) : (
                          <>
                            <FiClock className="w-3 h-3" />
                            <span>متاح</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Load More Button for Mobile */}
        {pagination.hasMore && (
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => fetchAccessCodes(true)}
              disabled={isLoadingMore}
              className="bg-white text-secondary px-6 py-2 rounded-lg border border-secondary hover:bg-secondary hover:text-white transition-all duration-300 flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:border hover:border-secondary"
            >
              {isLoadingMore ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></span>
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
      </div>

      {/* Generate Access Codes Modal */}
      {/* {showGenerateModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-20 lg:bold-24 text-gray-900">
                إنشاء أكواد وصول
              </h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 lg:w-6 lg:h-6 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={handleGenerateAccessCodes}
              className="space-y-4 lg:space-y-6"
            >
              <div>
                <label className="block bold-14 lg:bold-16 text-gray-900 mb-2">
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
                  className="w-full px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm lg:text-base"
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
                <label className="block bold-14 lg:bold-16 text-gray-900 mb-2">
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
                  className="w-full px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm lg:text-base"
                  placeholder="5"
                />
                <p className="regular-12 text-gray-500 mt-1">
                  يمكنك إنشاء من 1 إلى 100 كود في المرة الواحدة
                </p>
              </div>

              <div className="flex gap-3 lg:gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer flex-1 bg-secondary text-white py-2 lg:py-3 rounded-lg bold-14 lg:bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري الإنشاء..." : "إنشاء الأكواد"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-2 lg:py-3 rounded-lg bold-14 lg:bold-16 hover:bg-gray-300 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default InstructorAccessCodeManagement;
