import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import VideoUpload from "../../components/VideoUpload";
import VideoFileSelector from "../../components/VideoFileSelector";
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
  FiVideo,
  FiHash,
} from "react-icons/fi";
import Image from "next/image";

const LessonManagement = () => {
  const [lessons, setLessons] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLessonFilter, setSelectedLessonFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [lessonStatus, setLessonStatus] = useState({
    hasExam: false,
    hasAssignment: false,
    isLoading: false,
  });

  // Form states
  const [lessonForm, setLessonForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    price: "",
    videoUrl: "",
    free: false,
    videoId: "",
    courseId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    price: "",
    videoUrl: "",
    videoId: "",
  });

  // Video file states for direct upload
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [editVideoFile, setEditVideoFile] = useState(null);

  useEffect(() => {
    // Only fetch courses and all lessons for the dropdown, don't load lessons for display
    fetchCourses();
    fetchAllLessons();
  }, []);

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

  const fetchAllLessons = async () => {
    try {
      const coursesResponse = await adminAPI.courses.getAll();
      const coursesData =
        coursesResponse.data?.content || coursesResponse.data || [];

      // Fetch lessons for each course
      const allLessonsPromises = coursesData.map(async (course) => {
        try {
          const lessonsResponse = await adminAPI.lessons.getByCourse(course.id);
          const courseLessons =
            lessonsResponse.data?.content || lessonsResponse.data || [];
          // Add course information to each lesson
          return courseLessons.map((lesson) => ({
            ...lesson,
            courseName: course.name,
            courseId: course.id,
          }));
        } catch (error) {
          console.error(`Error fetching lessons for course ${course.id}:`);
          return [];
        }
      });

      const allLessonsArrays = await Promise.all(allLessonsPromises);
      const flattenedLessons = allLessonsArrays.flat();
      setAllLessons(flattenedLessons);
    } catch (error) {
      console.error("Error fetching all lessons");
      setAllLessons([]);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Check if we have a video file for direct upload
      if (selectedVideoFile) {
        // Use direct video upload endpoint
        const formData = new FormData();
        formData.append("file", selectedVideoFile);
        formData.append("name", lessonForm.name);
        formData.append("description", lessonForm.description);
        formData.append("price", lessonForm.price);
        if (lessonForm.photoUrl)
          formData.append("photoUrl", lessonForm.photoUrl);
        formData.append("videoTitle", lessonForm.name); // Use lesson name as video title
        formData.append("videoDescription", lessonForm.description);

        await adminAPI.lessons.createWithVideo(
          lessonForm.courseId,
          formData,
          (progress) => {
            setUploadProgress(progress);
          }
        );
      } else {
        // Use regular lesson creation (for URL-based videos)
        await adminAPI.lessons.create(lessonForm.courseId, lessonForm);
      }

      toast.success("تم إنشاء الدرس بنجاح");
      setShowCreateModal(false);
      setLessonForm({
        name: "",
        description: "",
        photoUrl: "",
        price: "",
        videoUrl: "",
        videoId: "",
        courseId: "",
      });
      setSelectedVideoFile(null);
      fetchAllLessons(); // Refresh the lessons dropdown data
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الدرس"));
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.lessons.update(selectedLesson.id, editForm);

      // Update the local state immediately
      setAllLessons((prevLessons) =>
        prevLessons.map((lesson) =>
          lesson.id === selectedLesson.id ? { ...lesson, ...editForm } : lesson
        )
      );

      // Also update the filtered lessons if the current lesson is in view
      setLessons((prevLessons) =>
        prevLessons.map((lesson) =>
          lesson.id === selectedLesson.id ? { ...lesson, ...editForm } : lesson
        )
      );

      toast.success("تم تحديث الدرس بنجاح");
      setShowEditModal(false);
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

      // Clear the selected lesson filter if the deleted lesson was selected
      if (selectedLessonFilter === lessonToDelete.id) {
        setSelectedLessonFilter("");
        setLessons([]); // Clear the displayed lessons immediately
      }

      fetchAllLessons(); // Refresh the lessons dropdown data
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

  // Video upload handlers
  const handleVideoUploaded = (videoData, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => ({
        ...prev,
        videoId: videoData.id,
        videoUrl: videoData.streamingUrl || videoData.playbackUrl || "",
      }));
    } else {
      setLessonForm((prev) => ({
        ...prev,
        videoId: videoData.id,
        videoUrl: videoData.streamingUrl || videoData.playbackUrl || "",
      }));
    }
    toast.success("تم رفع الفيديو بنجاح");
  };

  const handleVideoRemoved = (isEdit = false) => {
    if (isEdit) {
      setEditVideoFile(null);
      setEditForm((prev) => ({
        ...prev,
        videoId: "",
        videoUrl: "",
      }));
    } else {
      setSelectedVideoFile(null);
      setLessonForm((prev) => ({
        ...prev,
        videoId: "",
        videoUrl: "",
      }));
    }
    toast.success("تم حذف الفيديو");
  };

  // Video file selection handler for direct upload
  const handleVideoFileSelected = (file, isEdit = false) => {
    if (isEdit) {
      setEditVideoFile(file);
    } else {
      setSelectedVideoFile(file);
    }
  };

  const handleSearch = () => {
    try {
      let filteredLessons = [...allLessons];

      // Apply search term filter if it exists
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredLessons = filteredLessons.filter(
          (lesson) =>
            lesson.name.toLowerCase().includes(searchLower) ||
            lesson.description?.toLowerCase().includes(searchLower) ||
            lesson.courseName?.toLowerCase().includes(searchLower)
        );
      }

      // Apply dropdown filter if it exists
      if (selectedLessonFilter) {
        filteredLessons = filteredLessons.filter(
          (lesson) => lesson.id === selectedLessonFilter
        );
      }

      setLessons(filteredLessons);
    } catch (error) {
      toast.error("خطأ في البحث");
      setLessons([]);
    }
  };
  const fetchLessonStatus = async (lessonId) => {
    try {
      setLessonStatus((prev) => ({ ...prev, isLoading: true }));

      const [examResponse, assignmentResponse] = await Promise.all([
        adminAPI.lessons.hasExam(lessonId),
        adminAPI.lessons.hasAssignment(lessonId),
      ]);

      setLessonStatus({
        hasExam: examResponse.data || false,
        hasAssignment: assignmentResponse.data || false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching lesson status");
      setLessonStatus({
        hasExam: false,
        hasAssignment: false,
        isLoading: false,
      });
    }
  };

  const openEditModal = (lesson) => {
    setSelectedLesson(lesson);
    setEditForm({
      name: lesson.name,
      description: lesson.description || "",
      photoUrl: lesson.photoUrl || "",
      price: lesson.price?.toString() || "",
      videoUrl: lesson.videoUrl || "",
      videoId: lesson.videoId || "",
    });
    setShowEditModal(true);
  };

  return (
    <div className="p-4 lg:p-8">
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
        <div className="grid lg:gap-4 grid-cols-1 gap-y-3 lg:grid-cols-2">
          <div className="flex-1 flex relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الدروس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:w-full">
            <select
              value={selectedLessonFilter}
              onChange={(e) => {
                setSelectedLessonFilter(e.target.value);
                // Only filter by dropdown selection immediately
                if (e.target.value) {
                  const selected = allLessons.find(
                    (l) => l.id === e.target.value
                  );
                  setLessons(selected ? [selected] : []);
                } else {
                  setLessons([]);
                }
              }}
              className="px-4 py-3 md:w-3/4 border md:flex-none border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">اختر درس</option>
              {courses.map((course) => {
                // Filter lessons that belong to this course
                const courseLessons = allLessons.filter(
                  (lesson) => lesson.courseId === course.id
                );

                // Only render optgroup if course has lessons
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
              onClick={() => handleSearch()}
              className="bg-accent md:w-1/4 text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
            >
              بحث
            </button>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 animate-pulse flex flex-col sm:flex-row"
            >
              <div className="bg-gray-200 w-full h-48 sm:w-48 sm:h-32 rounded-lg flex-shrink-0"></div>
              <div className="mt-3 sm:mt-0 sm:ml-4 flex-1">
                <div className="bg-gray-200 h-5 sm:h-6 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 sm:h-4 rounded mb-3"></div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="bg-gray-200 h-8 rounded w-full sm:w-16"></div>
                  <div className="bg-gray-200 h-8 rounded w-full sm:w-16"></div>
                  <div className="bg-gray-200 h-8 rounded w-full sm:w-16"></div>
                </div>
              </div>
            </div>
          ))
        ) : lessons.length === 0 ? (
          <div className="text-center col-span-full py-12">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">
              {selectedLessonFilter
                ? "الدرس المحدد غير موجود"
                : "اختر درس محدد من القائمة المنسدلة لعرضه"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
            >
              إنشاء درس جديد
            </button>
          </div>
        ) : (
          lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-lg flex flex-col sm:flex-row shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 min-h-[200px]"
            >
              {/* Lesson Image/Video Thumbnail */}
              <div className="w-full h-48 sm:w-58 sm:h-auto bg-gradient-to-br from-purple-500 to-pink-500 relative flex-shrink-0">
                {lesson.photoUrl ? (
                  <img
                    src={lesson.photoUrl}
                    alt={lesson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flexCenter">
                    <FiPlay className="w-12 h-12 text-white opacity-50" />
                  </div>
                )}
                {lesson.price && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full bold-10">
                    {lesson.price} جنيه
                  </div>
                )}
              </div>

              {/* Lesson Content */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="flex sm:flex-row sm:justify-between sm:items-start justify-between mb-2">
                    <h3 className="bold-16 sm:bold-18 text-gray-900 line-clamp-1 mb-1 sm:mb-0">
                      {lesson.name}
                    </h3>
                    {/* Lesson Stats */}
                    <div className="text-xs sm:text-sm text-gray-500 flex flex-col gap-2 sm:ml-4">
                      <div className="flex items-center gap-1">
                        <FiBook className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">
                          {lesson.courseName || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiHash className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">
                          {lesson.id || "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="regular-12 sm:regular-14 text-gray-600 line-clamp-2 mb-3">
                    {lesson.description || "لا يوجد وصف متاح"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setShowViewModal(true);
                      fetchLessonStatus(lesson.id);
                    }}
                    className="cursor-pointer flex-1 bg-blue-50 text-blue-600 border border-blue-300 py-2 px-2 sm:px-3 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-1 text-sm"
                  >
                    <FiEye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">عرض</span>
                  </button>
                  <button
                    onClick={() => openEditModal(lesson)}
                    className="cursor-pointer flex-1 bg-green-50 text-green-600 border border-green-300 py-2 px-2 sm:px-3 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-1 text-sm"
                  >
                    <FiEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">تعديل</span>
                  </button>
                  <button
                    onClick={() => openDeleteModal(lesson)}
                    className="cursor-pointer flex-1 bg-red-50 text-red-600 border border-red-300 py-2 px-2 sm:px-3 rounded-lg hover:bg-red-100 transition-colors flexCenter gap-1 text-sm"
                  >
                    <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">حذف</span>
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
                <div className="">
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="free-lesson"
                    checked={lessonForm.free}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, free: e.target.checked })
                    }
                    className="w-4 h-4 text-accent rounded focus:ring-accent"
                  />
                  <label
                    htmlFor="free-lesson"
                    className="regular-14 text-gray-700"
                  >
                    درس مجاني
                  </label>
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
                  فيديو الدرس *
                </label>
                <VideoFileSelector
                  onFileSelected={(file) =>
                    handleVideoFileSelected(file, false)
                  }
                  onFileRemoved={() => handleVideoRemoved(false)}
                  selectedFile={selectedVideoFile}
                  isRequired={true}
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

              {/* Upload Progress */}
              {isLoading && selectedVideoFile && uploadProgress > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      جاري رفع الفيديو...
                    </span>
                    <span className="text-sm font-medium text-blue-700">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    يرجى عدم إغلاق النافذة أثناء رفع الفيديو
                  </p>
                </div>
              )}

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
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

              {/* Video Upload */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  فيديو الدرس
                </label>
                <VideoUpload
                  onVideoUploaded={(videoData) =>
                    handleVideoUploaded(videoData, true)
                  }
                  onVideoRemoved={() => handleVideoRemoved(true)}
                  currentVideoId={editForm.videoId}
                  currentVideoUrl={editForm.videoUrl}
                  isRequired={false}
                  uploadAPI={adminAPI.videos}
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
        <div className="fixed inset-0 bg-black/30 flexCenter z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden">
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
                    <Image
                      src={selectedLesson.photoUrl}
                      width={192}
                      height={192}
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

                  {/* Lesson Components Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div
                      className={`p-4 rounded-lg border ${
                        lessonStatus.isLoading
                          ? "bg-gray-50 border-gray-200"
                          : lessonStatus.hasExam
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center flex-col md:flex-row gap-2 mb-2">
                        <FiFileText className="w-5 h-5 text-blue-500" />
                        <span className="bold-14 text-gray-700">الامتحان</span>
                      </div>
                      {lessonStatus.isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="regular-14 text-gray-500">
                            جاري التحميل...
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`bold-14 text-center block md:inline-block md:text-right ${
                            lessonStatus.hasExam
                              ? "text-blue-700"
                              : "text-gray-500"
                          }`}
                        >
                          {lessonStatus.hasExam ? "✓ متوفر" : "✗ غير متوفر"}
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${
                        lessonStatus.isLoading
                          ? "bg-gray-50 border-gray-200"
                          : lessonStatus.hasAssignment
                            ? "bg-purple-50 border-purple-200"
                            : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center flex-col md:flex-row gap-2 mb-2">
                        <FiFileText className="w-5 h-5 text-purple-500" />
                        <span className="bold-14 text-gray-700">الواجب</span>
                      </div>
                      {lessonStatus.isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                          <span className="regular-14 text-gray-500">
                            جاري التحميل...
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`bold-14 text-center block md:inline-block md:text-right ${
                            lessonStatus.hasAssignment
                              ? "text-purple-700"
                              : "text-gray-500"
                          }`}
                        >
                          {lessonStatus.hasAssignment
                            ? "✓ متوفر"
                            : "✗ غير متوفر"}
                        </span>
                      )}
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
