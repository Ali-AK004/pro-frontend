import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiBook,
  FiUser,
  FiEye,
  FiX,
  FiImage,
} from "react-icons/fi";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    instructorId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.courses.getAll();
      // Handle paginated response
      setCourses(response.data?.content || response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await adminAPI.users.getAllInstructors();
      // Handle both paginated and non-paginated responses
      setInstructors(response.data?.content || response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل المدرسين"));
      setInstructors([]);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.courses.create(courseForm.instructorId, courseForm);
      toast.success("تم إنشاء الكورس بنجاح");
      setShowCreateModal(false);
      setCourseForm({
        name: "",
        description: "",
        photoUrl: "",
        instructorId: "",
      });
      fetchCourses();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الكورس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.courses.update(selectedCourse.id, editForm);
      toast.success("تم تحديث الكورس بنجاح");
      setShowEditModal(false);
      fetchCourses();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الكورس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف هذا الكورس؟ سيتم حذف جميع الدروس المرتبطة به."
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await adminAPI.courses.delete(courseId);
      toast.success("تم حذف الكورس بنجاح");
      fetchCourses();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الكورس"));
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة الكورسات</h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة الكورسات التعليمية
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
        >
          <FiPlus className="w-5 h-5" />
          إنشاء كورس جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الكورسات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <p className="regular-16 text-gray-600">لا توجد كورسات للعرض</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
            >
              إنشاء أول كورس
            </button>
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              {/* Course Image */}
              <div className="h-48 bg-gradient-to-br from-accent to-secondary relative">
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
              <div className="p-6">
                <h3 className="bold-18 text-gray-900 mb-2 line-clamp-2">
                  {course.name}
                </h3>
                <p className="regular-14 text-gray-600 mb-4 line-clamp-3">
                  {course.description || "لا يوجد وصف متاح"}
                </p>

                {/* Course Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FiUser className="w-4 h-4" />
                    <span>{course.instructor?.fullname || "غير محدد"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiBook className="w-4 h-4" />
                    <span>{course.lessonCount || 0} درس</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowViewModal(true);
                    }}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-2"
                  >
                    <FiEye className="w-4 h-4" />
                    عرض
                  </button>
                  <button
                    onClick={() => openEditModal(course)}
                    className="flex-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-2"
                  >
                    <FiEdit className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
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

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء كورس جديد</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  المدرس المسؤول *
                </label>
                <select
                  required
                  value={courseForm.instructorId}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      instructorId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">اختر المدرس</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.fullname || instructor.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري الإنشاء..." : "إنشاء الكورس"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تعديل الكورس</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري التحديث..." : "تحديث الكورس"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تفاصيل الكورس</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Course Image */}
              <div className="h-48 bg-gradient-to-br from-accent to-secondary rounded-lg overflow-hidden">
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

              {/* Course Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="bold-18 text-gray-900 mb-2">
                    {selectedCourse.name}
                  </h3>
                  <p className="regular-14 text-gray-600">
                    {selectedCourse.description || "لا يوجد وصف متاح"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="regular-12 text-gray-500 mb-1">المدرس</p>
                    <p className="bold-14 text-gray-900">
                      {selectedCourse.instructor?.fullname || "غير محدد"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="regular-12 text-gray-500 mb-1">عدد الدروس</p>
                    <p className="bold-14 text-gray-900">
                      {selectedCourse.lessonCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
