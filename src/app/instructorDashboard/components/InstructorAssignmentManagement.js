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
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);

  const instructorId = getInstructorId(user);
  const permissions = getRolePermissions(user?.role);

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
    fetchAssignments();
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

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      if (selectedLesson) {
        const response =
          await instructorAPI.assignments.getByLesson(selectedLesson);
        setAssignments(response.data || []);
      } else if (instructorId) {
        const response =
          await instructorAPI.assignments.getByInstructor(instructorId);
        setAssignments(response.data || []);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الواجبات"));
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

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الواجب؟")) {
      return;
    }

    try {
      setIsLoading(true);
      await instructorAPI.assignments.delete(assignmentId);
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
      const response = await instructorAPI.assignments.getSubmissions(
        assignment.id
      );
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
          <div className="relative">
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
              className="mt-4 bg-secondary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
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

export default InstructorAssignmentManagement;
