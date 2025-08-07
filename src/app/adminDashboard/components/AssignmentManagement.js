import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { assignmentAPI } from "../../services/assignmentAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiX,
  FiFileText,
  FiClock,
  FiAward,
  FiUsers,
  FiCalendar,
  FiAlertCircle,
} from "react-icons/fi";
import AssignmentCreationModal from "./Modal/AssignmentCreationModal";

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [selectedLessonFilter, setSelectedLessonFilter] = useState("");
  const [allAssignments, setAllAssignments] = useState([]);

  useEffect(() => {
    fetchLessons();
    fetchAssignments();
  }, [selectedLesson]);

  useEffect(() => {
    if (selectedLessonFilter) {
      const filtered = allAssignments.filter(
        (assignment) => assignment.lessonId === selectedLessonFilter
      );
      setAssignments(filtered);
    } else {
      setAssignments([]); // Show nothing when no lesson is selected
    }
  }, [selectedLessonFilter, allAssignments]);

  const fetchLessons = async () => {
    try {
      // Get all courses first, then get lessons for each course
      const coursesResponse = await adminAPI.courses.getAll();
      const coursesData =
        coursesResponse.data?.content || coursesResponse.data || [];

      setCourses(coursesData);

      let allLessons = [];
      for (const course of coursesData) {
        try {
          const lessonsResponse = await adminAPI.lessons.getByCourse(course.id);
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

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.assignments.getAll();
      const assignmentsData = response.data?.content || [];
      setAllAssignments(assignmentsData);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الواجبات"));
      setAllAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async (assignmentData) => {
    try {
      setIsLoading(true);
      await adminAPI.assignments.create(
        assignmentData.lessonId,
        assignmentData
      );
      toast.success("تم إنشاء الواجب بنجاح");
      setShowCreateModal(false);
      fetchAssignments();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAssignment = async (assignmentData) => {
    try {
      setIsLoading(true);
      await adminAPI.assignments.update(assignmentData);
      toast.success("تم تحديث الواجب بنجاح");
      setShowEditModal(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (assignmentId) => {
    setAssignmentToDelete(assignmentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.assignments.delete(assignmentToDelete);
      toast.success("تم حذف الواجب بنجاح");
      fetchAssignments();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الواجب"));
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.assignments.getSubmissions(assignment.id);
      setAssignmentSubmissions(response.data?.content || []);
      setSelectedAssignment(assignment);
      setShowSubmissionsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل التسليمات"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      setIsLoading(true);
      await adminAPI.assignments.grade(submissionId, grade, feedback);
      toast.success("تم تقييم الواجب بنجاح");
      // Refresh submissions
      handleViewSubmissions(selectedAssignment);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تقييم الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center flex-col gap-5 md:flex-row md:gap-0 justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة الواجبات</h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة واجبات الدروس
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <FiPlus className="w-5 h-5" />
          إنشاء واجب جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-y-4 md:gap-4">
          {/* Lesson Filter */}
          <select
            value={selectedLessonFilter}
            onChange={(e) => setSelectedLessonFilter(e.target.value)}
            className="w-full px-4 col-span-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">اختر درس</option>
            {courses.map((course) => {
              const courseLessons = lessons.filter(
                (lesson) => lesson.courseId === course.id
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
            onClick={() => setSelectedLessonFilter("")}
            disabled={!selectedLessonFilter}
            className="bg-accent flexCenter gap-2 text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
          >
            <FiX className="w-4 h-4" />
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6 animate-pulse"
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
        ) : filteredAssignments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">لا توجد واجبات للعرض</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
            >
              إنشاء أول واجب
            </button>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onEdit={(assignment) => {
                setSelectedAssignment(assignment);
                setShowEditModal(true);
              }}
              onDelete={handleDeleteClick} // Updated to use the new handler
              onViewSubmissions={handleViewSubmissions}
            />
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <AssignmentCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAssignment}
          lessons={lessons}
          isLoading={isLoading}
        />
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <AssignmentCreationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAssignment(null);
          }}
          onSubmit={handleUpdateAssignment}
          lessons={lessons}
          initialData={selectedAssignment}
          isLoading={isLoading}
          isEdit={true}
        />
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <SubmissionsModal
          isOpen={showSubmissionsModal}
          onClose={() => {
            setShowSubmissionsModal(false);
            setSelectedAssignment(null);
            setAssignmentSubmissions([]);
          }}
          assignment={selectedAssignment}
          submissions={assignmentSubmissions}
          onGrade={handleGradeSubmission}
          isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تأكيد حذف الواجب</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAssignmentToDelete(null);
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
                  سيتم حذف الواجب وجميع التسليمات المرتبطة به بشكل دائم
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAssignmentToDelete(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg bold-16 hover:bg-red-700 transition-all duration-300 disabled:opacity-50 flexCenter gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    جاري الحذف...
                  </>
                ) : (
                  "حذف الواجب"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Assignment Card Component
const AssignmentCard = ({
  assignment,
  onEdit,
  onDelete,
  onViewSubmissions,
}) => {
  const isOverdue = assignmentAPI.validation.isOverdue(assignment.dueDate);
  const timeRemaining = assignmentAPI.validation.getTimeRemaining(
    assignment.dueDate
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
          <div className="flex items-start justify-between flex-1">
            <h3 className="bold-16 sm:bold-18 text-gray-900 flex-1">
              {assignment.title}
            </h3>
            {isOverdue && (
              <FiAlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 ml-2" />
            )}
          </div>
        </div>

        <p className="regular-12 sm:regular-14 text-gray-600 mb-3 sm:mb-4 line-clamp-2">
          {assignment.description || "لا يوجد وصف"}
        </p>

        {/* Assignment Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FiCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            <span className="regular-10 sm:regular-12 text-gray-600 truncate">
              {assignmentAPI.validation.formatDate(assignment.dueDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiAward className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
            <span className="regular-10 sm:regular-12 text-gray-600">
              {assignment.maxPoints} نقطة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiUsers className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
            <span className="regular-10 sm:regular-12 text-gray-600">
              {assignment.submissionCount || 0} تسليم
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiClock
              className={`w-3 h-3 sm:w-4 sm:h-4 ${isOverdue ? "text-red-500" : "text-orange-500"}`}
            />
            <span
              className={`regular-10 sm:regular-12 truncate ${isOverdue ? "text-red-600" : "text-gray-600"}`}
            >
              {timeRemaining}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onViewSubmissions(assignment)}
            className="flex-1/3 bg-blue-50 text-blue-600 py-2 px-2 sm:px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-1 sm:gap-2 text-sm cursor-pointer"
          >
            <FiEye className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">التسليمات</span>
          </button>
          <button
            onClick={() => onEdit(assignment)}
            className="flex-1/3 bg-green-50 text-green-600 py-2 px-2 sm:px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-1 sm:gap-2 text-sm cursor-pointer"
          >
            <FiEdit className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">تعديل</span>
          </button>
          <button
            onClick={() => onDelete(assignment.id)}
            className="bg-red-50 flex-1/3 text-red-600 py-2 px-2 sm:px-4 rounded-lg hover:bg-red-100 transition-colors flexCenter cursor-pointer"
          >
            <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1">حذف</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Submissions Modal Component
const SubmissionsModal = ({
  isOpen,
  onClose,
  assignment,
  submissions,
  onGrade,
  isLoading,
}) => {
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [gradeErrors, setGradeErrors] = useState({});

  const handleGradeSubmit = async (submissionId) => {
    const validation = assignmentAPI.validation.validateGrade(
      parseFloat(gradeValue),
      assignment.maxPoints
    );

    if (!validation.isValid) {
      setGradeErrors(validation.errors);
      return;
    }

    await onGrade(submissionId, parseFloat(gradeValue), feedback);
    setGradingSubmission(null);
    setGradeValue("");
    setFeedback("");
    setGradeErrors({});
  };

  const startGrading = (submission) => {
    setGradingSubmission(submission.submissionId);
    setGradeValue(submission.grade || "");
    setFeedback(submission.feedback || "");
    setGradeErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flexCenter z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="bold-24 text-gray-900">
            تسليمات الواجب: {assignment.title}
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
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="regular-16 text-gray-600">
                لا توجد تسليمات لهذا الواجب
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="bold-16 text-gray-900">
                        {submission.studentName}
                      </h4>
                      <p className="regular-12 text-gray-600">
                        تم التسليم:{" "}
                        {assignmentAPI.validation.formatDate(
                          submission.submissionDate
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.grade !== null ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {submission.grade} / {assignment.maxPoints}
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          غير مقيم
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="regular-14 text-gray-700">
                      {submission.submissionText}
                    </p>
                  </div>

                  {gradingSubmission === submission.submissionId ? (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block bold-12 text-gray-700 mb-2">
                            الدرجة
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={assignment.maxPoints}
                            step="0.01"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                              gradeErrors.grade
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder={`من 0 إلى ${assignment.maxPoints}`}
                          />
                          {gradeErrors.grade && (
                            <p className="mt-1 text-sm text-red-600">
                              {gradeErrors.grade}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block bold-12 text-gray-700 mb-2">
                            التعليق (اختياري)
                          </label>
                          <input
                            type="text"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                            placeholder="تعليق على الواجب"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleGradeSubmit(submission.submissionId)
                          }
                          disabled={isLoading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? "جاري الحفظ..." : "حفظ التقييم"}
                        </button>
                        <button
                          onClick={() => setGradingSubmission(null)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startGrading(submission)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      {submission.grade !== null
                        ? "تعديل التقييم"
                        : "تقييم الواجب"}
                    </button>
                  )}
                </div>
              ))}
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

export default AssignmentManagement;
