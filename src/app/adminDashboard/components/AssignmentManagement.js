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
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import AssignmentCreationModal from "./AssignmentCreationModal";

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);

  useEffect(() => {
    fetchLessons();
    fetchAssignments();
  }, [selectedLesson]);

  const fetchLessons = async () => {
    try {
      // Get all courses first, then get lessons for each course
      const coursesResponse = await adminAPI.courses.getAll();
      const courses =
        coursesResponse.data?.content || coursesResponse.data || [];

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

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      if (selectedLesson) {
        const response = await adminAPI.assignments.getByLesson(selectedLesson);
        setAssignments(response.data || []);
      } else {
        // Only fetch all assignments if no lesson is selected
        // For now, show empty list when no lesson is selected to avoid unnecessary API calls
        setAssignments([]);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الواجبات"));
      setAssignments([]);
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

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الواجب؟")) {
      return;
    }

    try {
      setIsLoading(true);
      await adminAPI.assignments.delete(assignmentId);
      toast.success("تم حذف الواجب بنجاح");
      fetchAssignments();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.assignments.getSubmissions(assignment.id);
      setAssignmentSubmissions(response.data || []);
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة الواجبات</h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة واجبات الدروس
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
        >
          <FiPlus className="w-5 h-5" />
          إنشاء واجب جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الواجبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          {/* Lesson Filter */}
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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

      {/* Assignments Grid */}
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
        ) : filteredAssignments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">لا توجد واجبات للعرض</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
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
              onDelete={handleDeleteAssignment}
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
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="bold-18 text-gray-900 flex-1">{assignment.title}</h3>
          {isOverdue && (
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
        </div>

        <p className="regular-14 text-gray-600 mb-4 line-clamp-2">
          {assignment.description || "لا يوجد وصف"}
        </p>

        {/* Assignment Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-blue-500" />
            <span className="regular-12 text-gray-600">
              {assignmentAPI.validation.formatDate(assignment.dueDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiAward className="w-4 h-4 text-green-500" />
            <span className="regular-12 text-gray-600">
              {assignment.maxPoints} نقطة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiUsers className="w-4 h-4 text-purple-500" />
            <span className="regular-12 text-gray-600">
              {assignment.submissionCount || 0} تسليم
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiClock
              className={`w-4 h-4 ${isOverdue ? "text-red-500" : "text-orange-500"}`}
            />
            <span
              className={`regular-12 ${isOverdue ? "text-red-600" : "text-gray-600"}`}
            >
              {timeRemaining}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewSubmissions(assignment)}
            className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-2"
          >
            <FiEye className="w-4 h-4" />
            التسليمات
          </button>
          <button
            onClick={() => onEdit(assignment)}
            className="flex-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-2"
          >
            <FiEdit className="w-4 h-4" />
            تعديل
          </button>
          <button
            onClick={() => onDelete(assignment.id)}
            className="bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="bold-24 text-gray-900">
            تسليمات الواجب: {assignment.title}
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
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? "جاري الحفظ..." : "حفظ التقييم"}
                        </button>
                        <button
                          onClick={() => setGradingSubmission(null)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startGrading(submission)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentManagement;
