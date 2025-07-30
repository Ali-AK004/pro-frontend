"use client";

import React, { useState, useEffect } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { MdDeleteForever } from "react-icons/md";
import { Slide } from "react-toastify";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiEye,
  FiBook,
  FiFileText,
  FiX,
  FiDelete,
} from "react-icons/fi";
import Link from "next/link";
import { getInstructorId, getRolePermissions } from "../../utils/roleHelpers";

const InstructorCourseManagement = () => {
  const { user } = useUserData();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const instructorId = getInstructorId(user);
  const permissions = getRolePermissions(user?.role);

  // Add this check to ensure assistants have proper restrictions
  const canCreateCourse =
    permissions.canCreateCourse && user?.role !== "ASSISTANT";
  const canEditCourse = permissions.canEditCourse && user?.role !== "ASSISTANT";
  const canDeleteCourse =
    permissions.canDeleteCourse && user?.role !== "ASSISTANT";

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });

  useEffect(() => {
    if (instructorId) {
      fetchCourses();
    }
  }, [instructorId]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response =
        await instructorAPI.courses.getByInstructor(instructorId);
      setCourses(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    if (!permissions.canCreateCourse) {
      toast.error("ليس لديك صلاحية لإنشاء كورس جديد");
      return;
    }

    try {
      setIsLoading(true);
      await instructorAPI.courses.create(instructorId, courseForm);
      toast.success("تم إنشاء الكورس بنجاح");
      setShowCreateModal(false);
      setCourseForm({ name: "", description: "", photoUrl: "" });
      fetchCourses();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الكورس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();

    if (!permissions.canEditCourse) {
      toast.error("ليس لديك صلاحية لتعديل الكورس");
      return;
    }

    try {
      setIsLoading(true);
      await instructorAPI.courses.update(
        instructorId,
        selectedCourse.id,
        editForm
      );
      toast.success("تم تحديث الكورس بنجاح");
      setShowEditModal(false);
      fetchCourses();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الكورس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      fetchCourses();
      return;
    }

    const filteredCourses = courses.filter(
      (course) =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setCourses(filteredCourses);
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setEditForm({
      name: course.name,
      description: course.description || "",
      photoUrl: course.photoUrl || "",
    });
    setShowEditModal(true);
  };

  const openViewModal = (course) => {
    setSelectedCourse(course);
    setShowViewModal(true);
  };

  const handleDeleteCourse = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    if (!permissions.canDeleteCourse) {
      toast.error("ليس لديك صلاحية لحذف الكورس");
      return;
    }

    try {
      setIsLoading(true);
      await instructorAPI.courses.delete(instructorId, courseToDelete.id);
      toast.success("تم حذف الكورس بنجاح");
      fetchCourses();
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الكورس"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeleteCourse = () => {
    setShowDeleteModal(false);
    setCourseToDelete(null);
  };

  return (
    <div className="p-4 md:p-8">
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
        theme="dark"
        transition={Slide}
        className={`z-50`}
      />
      {/* Header */}
      <div className="flex items-center flex-col gap-5 md:flex-row md:gap-0 justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">
            إدارة الكورسات{" "}
            {user?.role === "ASSISTANT" && `- مساعد ${user.instructorName}`}
          </h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة كورساتك التعليمية
          </p>
        </div>
        {canCreateCourse && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <FiPlus className="w-5 h-5" />
            إنشاء كورس جديد
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الكورسات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="cursor-pointer bg-secondary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
            >
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-6 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="bg-gray-200 h-8 rounded flex-1"></div>
                <div className="bg-gray-200 h-8 rounded flex-1"></div>
              </div>
            </div>
          ))
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600 mb-4">
              لا توجد كورسات للعرض
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer bg-secondary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
            >
              إنشاء أول كورس
            </button>
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg flex flex-col shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              {/* Course Image */}
              <div className="h-48 bg-gradient-to-br from-secondary to-accent relative">
                {course.photoUrl ? (
                  <img
                    src={course.photoUrl}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flexCenter">
                    <FiBook className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </div>

              {/* Course Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flexBetween flex-1">
                  <div className="flex flex-col">
                    <h3 className="bold-18 text-gray-900 mb-2 line-clamp-2">
                      {course.name}
                    </h3>
                    <p className="regular-14 text-gray-600 max-w-[250px] mb-4 line-clamp-3">
                      {course.description || "لا يوجد وصف متاح"}
                    </p>
                  </div>
                  {/* Course Stats */}
                  <div className="text-sm min-w-[80px] text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiFileText className="w-4 h-4" />
                      <span>{course.lessonCount || 0} درس</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions - Moved to bottom */}
              <div className="p-4 pt-0 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openViewModal(course)}
                    className="cursor-pointer flex-1 bg-blue-50 text-blue-600 border border-blue-300 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-2"
                  >
                    <FiEye className="w-4 h-4" />
                    عرض
                  </button>
                  {canEditCourse && (
                    <button
                      onClick={() => openEditModal(course)}
                      className="cursor-pointer flex-1 bg-green-50 text-green-600 border border-green-300 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-2"
                    >
                      <FiEdit className="w-4 h-4" />
                      تعديل
                    </button>
                  )}
                  {canDeleteCourse && (
                    <button
                      onClick={() => handleDeleteCourse(course)}
                      className="cursor-pointer flex-1 bg-red-50 text-red-400 py-2 border border-red-300 px-4 rounded-lg hover:bg-red-100 transition-colors flexCenter gap-2"
                    >
                      <MdDeleteForever className="w-5 h-5" />
                      حذف
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء كورس جديد</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  اسم الكورس *
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.name}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="أدخل اسم الكورس"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  وصف الكورس
                </label>
                <textarea
                  rows={4}
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="أدخل وصف الكورس"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  رابط صورة الكورس
                </label>
                <input
                  type="url"
                  value={courseForm.photoUrl}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, photoUrl: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer flex-1 bg-secondary hover:bg-[#6cb3ff] text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري الإنشاء..." : "إنشاء الكورس"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تعديل الكورس</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  اسم الكورس *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  وصف الكورس
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  رابط صورة الكورس
                </label>
                <input
                  type="url"
                  value={editForm.photoUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, photoUrl: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer flex-1 bg-secondary text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري التحديث..." : "تحديث الكورس"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Course Modal */}
      {showViewModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تفاصيل الكورس</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Course Header */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Course Image */}
                <div className="w-full md:w-1/3">
                  <div className="h-48 bg-gradient-to-br from-secondary to-accent rounded-lg overflow-hidden">
                    {selectedCourse.photoUrl ? (
                      <img
                        src={selectedCourse.photoUrl}
                        alt={selectedCourse.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flexCenter">
                        <FiBook className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="bold-24 text-gray-900 mb-2">
                      {selectedCourse.name}
                    </h3>
                    <p className="regular-16 text-gray-600 leading-relaxed">
                      {selectedCourse.description || "لا يوجد وصف متاح"}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {selectedCourse.lessonCount || 0}
                      </div>
                      <div className="text-sm text-blue-600">درس</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="grid grid-cols-1 gap-6">
                {/* Course Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="bold-18 text-gray-900 mb-4 flex items-center gap-2">
                    <FiBook className="w-5 h-5" />
                    معلومات الكورس
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="regular-14 text-gray-600">
                        تاريخ الإنشاء:
                      </span>
                      <span className="bold-14 text-gray-900">
                        {selectedCourse.createdAt
                          ? new Date(
                              selectedCourse.createdAt
                            ).toLocaleDateString("ar-EG")
                          : "غير محدد"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="cursor-pointer bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-[600px] mx-4">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <MdDeleteForever className="h-6 w-6 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="bold-18 text-gray-900 mb-2">تأكيد حذف الكورس</h3>

              {/* Message */}
              <p className="regular-16 text-gray-600 mb-4">
                هل أنت متأكد من حذف كورس "{courseToDelete.name}"؟
              </p>
              <p className="regular-14 text-red-600 mb-6">
                سيتم حذف جميع الدروس والمحتوى المرتبط بهذا الكورس نهائ ولا يمكن
                التراجع عن هذا الإجراء.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteCourse}
                  disabled={isLoading}
                  className="cursor-pointer flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "جاري الحذف..." : "تأكيد الحذف"}
                </button>
                <button
                  onClick={cancelDeleteCourse}
                  className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorCourseManagement;
