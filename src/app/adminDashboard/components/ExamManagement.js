import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiX,
  FiBook,
  FiClock,
  FiAward,
  FiUsers,
  FiBarChart,
} from "react-icons/fi";
import ExamCreationModal from "./Modal/ExamCreationModal";

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);

  useEffect(() => {
    fetchLessons();
    fetchExams();
  }, [selectedLesson]);

  const fetchLessons = async () => {
    try {
      // Get all courses first, then get lessons for each course
      const coursesResponse = await adminAPI.courses.getAll();
      const courses =
        coursesResponse.data?.content || coursesResponse.data || [];
      setCourses(courses);

      let allLessons = [];
      for (const course of courses) {
        try {
          const lessonsResponse = await adminAPI.lessons.getByCourse(course.id);
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

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      if (selectedLesson) {
        const response = await adminAPI.exams.getByLesson(selectedLesson);
        setExams(response.data || []);
      } else {
        // Only fetch all exams if no lesson is selected
        // For now, show empty list when no lesson is selected to avoid unnecessary API calls
        setExams([]);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الامتحانات"));
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExam = async (examData) => {
    try {
      setIsLoading(true);
      await adminAPI.exams.create(examData.lessonId, examData);
      toast.success("تم إنشاء الامتحان بنجاح");
      setShowCreateModal(false);
      fetchExams();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateExam = async (examData) => {
    try {
      setIsLoading(true);
      await adminAPI.exams.update(examData);
      toast.success("تم تحديث الامتحان بنجاح");
      setShowEditModal(false);
      setSelectedExam(null);
      fetchExams();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.exams.delete(examToDelete.id);
      toast.success("تم حذف الامتحان بنجاح");
      setShowDeleteModal(false);
      setExamToDelete(null);
      fetchExams();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (exam) => {
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };

  const handleViewResults = async (exam) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.exams.getResults(exam.id);
      setExamResults(response.data);
      setSelectedExam(exam);
      setShowResultsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل نتائج الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center flex-col gap-5 md:flex-row md:gap-0 justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة الامتحانات</h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة امتحانات الدروس
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <FiPlus className="w-5 h-5" />
          إنشاء امتحان جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-4">
          <div className="flex-1 flex col-span-2 relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الدروس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          {/* Lesson Filter */}
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="w-full px-4 py-3 col-span-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          ))
        ) : filteredExams.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">لا توجد امتحانات للعرض</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
            >
              إنشاء أول امتحان
            </button>
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              {/* Exam Header */}
              <div className="p-6">
                <h3 className="bold-18 text-gray-900 mb-2">{exam.title}</h3>
                <p className="regular-14 text-gray-600 mb-4">
                  {exam.lessonName || "درس غير محدد"}
                </p>

                {/* Exam Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-blue-500" />
                    <span className="regular-12 text-gray-600">
                      {exam.timeLimitMinutes} دقيقة
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiAward className="w-4 h-4 text-green-500" />
                    <span className="regular-12 text-gray-600">
                      {exam.passingScore}% للنجاح
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiBook className="w-4 h-4 text-purple-500" />
                    <span className="regular-12 text-gray-600">
                      {exam.questions?.length || 0} سؤال
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4 text-orange-500" />
                    <span className="regular-12 text-gray-600">
                      {exam.submissionCount || 0} محاولة
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewResults(exam)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-2 cursor-pointer"
                  >
                    <FiBarChart className="w-4 h-4" />
                    النتائج
                  </button>
                  <button
                    onClick={() => {
                      setSelectedExam(exam);
                      setShowEditModal(true);
                    }}
                    className="flex-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-2 cursor-pointer"
                  >
                    <FiEdit className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => openDeleteModal(exam)}
                    className="bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <ExamCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateExam}
          lessons={lessons}
          courses={courses}
          isLoading={isLoading}
        />
      )}

      {/* Edit Exam Modal */}
      {showEditModal && selectedExam && (
        <ExamCreationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExam(null);
          }}
          onSubmit={handleUpdateExam}
          lessons={lessons}
          courses={courses}
          initialData={selectedExam}
          isLoading={isLoading}
          isEdit={true}
        />
      )}

      {/* Results Modal */}
      {showResultsModal && selectedExam && examResults && (
        <ExamResultsModal
          isOpen={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedExam(null);
            setExamResults(null);
          }}
          exam={selectedExam}
          results={examResults}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && examToDelete && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="bold-18 text-gray-900 mb-2">تأكيد حذف الامتحان</h3>

              {/* Message */}
              <p className="regular-14 text-gray-600 mb-6">
                هل أنت متأكد من حذف امتحان "{examToDelete.title}"؟
                <br />
                <span className="text-red-600 bold-14">
                  سيتم حذف جميع النتائج والإجابات المرتبطة به نهائياً.
                </span>
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setExamToDelete(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg bold-14 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteExam}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg bold-14 hover:bg-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? "جاري الحذف..." : "حذف نهائياً"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Exam Results Modal Component
const ExamResultsModal = ({ isOpen, onClose, exam, results }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flexCenter z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="bold-24 text-gray-900">
            نتائج الامتحان: {exam.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {results.totalSubmissions}
              </div>
              <div className="text-sm text-blue-600">إجمالي المحاولات</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {results.passedCount}
              </div>
              <div className="text-sm text-green-600">عدد الناجحين</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {results.passRate?.toFixed(1)}%
              </div>
              <div className="text-sm text-purple-600">معدل النجاح</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {results.averageScore?.toFixed(1)}%
              </div>
              <div className="text-sm text-orange-600">المتوسط العام</div>
            </div>
          </div>

          {/* Question Statistics */}
          {results.questionStats && results.questionStats.length > 0 && (
            <div>
              <h3 className="bold-18 text-gray-900 mb-4">إحصائيات الأسئلة</h3>
              <div className="space-y-4">
                {results.questionStats.map((questionStat, index) => (
                  <div
                    key={questionStat.questionId}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="bold-16 text-gray-900">
                        السؤال {index + 1}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {questionStat.correctCount} /{" "}
                        {questionStat.totalAttempts} صحيح
                      </div>
                    </div>
                    <p className="regular-14 text-gray-700 mb-3">
                      {questionStat.questionText}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${(questionStat.correctCount / questionStat.totalAttempts) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {(
                          (questionStat.correctCount /
                            questionStat.totalAttempts) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;
