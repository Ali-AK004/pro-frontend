import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiPlay,
  FiDollarSign,
  FiEye,
  FiX,
  FiBook,
} from "react-icons/fi";

const LessonManagement = () => {
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  // Form states
  const [lessonForm, setLessonForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    price: "",
    videoUrl: "",
    courseId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    price: "",
    videoUrl: "",
  });

  useEffect(() => {
    fetchLessons();
    fetchCourses();
  }, [selectedCourse]);

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      if (selectedCourse) {
        const response = await adminAPI.lessons.getByCourse(selectedCourse);
        // Handle paginated response
        setLessons(response.data?.content || response.data || []);
      } else {
        // For now, if no course is selected, show empty list
        // since we don't have a "get all lessons" endpoint
        setLessons([]);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الدروس"));
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await adminAPI.courses.getAll();
      // Handle paginated response
      setCourses(response.data?.content || response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
      setCourses([]);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.lessons.create(lessonForm.courseId, lessonForm);
      toast.success("تم إنشاء الدرس بنجاح");
      setShowCreateModal(false);
      setLessonForm({
        name: "",
        description: "",
        photoUrl: "",
        price: "",
        videoUrl: "",
        courseId: "",
      });
      fetchLessons();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الدرس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.lessons.update(selectedLesson.id, editForm);
      toast.success("تم تحديث الدرس بنجاح");
      setShowEditModal(false);
      fetchLessons();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الدرس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.lessons.delete(lessonToDelete.id);
      toast.success("تم حذف الدرس بنجاح");
      setShowDeleteModal(false);
      setLessonToDelete(null);
      fetchLessons();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الدرس"));
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (lesson) => {
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      fetchLessons();
      return;
    }

    const filteredLessons = lessons.filter(
      (lesson) =>
        lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setLessons(filteredLessons);
  };

  const openEditModal = (lesson) => {
    setSelectedLesson(lesson);
    setEditForm({
      name: lesson.name,
      description: lesson.description || "",
      photoUrl: lesson.photoUrl || "",
      price: lesson.price?.toString() || "",
      videoUrl: lesson.videoUrl || "",
    });
    setShowEditModal(true);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-col md:flex-row gap-4 mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة الدروس</h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة الدروس التعليمية
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <FiPlus className="w-5 h-5" />
          إنشاء درس جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 flex relative">
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
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-3 border flex-1 md:flex-none border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">اختر كورس</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="bg-accent text-white flex-1 md:flex-none px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Lessons Grid */}
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
        ) : lessons.length === 0 ? (
          <div className="text-center col-span-full py-12">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">لا توجد دروس للعرض</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
            >
              إنشاء أول درس
            </button>
          </div>
        ) : (
          lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-lg flex flex-col shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              {/* Lesson Image/Video Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 relative">
                {lesson.photoUrl ? (
                  <img
                    src={lesson.photoUrl}
                    alt={lesson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flexCenter">
                    <FiPlay className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
                {lesson.price && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full bold-12">
                    {lesson.price} جنيه
                  </div>
                )}
              </div>

              {/* Lesson Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flexBetween flex-1">
                  <div className="flex flex-col">
                    <h3 className="bold-18 text-gray-900 mb-2 line-clamp-2">
                      {lesson.name}
                    </h3>
                    <p className="regular-14 text-gray-600 mb-4 line-clamp-3">
                      {lesson.description || "لا يوجد وصف متاح"}
                    </p>
                  </div>
                  {/* Lesson Stats */}
                  <div className="text-sm min-w-[80px] text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiBook className="w-4 h-4" />
                      <span>{lesson.courseName || "غير محدد"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions - Moved to bottom */}
              <div className="p-4 pt-0 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setShowViewModal(true);
                    }}
                    className="cursor-pointer flex-1 bg-blue-50 text-blue-600 border border-blue-300 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-2"
                  >
                    <FiEye className="w-4 h-4" />
                    عرض
                  </button>
                  <button
                    onClick={() => openEditModal(lesson)}
                    className="cursor-pointer flex-1 bg-green-50 text-green-600 border border-green-300 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-2"
                  >
                    <FiEdit className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => openDeleteModal(lesson)}
                    className="cursor-pointer flex-1 bg-red-50 text-red-400 py-2 border border-red-300 px-4 rounded-lg hover:bg-red-100 transition-colors flexCenter gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء درس جديد</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  اسم الدرس *
                </label>
                <input
                  type="text"
                  required
                  value={lessonForm.name}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="أدخل اسم الدرس"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  وصف الدرس
                </label>
                <textarea
                  rows={4}
                  value={lessonForm.description}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="أدخل وصف الدرس"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block bold-14 text-gray-900 mb-2">
                    السعر *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="5"
                    value={lessonForm.price}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, price: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block bold-14 text-gray-900 mb-2">
                    الكورس *
                  </label>
                  <select
                    required
                    value={lessonForm.courseId}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, courseId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">اختر الكورس</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  رابط الفيديو *
                </label>
                <input
                  type="url"
                  required
                  value={lessonForm.videoUrl}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, videoUrl: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  رابط صورة الدرس
                </label>
                <input
                  type="url"
                  value={lessonForm.photoUrl}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, photoUrl: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? "جاري الإنشاء..." : "إنشاء الدرس"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {showEditModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تعديل الدرس</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedLesson(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="space-y-6">
              {/* Lesson Name */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  اسم الدرس
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  وصف الدرس
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {/* Photo URL */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  رابط الصورة
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

              {/* Price */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  السعر
                </label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  min="0"
                  step="5"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  رابط الفيديو
                </label>
                <input
                  type="url"
                  value={editForm.videoUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, videoUrl: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? "جاري التحديث..." : "حفظ التغييرات"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedLesson(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Lesson Modal */}
      {showViewModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="bold-24 text-gray-900">تفاصيل الدرس</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedLesson(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lesson Image */}
                <div>
                  {selectedLesson.photoUrl ? (
                    <img
                      src={selectedLesson.photoUrl}
                      alt={selectedLesson.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flexCenter">
                      <FiPlay className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>

                {/* Lesson Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="bold-20 text-gray-900 mb-2">
                      {selectedLesson.name}
                    </h3>
                    <p className="regular-16 text-gray-600">
                      {selectedLesson.description || "لا يوجد وصف"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FiDollarSign className="w-5 h-5 text-green-500" />
                        <span className="bold-14 text-gray-700">السعر</span>
                      </div>
                      <span className="bold-18 text-green-600">
                        {selectedLesson.price
                          ? `${selectedLesson.price} ج.م`
                          : "مجاني"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FiBook className="w-5 h-5 text-blue-500" />
                        <span className="bold-14 text-gray-700">الكورس</span>
                      </div>
                      <span className="regular-14 text-gray-600">
                        {selectedLesson.courseName || "غير محدد"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedLesson(null);
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && lessonToDelete && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="bold-18 text-gray-900 mb-2">تأكيد حذف الدرس</h3>

              {/* Message */}
              <p className="regular-14 text-gray-600 mb-6">
                هل أنت متأكد من حذف درس "{lessonToDelete.name}"؟
                <br />
                <span className="text-red-600 bold-14">
                  سيتم حذف جميع المحتوى والواجبات والامتحانات المرتبطة به
                  نهائياً.
                </span>
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setLessonToDelete(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg bold-14 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteLesson}
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

export default LessonManagement;
