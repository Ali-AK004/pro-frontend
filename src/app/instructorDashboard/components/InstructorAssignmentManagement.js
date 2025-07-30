"use client";

import React, { useState, useEffect } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { assignmentAPI } from "../../services/assignmentAPI";
import { useUserData } from "../../../../models/UserContext";
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
import AssignmentCreationModal from "../../adminDashboard/components/Modal/AssignmentCreationModal";
import { getInstructorId, getRolePermissions } from "../../utils/roleHelpers";

const InstructorAssignmentManagement = () => {
  const { user } = useUserData();
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [allLessons, setAllLessons] = useState([]); // All lessons for modal
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);

  const instructorId = getInstructorId(user);
  const permissions = getRolePermissions(user?.role);

  useEffect(() => {
    if (instructorId) {
      fetchCourses();
      fetchAllLessons(); // Fetch all lessons for modal
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
    if (selectedLesson) {
      fetchAssignments();
    } else {
      // Clear assignments when no lesson is selected
      setAssignments([]);
    }
  }, [selectedLesson]);

  const fetchCourses = async () => {
    try {
      const response =
        await instructorAPI.courses.getByInstructor(instructorId);
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

  const fetchAllLessons = async () => {
    try {
      const response =
        await instructorAPI.courses.getByInstructor(instructorId);
      const coursesData = response.data || [];

      let allLessonsData = [];
      for (const course of coursesData) {
        try {
          const lessonsResponse = await instructorAPI.courses.getLessons(
            course.id
          );
          const courseLessons = lessonsResponse.data || [];
          // Add course information to each lesson for optgroups
          const lessonsWithCourse = courseLessons.map((lesson) => ({
            ...lesson,
            courseId: course.id,
            courseName: course.name,
          }));
          allLessonsData = [...allLessonsData, ...lessonsWithCourse];
        } catch (error) {
          console.error(
            `Error fetching lessons for course ${course.id}:`,
            error
          );
        }
      }

      setAllLessons(allLessonsData);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل جميع الدروس"));
      setAllLessons([]);
    }
  };

  const fetchAssignments = async () => {
    if (!selectedLesson) {
      setAssignments([]);
      return;
    }

    try {
      setIsLoading(true);
      const response =
        await instructorAPI.assignments.getByLesson(selectedLesson);
      setAssignments(response.data || []);
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
      await instructorAPI.assignments.create(
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
      await instructorAPI.assignments.update(assignmentData);
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

  const openDeleteModal = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      setIsLoading(true);
      await instructorAPI.assignments.delete(assignmentToDelete.id);
      toast.success("تم حذف الواجب بنجاح");
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
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
      const response = await instructorAPI.assignments.getSubmissions(
        assignment.id
      );
      setAssignmentSubmissions(response.data || []);
      setSelectedAssignment(assignment);
      setShowSubmissionsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل التسليمات"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      setIsLoading(true);
      await instructorAPI.assignments.grade(submissionId, grade, feedback);
      toast.success("تم تقييم الواجب بنجاح");
      // Refresh submissions
      handleViewSubmissions(selectedAssignment);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تقييم الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  // Get all lessons for modal (always return all lessons regardless of filter)
  const getAvailableLessons = () => {
    return allLessons;
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center flex-col gap-5 sm:flex-row md:gap-0 justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة الواجبات</h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة واجبات دروسك
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-secondary text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <FiPlus className="w-5 h-5" />
          إنشاء واجب جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative flex">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الواجبات..."
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
            <option value="">اختر كورس</option>
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
            <option value="">اختر درس</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1">
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
            {!selectedLesson ? (
              <>
                <p className="regular-16 text-gray-600 mb-2">
                  اختر درساً من القائمة أعلاه لعرض الواجبات
                </p>
                <p className="regular-14 text-gray-500">
                  يمكنك البحث عن الدرس باستخدام شريط البحث
                </p>
              </>
            ) : (
              <>
                <p className="regular-16 text-gray-600">
                  لا توجد واجبات لهذا الدرس
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-secondary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
                >
                  إنشاء أول واجب
                </button>
              </>
            )}
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
              onDelete={openDeleteModal}
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
          lessons={getAvailableLessons()}
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
          lessons={getAvailableLessons()}
          initialData={selectedAssignment}
          isLoading={isLoading}
          isEdit={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && assignmentToDelete && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="bold-18 text-gray-900">تأكيد الحذف</h3>
            </div>

            <p className="regular-16 text-gray-600 mb-6">
              هل أنت متأكد من حذف الواجب "{assignmentToDelete.title}"؟
              <br />
              <span className="text-red-600 bold-14">
                لا يمكن التراجع عن هذا الإجراء.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAssignmentToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                disabled={isLoading}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteAssignment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Assignment Card Component (reused from admin)
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

        <p className="regular-14 text-gray-600 mb-4 line-clamp-2">
          {assignment.lessonName || "لا يوجد اسم درس"}
        </p>

        {/* Assignment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => onViewSubmissions(assignment)}
            className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg border border-blue-600 hover:bg-blue-100 transition-colors flexCenter gap-2 cursor-pointer"
          >
            <FiEye className="w-4 h-4" />
            التسليمات
          </button>
          <button
            onClick={() => onEdit(assignment)}
            className="flex-1 bg-green-50 text-green-600 py-2 px-4 border border-green-600 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-2 cursor-pointer"
          >
            <FiEdit className="w-4 h-4" />
            تعديل
          </button>
          <button
            onClick={() => onDelete(assignment)}
            className="bg-red-50 text-red-600 flexCenter gap-2 py-2 px-4 border border-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
          >
            <FiTrash2 className="w-4 h-4" />
            حذف
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorAssignmentManagement;
