"use client";

import React, { useState, useEffect, useCallback } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { Slide } from "react-toastify";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VideoUpload from "../../components/VideoUpload";
import VideoFileSelector from "../../components/VideoFileSelector";
import {
  FiPlus,
  FiEdit,
  FiEye,
  FiFileText,
  FiPlay,
  FiX,
  FiBook,
} from "react-icons/fi";
import Image from "next/image";
import { MdDeleteForever } from "react-icons/md";
import { getInstructorId, getRolePermissions } from "../../utils/roleHelpers";
import SecureSearchInput from "@/app/components/SecureSearchInput";

const InstructorLessonManagement = () => {
  const { user } = useUserData();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [lessonStatusCache, setLessonStatusCache] = useState({});
  const [lessonStatus, setLessonStatus] = useState({
    hasExam: false,
    hasAssignment: false,
    isLoading: false,
  });

  const instructorId = getInstructorId(user);
  const permissions = getRolePermissions(user?.role);

  // Form states
  const [lessonForm, setLessonForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    price: "",
    free: false,
    videoUrl: "",
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
    if (instructorId) {
      fetchCourses();
    }
  }, [instructorId]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons();
    } else {
      setLessons([]);
    }
  }, [selectedCourse]);

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
    if (!selectedCourse) {
      setLessons([]);
      setOriginalLessons([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await instructorAPI.courses.getLessons(selectedCourse);

      // Validate and filter the response data
      const lessonsData = (response.data || [])
        .filter((lesson) => lesson && lesson.id) // Ensure lesson exists and has an id
        .map((lesson) => ({
          id: lesson.id,
          name: lesson.name || "Untitled Lesson",
          description: lesson.description || "",
          photoUrl: lesson.photoUrl || null,
          price: lesson.price || "0",
          videoUrl: lesson.videoUrl || "",
          videoId: lesson.videoId || "",
          courseName: lesson.courseName || "No Course",
          // Add any other required fields with defaults
        }));

      setLessons(lessonsData);
      setOriginalLessons(lessonsData);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الدروس"));
      setLessons([]);
      setOriginalLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();

    if (!permissions.canCreateLesson) {
      toast.error("ليس لديك صلاحية لإنشاء درس جديد");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Creating lesson...");

      let res;
      if (selectedVideoFile) {
        console.log("Uploading with video...");
        const formData = new FormData();
        formData.append("file", selectedVideoFile);
        formData.append("name", lessonForm.name);
        formData.append("description", lessonForm.description);
        formData.append("price", lessonForm.free ? "0" : lessonForm.price);
        formData.append("free", lessonForm.free.toString());
        if (lessonForm.photoUrl)
          formData.append("photoUrl", lessonForm.photoUrl);
        formData.append("courseId", lessonForm.courseId);

        res = await instructorAPI.lessons.createWithVideo(
          lessonForm.courseId,
          formData,
          (progress) => {
            console.log("Upload progress:", progress);
            setUploadProgress(progress);
          }
        );
      } else {
        console.log("Uploading without video...");
        res = await instructorAPI.lessons.create(
          lessonForm.courseId,
          lessonForm
        );
      }

      console.log("API response:", res); // 👈 check if this logs
      toast.success("تم إنشاء الدرس بنجاح");
      setShowCreateModal(false);
      setLessonForm({
        name: "",
        description: "",
        photoUrl: "",
        price: "",
        free: false,
        videoUrl: "",
        videoId: "",
        courseId: "",
      });
      setSelectedVideoFile(null);
      fetchLessons();
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast.error(handleAPIError(error, "فشل في إنشاء الدرس"));
    } finally {
      console.log("Finally block hit"); // 👈 check if this logs
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();

    if (!permissions.canEditLesson) {
      toast.error("ليس لديك صلاحية لتعديل الدرس");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      if (editVideoFile) formData.append("file", editVideoFile);
      formData.append("name", editForm.name);
      formData.append("description", editForm.description);
      formData.append("price", editForm.price);
      if (editForm.photoUrl) formData.append("photoUrl", editForm.photoUrl);

      const response = await instructorAPI.lessons.update(
        instructorId,
        selectedLesson.id,
        formData
      );

      // ✅ the backend wraps lesson inside `lesson`
      const lesson = response.lesson;

      const updatedLesson = {
        ...lesson,
        description: lesson.description || "",
        photoUrl: lesson.photoUrl || "",
        price: lesson.price?.toString() || "",
        videoUrl: lesson.videoUrl || "",
        videoId: lesson.bunnyVideoId || lesson.videoId || "",
      };

      setLessons((prev) =>
        prev.map((l) => (l.id === selectedLesson.id ? updatedLesson : l))
      );
      setOriginalLessons((prev) =>
        prev.map((l) => (l.id === selectedLesson.id ? updatedLesson : l))
      );
      setSelectedLesson(updatedLesson);

      toast.success("تم تحديث الدرس بنجاح");
      setShowEditModal(false);
      setEditVideoFile(null);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الدرس"));
      fetchLessons();
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search to avoid excessive filtering
  const [originalLessons, setOriginalLessons] = useState([]);

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      setLessons(originalLessons);
      return;
    }

    const filteredLessons = originalLessons.filter(
      (lesson) =>
        lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setLessons(filteredLessons);
  }, [searchTerm, originalLessons]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  // Cache lesson status to avoid repeated API calls

  const fetchLessonStatus = async (lessonId) => {
    // Check cache first
    if (lessonStatusCache[lessonId]) {
      setLessonStatus(lessonStatusCache[lessonId]);
      return;
    }

    try {
      setLessonStatus((prev) => ({ ...prev, isLoading: true }));

      const [examResponse, assignmentResponse] = await Promise.all([
        instructorAPI.lessons.hasExam(lessonId),
        instructorAPI.lessons.hasAssignment(lessonId),
      ]);

      const status = {
        hasExam: examResponse.data || false,
        hasAssignment: assignmentResponse.data || false,
        isLoading: false,
      };

      setLessonStatus(status);
      // Cache the result
      setLessonStatusCache((prev) => ({ ...prev, [lessonId]: status }));
    } catch (error) {
      toast.error("خطأ في احضار حالة الحصص");
      const errorStatus = {
        hasExam: false,
        hasAssignment: false,
        isLoading: false,
      };
      setLessonStatus(errorStatus);
      setLessonStatusCache((prev) => ({ ...prev, [lessonId]: errorStatus }));
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

  const handleDeleteLesson = (lesson) => {
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;

    if (!permissions.canDeleteLesson) {
      toast.error("ليس لديك صلاحية لحذف الدرس");
      return;
    }

    try {
      setIsLoading(true);

      // Optimistically remove the lesson from state
      setLessons((prevLessons) =>
        prevLessons.filter((lesson) => lesson.id !== lessonToDelete.id)
      );
      setOriginalLessons((prevLessons) =>
        prevLessons.filter((lesson) => lesson.id !== lessonToDelete.id)
      );

      await instructorAPI.lessons.delete(instructorId, lessonToDelete.id);

      toast.success("تم حذف الدرس بنجاح");
      setShowDeleteModal(false);
      setLessonToDelete(null);
    } catch (error) {
      // If error occurs, revert the optimistic update
      fetchLessons(); // Fall back to refetching
      toast.error(handleAPIError(error, "فشل في حذف الدرس"));
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeleteLesson = () => {
    setShowDeleteModal(false);
    setLessonToDelete(null);
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
        transition={Slide}
        className={`z-50`}
      />
      {/* Header */}
      <div className="flex items-center flex-col gap-5 md:flex-row md:gap-0 justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">
            إدارة الدروس{" "}
            {user?.role === "ASSISTANT" && `- مساعد ${user.instructorName}`}
          </h1>
          <p className="regular-16 text-gray-600">
            إنشاء وتعديل وإدارة دروسك التعليمية
          </p>
        </div>
        {permissions.canCreateLesson && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer bg-secondary text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
          >
            <FiPlus className="w-5 h-5" />
            إنشاء درس جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="md:col-span-3 flex">
            <SecureSearchInput
              placeholder="البحث في الدروس..."
              onSearch={(term) => setSearchTerm(term)}
              className="border border-gray-300 focus:ring-secondary"
              maxLength={100}
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-3 border md:col-span-3  md:flex-0 border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
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
            className="cursor-pointer md:col-span-1 md:flex-0 bg-secondary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Lessons Grid */}
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
        ) : lessons.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600 mb-4">
              {selectedCourse
                ? "لا توجد دروس في هذا الكورس"
                : "اختر كورساً لعرض الدروس"}
            </p>
            {selectedCourse && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="cursor-pointer bg-secondary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
              >
                إنشاء أول درس
              </button>
            )}
          </div>
        ) : (
          lessons.map((lesson, index) => (
            <div
              key={lesson.id || lesson._id || index}
              className="bg-white rounded-lg flex flex-col shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              {/* Lesson Image/Video Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 relative">
                {lesson.photoUrl ? (
                  <>
                    {/* Price Tag - Absolute positioned on top-left */}
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
                      <span>{lesson.price || 0}</span>
                      <span className="text-xs ">ج.م</span>{" "}
                      {/* Saudi Riyal symbol */}
                    </div>

                    <Image
                      src={lesson.photoUrl}
                      width={300}
                      height={192}
                      alt={lesson.name}
                      className="w-full h-full object-cover"
                    />
                  </>
                ) : (
                  <div className="w-full h-full flexCenter">
                    <FiPlay className="w-16 h-16 text-white opacity-50" />
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
                      fetchLessonStatus(lesson.id);
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
                    onClick={() => handleDeleteLesson(lesson)}
                    className="cursor-pointer flex-1 bg-red-50 text-red-400 py-2 border border-red-300 px-4 rounded-lg hover:bg-red-100 transition-colors flexCenter gap-2"
                  >
                    <MdDeleteForever className="w-5 h-5" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء درس جديد</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="أدخل وصف الدرس"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block bold-14 text-gray-900 mb-2">
                    السعر {lessonForm.free ? "(مجاني)" : "*"}
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
                    disabled={lessonForm.free}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                      lessonForm.free ? "bg-gray-100" : ""
                    }`}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
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
                  className="cursor-pointer flex-1 bg-secondary text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري الإنشاء..." : "إنشاء الدرس"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isLoading}
                  className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={() => setShowEditModal(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  اسم الدرس *
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
                  وصف الدرس
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
                  السعر *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  فيديو الدرس *
                </label>
                <VideoUpload
                  onVideoUploaded={(videoData) =>
                    handleVideoUploaded(videoData, true)
                  }
                  onVideoRemoved={() => handleVideoRemoved(true)}
                  currentVideoId={editForm.videoId}
                  currentVideoUrl={editForm.videoUrl}
                  isRequired={true}
                  uploadAPI={instructorAPI.videos}
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">
                  رابط صورة الدرس
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
                  {isLoading ? "جاري التحديث..." : "تحديث الدرس"}
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

      {/* View Lesson Modal */}
      {showViewModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تفاصيل الدرس</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Lesson Image/Video */}
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg overflow-hidden">
                {selectedLesson.photoUrl ? (
                  <img
                    src={selectedLesson.photoUrl}
                    alt={selectedLesson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flexCenter">
                    <FiPlay className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </div>

              {/* Lesson Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="bold-18 text-gray-900 mb-2">
                    {selectedLesson.name}
                  </h3>
                  <p className="regular-14 text-gray-600">
                    {selectedLesson.description || "لا يوجد وصف متاح"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="regular-12 text-gray-500 mb-1">السعر</p>
                    <p className="bold-14 text-gray-900">
                      {selectedLesson.price || "مجاني"} جنيه
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="regular-12 text-gray-500 mb-1">الكورس</p>
                    <p className="bold-14 text-gray-900">
                      {selectedLesson.courseName || "غير محدد"}
                    </p>
                  </div>
                </div>

                {/* Lesson Components Details */}
                <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
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
                      <FiFileText className="w-4 h-4 text-blue-500" />
                      <span className="regular-12 text-gray-500">الامتحان</span>
                    </div>
                    {lessonStatus.isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="regular-12 text-gray-500">
                          جاري التحميل...
                        </span>
                      </div>
                    ) : (
                      <p
                        className={`bold-14 text-center md:text-right ${
                          lessonStatus.hasExam
                            ? "text-blue-700"
                            : "text-gray-500"
                        }`}
                      >
                        {lessonStatus.hasExam ? "✓ متوفر" : "✗ غير متوفر"}
                      </p>
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
                      <FiFileText className="w-4 h-4 text-purple-500" />
                      <span className="regular-12 text-gray-500">الواجب</span>
                    </div>
                    {lessonStatus.isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                        <span className="regular-12 text-gray-500">
                          جاري التحميل...
                        </span>
                      </div>
                    ) : (
                      <p
                        className={`bold-14 text-center md:text-right ${
                          lessonStatus.hasAssignment
                            ? "text-purple-700"
                            : "text-gray-500"
                        }`}
                      >
                        {lessonStatus.hasAssignment ? "✓ متوفر" : "✗ غير متوفر"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && lessonToDelete && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <MdDeleteForever className="h-6 w-6 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="bold-18 text-gray-900 mb-2">تأكيد حذف الدرس</h3>

              {/* Message */}
              <p className="regular-16 text-gray-600 mb-2">
                هل أنت متأكد من حذف درس "{lessonToDelete.name}"؟
              </p>
              <p className="regular-14 text-red-600 mb-6">
                سيتم حذف جميع المحتوى المرتبط بهذا الدرس (الفيديو، الامتحان،
                الواجب) نهائ ولا يمكن التراجع عن هذا الإجراء.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteLesson}
                  disabled={isLoading}
                  className="cursor-pointer flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "جاري الحذف..." : "تأكيد الحذف"}
                </button>
                <button
                  onClick={cancelDeleteLesson}
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

export default InstructorLessonManagement;
