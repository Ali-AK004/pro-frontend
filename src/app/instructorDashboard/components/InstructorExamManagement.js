import React, { useState, useEffect } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiX,
  FiBook,
  FiClock,
  FiAward,
  FiUsers,
  FiBarChart,
} from "react-icons/fi";
import ExamCreationModal from "../../adminDashboard/components/ExamCreationModal";

const InstructorExamManagement = () => {
  const { user } = useUserData();
  const [exams, setExams] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState(null);

  // Get instructor ID from user object
  const instructorId = user?.instructorId || user?.id;

  useEffect(() => {
    if (instructorId) {
      fetchCourses();
    }
  }, [instructorId]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons();
    } else {
      setLessons([]);
      setSelectedLesson("");
    }
  }, [selectedCourse]);

  useEffect(() => {
    fetchExams();
  }, [selectedLesson, instructorId]);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.courses.getByInstructor(instructorId);
      setCourses(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await instructorAPI.courses.getLessons(selectedCourse);
      setLessons(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الدروس"));
    }
  };

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      if (selectedLesson) {
        const response = await instructorAPI.exams.getByLesson(selectedLesson);
        setExams(response.data || []);
      } else if (instructorId) {
        const response = await instructorAPI.exams.getByInstructor(instructorId);
        setExams(response.data || []);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الامتحانات"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExam = async (examData) => {
    try {
      setIsLoading(true);
      await instructorAPI.exams.create(examData.lessonId, examData);
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
      await instructorAPI.exams.update(examData);
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

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الامتحان؟")) {
      return;
    }

    try {
      setIsLoading(true);
      await instructorAPI.exams.delete(examId);
      toast.success("تم حذف الامتحان بنجاح");
      fetchExams();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResults = async (exam) => {
    try {
      setIsLoading(true);
      const response = await instructorAPI.exams.getResults(exam.id);
      setExamResults(response.data);
      setSelectedExam(exam);
      setShowResultsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل نتائج الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  // Get lessons for the selected course or all lessons for instructor
  const getAvailableLessons = () => {
    if (selectedCourse) {
      return lessons;
    }
    // Return all lessons from all courses
    return courses.reduce((allLessons, course) => {
      return [...allLessons, ...(course.lessons || [])];
    }, []);
  };

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة الامتحانات</h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة امتحانات دروسك
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-secondary text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
        >
          <FiPlus className="w-5 h-5" />
          إنشاء امتحان جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الامتحانات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
          </div>

          {/* Course Filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
            <option value="">جميع الكورسات</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          {/* Lesson Filter */}
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
            <option value="">جميع الدروس</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
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
              className="mt-4 bg-secondary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
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
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-2"
                  >
                    <FiBarChart className="w-4 h-4" />
                    النتائج
                  </button>
                  <button
                    onClick={() => {
                      setSelectedExam(exam);
                      setShowEditModal(true);
                    }}
                    className="flex-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-2"
                  >
                    <FiEdit className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors"
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
          lessons={getAvailableLessons()}
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
          lessons={getAvailableLessons()}
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
    </div>
  );
};

// Exam Results Modal Component
const ExamResultsModal = ({ isOpen, onClose, exam, results }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="bold-24 text-gray-900">
            نتائج الامتحان: {exam.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorExamManagement;
