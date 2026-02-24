import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiBook,
  FiClock,
  FiAward,
  FiBarChart,
  FiCopy,
} from "react-icons/fi";
import ExamCreationModal from "./Modal/ExamCreationModal";

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [errors, setErrors] = useState({});
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lessons, setLessons] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);
  const [selectedLessonFilter, setSelectedLessonFilter] = useState("");
  const [allExams, setAllExams] = useState([]);

  // ... بعد useState الحالية، أضف:
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyExamData, setCopyExamData] = useState({ examId: '', targetLessonId: '' });
  const [resultsPage, setResultsPage] = useState(0);
  const [resultsSize] = useState(10);
  const [resultsTotalPages, setResultsTotalPages] = useState(0);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchLessons();
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedLessonFilter) {
      const filtered = allExams.filter(
        (exam) => exam.lessonId === selectedLessonFilter
      );
      setExams(filtered);
    } else {
      setExams([]); // Show nothing when no lesson is selected
    }
  }, [selectedLessonFilter, allExams]);

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
          handleAPIError(error, ` ${course.id} :فشل في تحميل دروس كورس`);
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
      const response = await adminAPI.exams.getAll();
      const examsData = response.data?.content || [];
      setAllExams(examsData); // Only store in allExams
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الامتحانات"));
      setAllExams([]);
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
      const errorMessage =
        error.response?.data?.message || "فشل في إنشاء الامتحان";

      toast.error(errorMessage);

      if (error.response?.data?.errorCode === "VALIDATION_ERROR") {
        // Match Arabic: "السؤال رقم 2 مكرر"
        const match = errorMessage.match(/السؤال رقم (\d+) مكرر/);

        if (match && match[1]) {
          const questionIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index

          if (!isNaN(questionIndex)) {
            setErrors((prev) => ({
              ...prev,
              [`question_${questionIndex}_text`]:
                "نص السؤال مكرر. يرجى تعديله.",
            }));
          }
        }
      }
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
      const errorMessage =
        error.response?.data?.message || "فشل في تحديث الامتحان";
      toast.error(errorMessage);

      if (error.response?.data?.errorCode === "VALIDATION_ERROR") {
        // Check if it's a duplicate question error
        if (errorMessage.includes("نص السؤال مكرر:")) {
          const match = errorMessage.match(/نص السؤال مكرر:\s*(.+)/);

          if (match && match[1]) {
            const duplicateText = match[1].trim();
            const newErrors = {};

            examData.questions.forEach((q, index) => {
              if (q.questionText.trim() === duplicateText) {
                newErrors[`question_${index}_text`] =
                  "نص السؤال مكرر. يرجى تعديله.";
              }
            });

            setErrors((prev) => ({ ...prev, ...newErrors }));
          }
        }
      }
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
      const errorMessage =
        error.response?.data?.message || "فشل في حذف الامتحان";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (exam) => {
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };

  // دالة نسخ الامتحان
  const handleCopyExam = async () => {
    try {
      setIsLoading(true);
      await adminAPI.exams.copyExam(copyExamData.examId, copyExamData.targetLessonId);
      toast.success('تم نسخ الامتحان بنجاح');
      setShowCopyModal(false);
      fetchExams();
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل نسخ الامتحان'));
    } finally {
      setIsLoading(false);
    }
  };

  // دالة عرض النتائج مع Pagination
  const handleViewResults = async (exam, page = 0) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.exams.getExamResults(exam.id, page, resultsSize);
      setExamResults(response.data);
      setResultsPage(response.data.number || 0);
      setResultsTotalPages(response.data.totalPages || 0);
      setSelectedExam(exam);
      setShowResultsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل تحميل النتائج'));
    } finally {
      setIsLoading(false);
    }
  };

  // دالة التصحيح اليدوي
  const handleGradeSubmission = async () => {
    try {
      setIsLoading(true);
      await adminAPI.exams.gradeSubmission(gradingSubmission.submissionId, gradeValue, feedback);
      toast.success('تم حفظ التصحيح');
      setShowGradeModal(false);
      // إعادة تحميل النتائج
      if (selectedExam) handleViewResults(selectedExam, resultsPage);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في حفظ التصحيح'));
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
        <div className="grid md:grid-cols-5 gap-3 grid-cols-1">
          {/* Lesson Filter */}
          <select
            value={selectedLessonFilter}
            onChange={(e) => setSelectedLessonFilter(e.target.value)}
            className="w-full px-4 py-3 md:col-span-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">اختر درس</option>
            {courses.map((course) => {
              const courseLessons = lessons.filter(
                (lesson) => lesson.courseId === course.id
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
          <button
            onClick={() => setSelectedLessonFilter("")}
            disabled={!selectedLessonFilter}
            className="bg-accent flexCenter gap-2 text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
          >
            <FiX className="w-4 h-4" />
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse"
            >
              <div className="h-5 sm:h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded w-full sm:w-12"></div>
              </div>
            </div>
          ))
        ) : filteredExams.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">
              {selectedLessonFilter
                ? "لا توجد امتحانات للدرس المحدد"
                : "الرجاء اختيار درس لعرض الامتحانات"}
            </p>
            {!selectedLessonFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
              >
                إنشاء أول امتحان
              </button>
            )}
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              {/* Exam Header */}
              <div className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                  <div className="flex-1">
                    <h3 className="bold-16 sm:bold-18 text-gray-900 mb-2">
                      {exam.title}
                    </h3>
                    <p className="regular-12 sm:regular-14 text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                      {exam.lessonName || "درس غير محدد"}
                    </p>
                  </div>
                </div>

                {/* Exam Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <FiClock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                    <span className="regular-10 sm:regular-12 text-gray-600">
                      {exam.timeLimitMinutes} دقيقة
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiAward className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span className="regular-10 sm:regular-12 text-gray-600">
                      {exam.passingScore}% للنجاح
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiBook className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                    <span className="regular-10 sm:regular-12 text-gray-600">
                      {exam.questions?.length || 0} سؤال
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleViewResults(exam)}
                    className="flex-1 bg-blue-50 text-blue-600 py-3 border border-blue-600 px-2 sm:px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-1 sm:gap-2 cursor-pointer text-sm"
                  >
                    <FiBarChart className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">النتائج</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedExam(exam);
                      setShowEditModal(true);
                    }}
                    className="flex-1 bg-green-50 text-green-600 py-3 border border-green-600 px-2 sm:px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-1 sm:gap-2 cursor-pointer text-sm"
                  >
                    <FiEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">تعديل</span>
                  </button>
                  {/* <button
                    onClick={() => {
                      setCopyExamData({ examId: exam.id, targetLessonId: '' });
                      setShowCopyModal(true);
                    }}
                    className="flex-1 bg-purple-50 text-purple-600 py-3 border border-purple-600 px-2 sm:px-4 rounded-lg hover:bg-purple-100 transition-colors flexCenter gap-1 sm:gap-2 cursor-pointer text-sm"
                  >
                    <FiCopy className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">نسخ</span>
                  </button> */}
                  <button
                    onClick={() => openDeleteModal(exam)}
                    className="bg-red-50 flex-1 text-red-600 border border-red-600 py-3 px-2 sm:px-4 rounded-lg hover:bg-red-100 transition-colors cursor-pointer flexCenter"
                  >
                    <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline ml-1">حذف</span>
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
          onClose={() => {
            setShowCreateModal(false);
            setErrors({});
          }}
          onSubmit={handleCreateExam}
          lessons={lessons}
          courses={courses}
          isLoading={isLoading}
          errors={errors}
          setErrors={setErrors}
        />
      )}

      {/* Edit Exam Modal */}
      {showEditModal && selectedExam && (
        <ExamCreationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExam(null);
            setErrors({});
          }}
          onSubmit={handleUpdateExam}
          lessons={lessons}
          courses={courses}
          initialData={selectedExam}
          isLoading={isLoading}
          isEdit={true}
          errors={errors}
          setErrors={setErrors}
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
          page={resultsPage}
          totalPages={resultsTotalPages}
          onPageChange={(p) => handleViewResults(selectedExam, p)}
          onGrade={(submission) => {
            setGradingSubmission(submission);
            setGradeValue(submission.totalScore || '');
            setFeedback('');
            setShowGradeModal(true);
          }}
        />
      )}

      {/* Grade Submission Modal */}
      {showGradeModal && gradingSubmission && (
        <div className="fixed inset-0 bg-black/50 flexCenter z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="bold-24 mb-4">تصحيح يدوي</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">الدرجة (%)</label>
                <input
                  type="number"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleGradeSubmission} disabled={isLoading} className="flex-1 bg-accent text-white py-2 rounded-lg hover:bg-opacity-90">حفظ</button>
              <button onClick={() => setShowGradeModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">إلغاء</button>
            </div>
          </div>
        </div>
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

      {/* Copy Exam Modal */}
      {/* {showCopyModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="bold-24 mb-4">نسخ الامتحان</h2>
            <select
              value={copyExamData.targetLessonId}
              onChange={(e) => setCopyExamData({ ...copyExamData, targetLessonId: e.target.value })}
              className="w-full p-3 border rounded-lg mb-4"
            >
              <option value="">اختر الدرس الهدف</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={handleCopyExam} disabled={!copyExamData.targetLessonId || isLoading} className="flex-1 bg-accent text-white py-2 rounded-lg">نسخ</button>
              <button onClick={() => setShowCopyModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

// Exam Results Modal Component
const ExamResultsModal = ({ isOpen, onClose, exam, results, page, totalPages, onPageChange, onGrade }) => {
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
                {results.totalSubmissions || 0}
              </div>
              <div className="text-sm text-blue-600">إجمالي المحاولات</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {results.passedCount || 0}
              </div>
              <div className="text-sm text-green-600">عدد الناجحين</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {results.passRate?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-purple-600">معدل النجاح</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {results.averageScore?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-orange-600">المتوسط العام</div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="mt-8">
            <h3 className="bold-18 text-gray-900 mb-4">نتائج الطلاب</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-right">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500">الطالب</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500">الدرجة</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500">الحالة</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(results.content || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">لا توجد محاولات لهذا الاختبار بعد</td>
                    </tr>
                  ) : (
                    (results.content || []).map(submission => (
                      <tr key={submission.submissionId}>
                        <td className="px-6 py-4 whitespace-nowrap">{submission.studentFullname || submission.studentUsername}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{submission.totalScore}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${submission.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {submission.passed ? 'ناجح' : 'راسب'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => onGrade(submission)} className="text-accent hover:underline cursor-pointer">تصحيح يدوي</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`px-3 py-1 rounded ${page === i ? 'bg-accent text-white' : 'bg-gray-200 hover:bg-gray-300'} cursor-pointer`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question Statistics */}
          {results.questionStats && results.questionStats.length > 0 && (
            <div className="mt-12">
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
                            width: `${(questionStat.correctCount / (questionStat.totalAttempts || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {(
                          (questionStat.correctCount /
                            (questionStat.totalAttempts || 1)) *
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
