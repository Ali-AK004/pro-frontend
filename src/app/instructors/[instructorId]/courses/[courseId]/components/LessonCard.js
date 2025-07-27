import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaPlay,
  FaLock,
  FaCheck,
  FaClock,
  FaFileAlt,
  FaQuestionCircle,
  FaShoppingCart,
  FaDollarSign,
  FaEye,
  FaBookOpen,
} from "react-icons/fa";
import {
  studentAPI,
  LessonProgressStatus,
  canAccessLessonPart,
  formatProgressStatus,
} from "../../../../../services/studentAPI";
import { adminAPI } from "../../../../../adminDashboard/services/adminAPI";
import { instructorAPI } from "../../../../../instructorDashboard/services/instructorAPI";
import { useUserData } from "../../../../../../../models/UserContext";

const LessonCard = ({ lesson, onPurchase, onViewLesson, instructorId }) => {
  const { user } = useUserData();
  const [accessStatus, setAccessStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(null);
<<<<<<< HEAD
  const [hasExam, setHasExam] = useState(false);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [componentsLoading, setComponentsLoading] = useState(true);
=======
  const [lessonStatus, setLessonStatus] = useState({
    hasExam: false,
    hasAssignment: false,
    isLoading: true,
  });
>>>>>>> f2f5225ec071e45510f8396ff03bb616ce3aa1e7

  useEffect(() => {
    checkLessonAccess();
    fetchLessonStatus();
  }, [lesson.id, user]);

<<<<<<< HEAD
  useEffect(() => {
    checkLessonComponents();
  }, [lesson.id]);

  const checkLessonComponents = async () => {
    try {
      setComponentsLoading(true);

      // Check if lesson has exam
      const examResponse = await studentAPI.lessons.hasExam(lesson.id);
      setHasExam(examResponse.data);

      // Check if lesson has assignment
      const assignmentResponse = await studentAPI.lessons.hasAssignment(
        lesson.id
      );
      setHasAssignment(assignmentResponse.data);
    } catch (error) {
      console.error("Error checking lesson components:", error);
      // Set defaults on error
      setHasExam(false);
      setHasAssignment(false);
    } finally {
      setComponentsLoading(false);
=======
  const fetchLessonStatus = async () => {
    try {
      setLessonStatus((prev) => ({ ...prev, isLoading: true }));

      // Use appropriate API based on user role
      let hasExamAPI, hasAssignmentAPI;

      if (user?.role === "ADMIN") {
        hasExamAPI = adminAPI.lessons.hasExam;
        hasAssignmentAPI = adminAPI.lessons.hasAssignment;
      } else if (user?.role === "INSTRUCTOR" || user?.role === "ASSISTANT") {
        hasExamAPI = instructorAPI.lessons.hasExam;
        hasAssignmentAPI = instructorAPI.lessons.hasAssignment;
      } else {
        // For students, we'll use the same endpoints but they might have different permissions
        hasExamAPI = adminAPI.lessons.hasExam;
        hasAssignmentAPI = adminAPI.lessons.hasAssignment;
      }

      const [examResponse, assignmentResponse] = await Promise.all([
        hasExamAPI(lesson.id),
        hasAssignmentAPI(lesson.id),
      ]);

      setLessonStatus({
        hasExam: examResponse.data || false,
        hasAssignment: assignmentResponse.data || false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching lesson status:", error);
      setLessonStatus({
        hasExam: false,
        hasAssignment: false,
        isLoading: false,
      });
>>>>>>> f2f5225ec071e45510f8396ff03bb616ce3aa1e7
    }
  };

  const checkLessonAccess = async () => {
    try {
      setIsLoading(true);

      // Check if user has enhanced access (admin, instructor, assistant)
      if (hasEnhancedAccess()) {
        setAccessStatus({ hasAccess: true, isEnhancedAccess: true });

        // For non-students, try to get lesson details using the enhanced endpoint
        try {
          const lessonDetails = await studentAPI.lessons.getLessonDetails(
            lesson.id
          );
          // For non-students, we don't need progress tracking, just set full access
          setLessonProgress({
            progressStatus: LessonProgressStatus.ASSIGNMENT_DONE, // Full access
            canAccessVideo: true,
            canAccessExam: true,
            canAccessAssignment: true,
          });
        } catch (error) {
          // If enhanced access fails, still allow access but without progress
          console.log(
            "Enhanced access granted but couldn't fetch lesson details:",
            error
          );
          setLessonProgress({
            progressStatus: LessonProgressStatus.ASSIGNMENT_DONE,
            canAccessVideo: true,
            canAccessExam: true,
            canAccessAssignment: true,
          });
        }
        return;
      }

      // For students, check normal purchase access
      const response = await studentAPI.payments.checkAccess(lesson.id);
      setAccessStatus(response.data);

      // If has access, get lesson details for progress
      if (response.data.hasAccess) {
        const lessonDetails = await studentAPI.lessons.getLessonDetails(
          lesson.id
        );
        setLessonProgress(
          lessonDetails.data.progressStatus
            ? lessonDetails.data
            : lessonDetails.data.progress
        );
      }
    } catch (error) {
      // If error, assume no access for students
      if (user?.role === "STUDENT") {
        setAccessStatus({ hasAccess: false });
      } else {
        // For other roles, might be access denied, so no access
        setAccessStatus({ hasAccess: false });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasEnhancedAccess = () => {
    if (!user) return false;

    // ADMIN has access to any lesson
    if (user.role === "ADMIN") {
      return true;
    }

    // INSTRUCTOR/ASSISTANT can access their own lessons only
    if (user.role === "INSTRUCTOR" || user.role === "ASSISTANT") {
      // Check if this lesson belongs to the current instructor
      const currentInstructorId = user.instructorId || user.id;
      return currentInstructorId === instructorId;
    }

    return false;
  };

  const shouldShowPurchaseButton = () => {
    // Only students should see purchase button
    if (user?.role !== "STUDENT") {
      return false;
    }

    // Show purchase button if student doesn't have access
    return !accessStatus?.hasAccess;
  };

  const shouldShowViewButton = () => {
    // Show view button if user has access (either purchased or enhanced access)
    return accessStatus?.hasAccess;
  };

  const getProgressIcon = (status) => {
    switch (status) {
      case LessonProgressStatus.PURCHASED:
        return <FaClock className="w-4 h-4 text-orange-500" />;
      case LessonProgressStatus.EXAM_PASSED:
        return <FaQuestionCircle className="w-4 h-4 text-blue-500" />;
      case LessonProgressStatus.VIDEO_WATCHED:
        return <FaPlay className="w-4 h-4 text-green-500" />;
      case LessonProgressStatus.ASSIGNMENT_DONE:
        return <FaCheck className="w-4 h-4 text-green-600" />;
      default:
        return <FaLock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProgressText = (status) => {
    // For enhanced access users, show different text
    if (accessStatus?.isEnhancedAccess) {
      const roleText =
        user?.role === "ADMIN"
          ? "مدير"
          : user?.role === "INSTRUCTOR"
            ? "مدرس"
            : "مساعد";
      return `وصول كامل - ${roleText}`;
    }

    const baseStatus = formatProgressStatus(status);

    switch (status) {
      case LessonProgressStatus.PURCHASED:
        return `${baseStatus} - ابدأ الامتحان`;
      case LessonProgressStatus.EXAM_PASSED:
        return `${baseStatus} - شاهد الفيديو`;
      case LessonProgressStatus.VIDEO_WATCHED:
        return `${baseStatus} - حل الواجب`;
      case LessonProgressStatus.ASSIGNMENT_DONE:
        return "مكتمل";
      default:
        return "غير متاح";
    }
  };

  const getProgressColor = (status) => {
    // For enhanced access users, use special styling
    if (accessStatus?.isEnhancedAccess) {
      return "text-purple-700 bg-purple-100 border-purple-300";
    }

    switch (status) {
      case LessonProgressStatus.PURCHASED:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case LessonProgressStatus.EXAM_PASSED:
        return "text-blue-600 bg-blue-50 border-blue-200";
      case LessonProgressStatus.VIDEO_WATCHED:
        return "text-green-600 bg-green-50 border-green-200";
      case LessonProgressStatus.ASSIGNMENT_DONE:
        return "text-green-700 bg-green-100 border-green-300";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const canAccessPart = (part) => {
    // For users with enhanced access (non-students), allow access to all parts
    if (accessStatus?.isEnhancedAccess) {
      switch (part) {
        case "exam":
<<<<<<< HEAD
          return hasExam; // Can access if lesson has exam (from API)
        case "video":
          return true; // Always can access video
        case "assignment":
          return hasAssignment; // Can access if lesson has assignment (from API)
=======
          return lessonStatus.hasExam; // Can access if lesson has exam (real-time)
        case "video":
          return true; // Always can access video
        case "assignment":
          return lessonStatus.hasAssignment; // Can access if lesson has assignment (real-time)
>>>>>>> f2f5225ec071e45510f8396ff03bb616ce3aa1e7
        default:
          return false;
      }
    }

<<<<<<< HEAD
    if (!lessonProgress) return false;

    // For students, use normal progress-based access
=======
    // For students, use normal progress-based access with real-time lesson status
>>>>>>> f2f5225ec071e45510f8396ff03bb616ce3aa1e7
    const status = lessonProgress.progressStatus;

    switch (part) {
      case "exam":
<<<<<<< HEAD
        return hasExam && status === LessonProgressStatus.PURCHASED;
=======
        return (
          lessonStatus.hasExam && status === LessonProgressStatus.PURCHASED
        );
>>>>>>> f2f5225ec071e45510f8396ff03bb616ce3aa1e7
      case "video":
        // If lesson has exam, need to pass it first; otherwise can access after purchase
        if (lessonStatus.hasExam) {
          return [
            LessonProgressStatus.EXAM_PASSED,
            LessonProgressStatus.VIDEO_WATCHED,
            LessonProgressStatus.ASSIGNMENT_DONE,
          ].includes(status);
        } else {
          return [
            LessonProgressStatus.PURCHASED,
            LessonProgressStatus.VIDEO_WATCHED,
            LessonProgressStatus.ASSIGNMENT_DONE,
          ].includes(status);
        }
      case "assignment":
        return (
<<<<<<< HEAD
          hasAssignment &&
=======
          lessonStatus.hasAssignment &&
>>>>>>> f2f5225ec071e45510f8396ff03bb616ce3aa1e7
          [
            LessonProgressStatus.VIDEO_WATCHED,
            LessonProgressStatus.ASSIGNMENT_DONE,
          ].includes(status)
        );
      default:
        return false;
    }
  };

  const getInitialTab = (progressStatus) => {
    switch (progressStatus) {
      case LessonProgressStatus.PURCHASED:
        // If lesson has exam, start with exam; otherwise start with video
        return hasExam ? "exam" : "video";

      case LessonProgressStatus.EXAM_PASSED:
        // Exam passed, go to video
        return "video";

      case LessonProgressStatus.VIDEO_WATCHED:
        // Video watched, go to assignment if exists
        return hasAssignment ? "assignment" : "video";

      case LessonProgressStatus.ASSIGNMENT_DONE:
        // Everything done, show video (or any tab user prefers)
        return "video";

      default:
        return hasExam ? "exam" : "video";
    }
  };

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="group bg-white/95 backdrop-blur-md border border-white/40 w-full rounded-3xl p-8 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden shadow-xl">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl"></div>

      {/* Enhanced Lesson Header */}
      <div className="relative flex flex-col md:flex-row items-start gap-6 mb-6">
        {/* Lesson Photo */}
        <div className="relative group/photo flex-shrink-0">
          <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-white shadow-lg">
            {lesson.photoUrl ? (
              <Image
                src={lesson.photoUrl}
                width={128}
                height={128}
                alt={lesson.name}
                className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div className="w-full h-full flex items-center justify-center">
              <FaBookOpen className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          {/* Photo overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-3 group-hover:text-blue-600 transition-colors duration-300">
            {lesson.name}
            {accessStatus?.hasAccess &&
              getProgressIcon(lessonProgress?.progressStatus)}
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed text-lg">
            {lesson.description || "وصف الدرس غير متاح"}
          </p>
        </div>

        {/* Enhanced Badges */}
        <div className="flex flex-col gap-2 items-end">
          {/* Enhanced Price Badge - Only show for students */}
          {user?.role === "STUDENT" && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <FaDollarSign className="w-4 h-4" />
              {lesson.price} جنيه
            </div>
          )}

          {/* Enhanced Role Badge for non-students */}
          {user?.role !== "STUDENT" && accessStatus?.isEnhancedAccess && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <FaEye className="w-4 h-4" />
              {user?.role === "ADMIN"
                ? "مدير"
                : user?.role === "INSTRUCTOR"
                  ? "مدرس"
                  : "مساعد"}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Progress Status */}
      {accessStatus?.hasAccess && lessonProgress && (
        <div
          className={`relative mb-6 px-5 py-4 rounded-2xl border-2 ${getProgressColor(lessonProgress.progressStatus)} backdrop-blur-sm shadow-lg`}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
              {getProgressIcon(lessonProgress.progressStatus)}
            </div>
            <span className="font-bold text-base">
              {getProgressText(lessonProgress.progressStatus)}
            </span>
          </div>
          {/* Progress indicator line */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-2xl opacity-50"></div>
        </div>
      )}

      {/* Enhanced Lesson Components */}
      <div className="relative grid grid-cols-3 gap-4 mb-8">
        {/* Enhanced Exam */}
        <div
<<<<<<< HEAD
          className={`group/exam p-5 rounded-2xl border-2 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
            componentsLoading
              ? "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 animate-pulse"
              : hasExam
                ? canAccessPart("exam")
                  ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300 shadow-md"
                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                : "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/60 flex items-center justify-center">
            {componentsLoading ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <FaQuestionCircle
                className={`w-6 h-6 transition-all duration-300 ${
                  hasExam
                    ? canAccessPart("exam")
                      ? "text-blue-500 group-hover/exam:text-blue-600 group-hover/exam:scale-110"
                      : "text-gray-400"
                    : "text-gray-300"
                }`}
              />
            )}
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {componentsLoading
              ? "جاري التحميل..."
              : hasExam
=======
          className={`p-3 rounded-lg border text-center ${
            lessonStatus.isLoading
              ? "bg-gray-50 border-gray-200"
              : lessonStatus.hasExam
                ? canAccessPart("exam")
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
                : "bg-gray-100 border-gray-300"
          }`}
        >
          {lessonStatus.isLoading ? (
            <div className="w-5 h-5 mx-auto mb-1 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
          ) : (
            <FaQuestionCircle
              className={`w-5 h-5 mx-auto mb-1 ${
                lessonStatus.hasExam
                  ? canAccessPart("exam")
                    ? "text-blue-500"
                    : "text-gray-400"
                  : "text-gray-300"
              }`}
            />
          )}
          <p className="regular-12 text-gray-600">
            {lessonStatus.isLoading
              ? "جاري التحميل..."
              : lessonStatus.hasExam
>>>>>>> f2f5225ec071e45510f8396ff03bb616ce3aa1e7
                ? "امتحان"
                : "لا يوجد امتحان"}
          </p>
        </div>

        {/* Enhanced Video */}
        <div
          className={`group/video p-5 rounded-2xl border-2 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
            canAccessPart("video")
              ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:border-green-300 shadow-md"
              : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/60 flex items-center justify-center">
            <FaPlay
              className={`w-6 h-6 transition-all duration-300 ${
                canAccessPart("video")
                  ? "text-green-500 group-hover/video:text-green-600 group-hover/video:scale-110"
                  : "text-gray-400"
              }`}
            />
          </div>
          <p className="text-sm font-semibold text-gray-700">فيديو</p>
        </div>

        {/* Enhanced Assignment */}
        <div
<<<<<<< HEAD
          className={`group/assignment p-5 rounded-2xl border-2 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
            componentsLoading
              ? "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 animate-pulse"
              : hasAssignment
                ? canAccessPart("assignment")
                  ? "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300 shadow-md"
                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                : "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/60 flex items-center justify-center">
            {componentsLoading ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <FaFileAlt
                className={`w-6 h-6 transition-all duration-300 ${
                  hasAssignment
                    ? canAccessPart("assignment")
                      ? "text-purple-500 group-hover/assignment:text-purple-600 group-hover/assignment:scale-110"
                      : "text-gray-400"
                    : "text-gray-300"
                }`}
              />
            )}
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {componentsLoading
              ? "جاري التحميل..."
              : hasAssignment
=======
          className={`p-3 rounded-lg border text-center ${
            lessonStatus.isLoading
              ? "bg-gray-50 border-gray-200"
              : lessonStatus.hasAssignment
                ? canAccessPart("assignment")
                  ? "bg-purple-50 border-purple-200"
                  : "bg-gray-50 border-gray-200"
                : "bg-gray-100 border-gray-300"
          }`}
        >
          {lessonStatus.isLoading ? (
            <div className="w-5 h-5 mx-auto mb-1 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500"></div>
          ) : (
            <FaFileAlt
              className={`w-5 h-5 mx-auto mb-1 ${
                lessonStatus.hasAssignment
                  ? canAccessPart("assignment")
                    ? "text-purple-500"
                    : "text-gray-400"
                  : "text-gray-300"
              }`}
            />
          )}
          <p className="regular-12 text-gray-600">
            {lessonStatus.isLoading
              ? "جاري التحميل..."
              : lessonStatus.hasAssignment
>>>>>>> f2f5225ec071e45510f8396ff03bb616ce3aa1e7
                ? "واجب"
                : "لا يوجد واجب"}
          </p>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="relative flex justify-end gap-4">
        {shouldShowPurchaseButton() && (
          <button
            onClick={() => onPurchase(lesson)}
            className="cursor-pointer bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-2xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <FaShoppingCart className="w-5 h-5" />
            شراء الدرس
          </button>
        )}

        {shouldShowViewButton() && (
          <button
            onClick={() => {
              onViewLesson(lesson);
            }}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
          >
            <FaEye className="w-5 h-5" />
            {accessStatus?.isEnhancedAccess ? "إدارة الدرس" : "عرض الدرس"}
          </button>
        )}

        {!shouldShowPurchaseButton() &&
          !shouldShowViewButton() &&
          user?.role === "STUDENT" && (
            <div className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 border-2 border-gray-300">
              <FaLock className="w-5 h-5" />
              غير متاح
            </div>
          )}

        {(user?.role === "INSTRUCTOR" || user?.role === "ASSISTANT") &&
          !shouldShowViewButton() && (
            <div className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 border-2 border-gray-300">
              <FaLock className="w-5 h-5" />
              ليس من دروسك
            </div>
          )}
      </div>

      {/* Access Expiry Info */}
      {accessStatus?.hasAccess && accessStatus?.expiryDate && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
          <p className="regular-12 text-yellow-700">
            ينتهي الوصول في:{" "}
            {new Date(accessStatus.expiryDate).toLocaleDateString("ar-EG")}
          </p>
        </div>
      )}
    </div>
  );
};

export default LessonCard;
