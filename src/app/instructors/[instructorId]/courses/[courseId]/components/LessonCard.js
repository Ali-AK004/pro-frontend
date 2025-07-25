import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";
import {
  studentAPI,
  LessonProgressStatus,
  canAccessLessonPart,
  formatProgressStatus,
} from "../../../../../services/studentAPI";
import { useUserData } from "../../../../../../../models/UserContext";

const LessonCard = ({ lesson, onPurchase, onViewLesson, instructorId }) => {
  const { user } = useUserData();
  const [accessStatus, setAccessStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(null);

  useEffect(() => {
    checkLessonAccess();
  }, [lesson.id, user]);

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
    if (!lessonProgress) return false;

    // For users with enhanced access (non-students), allow access to all parts
    if (accessStatus?.isEnhancedAccess) {
      switch (part) {
        case "exam":
          return !!lesson.exam; // Can access if lesson has exam
        case "video":
          return true; // Always can access video
        case "assignment":
          return !!lesson.assignment; // Can access if lesson has assignment
        default:
          return false;
      }
    }

    // For students, use normal progress-based access
    const status = lessonProgress.progressStatus;

    switch (part) {
      case "exam":
        return status === LessonProgressStatus.PURCHASED;
      case "video":
        return [
          LessonProgressStatus.EXAM_PASSED,
          LessonProgressStatus.VIDEO_WATCHED,
          LessonProgressStatus.ASSIGNMENT_DONE,
        ].includes(status);
      case "assignment":
        return [
          LessonProgressStatus.VIDEO_WATCHED,
          LessonProgressStatus.ASSIGNMENT_DONE,
        ].includes(status);
      default:
        return false;
    }
  };

  const getInitialTab = (progressStatus, lesson) => {
    switch (progressStatus) {
      case LessonProgressStatus.PURCHASED:
        // If lesson has exam, start with exam; otherwise start with video
        return lesson.exam ? "exam" : "video";

      case LessonProgressStatus.EXAM_PASSED:
        // Exam passed, go to video
        return "video";

      case LessonProgressStatus.VIDEO_WATCHED:
        // Video watched, go to assignment if exists
        return lesson.assignment ? "assignment" : "video";

      case LessonProgressStatus.ASSIGNMENT_DONE:
        // Everything done, show video (or any tab user prefers)
        return "video";

      default:
        return lesson.exam ? "exam" : "video";
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
    <div className="border border-gray-200 w-full rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
      {/* Lesson Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="bold-18 text-gray-900 mb-2 flex items-center gap-2">
            {lesson.name}
            {accessStatus?.hasAccess &&
              getProgressIcon(lessonProgress?.progressStatus)}
          </h3>
          <p className="regular-14 text-gray-600 mb-3">
            {lesson.description || "وصف الدرس غير متاح"}
          </p>
        </div>

        {/* Price Badge - Only show for students */}
        {user?.role === "STUDENT" && (
          <div className="bg-accent text-white px-3 py-1 rounded-full bold-14 flex items-center gap-1">
            <FaDollarSign className="w-3 h-3" />
            {lesson.price} جنيه
          </div>
        )}

        {/* Role Badge for non-students */}
        {user?.role !== "STUDENT" && accessStatus?.isEnhancedAccess && (
          <div className="bg-purple-600 text-white px-3 py-1 rounded-full bold-14 flex items-center gap-1">
            <FaEye className="w-3 h-3" />
            {user?.role === "ADMIN"
              ? "مدير"
              : user?.role === "INSTRUCTOR"
                ? "مدرس"
                : "مساعد"}
          </div>
        )}
      </div>

      {/* Progress Status */}
      {accessStatus?.hasAccess && lessonProgress && (
        <div
          className={`mb-4 px-3 py-2 rounded-lg border ${getProgressColor(lessonProgress.progressStatus)}`}
        >
          <div className="flex items-center gap-2">
            {getProgressIcon(lessonProgress.progressStatus)}
            <span className="bold-14">
              {getProgressText(lessonProgress.progressStatus)}
            </span>
          </div>
        </div>
      )}

      {/* Lesson Components */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Exam */}
        <div
          className={`p-3 rounded-lg border text-center ${
            lesson.exam
              ? canAccessPart("exam")
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
              : "bg-gray-100 border-gray-300"
          }`}
        >
          <FaQuestionCircle
            className={`w-5 h-5 mx-auto mb-1 ${
              lesson.exam
                ? canAccessPart("exam")
                  ? "text-blue-500"
                  : "text-gray-400"
                : "text-gray-300"
            }`}
          />
          <p className="regular-12 text-gray-600">
            {lesson.exam ? "امتحان" : "لا يوجد امتحان"}
          </p>
        </div>

        {/* Video */}
        <div
          className={`p-3 rounded-lg border text-center ${
            canAccessPart("video")
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <FaPlay
            className={`w-5 h-5 mx-auto mb-1 ${
              canAccessPart("video") ? "text-green-500" : "text-gray-400"
            }`}
          />
          <p className="regular-12 text-gray-600">فيديو</p>
        </div>

        {/* Assignment */}
        <div
          className={`p-3 rounded-lg border text-center ${
            lesson.assignment
              ? canAccessPart("assignment")
                ? "bg-purple-50 border-purple-200"
                : "bg-gray-50 border-gray-200"
              : "bg-gray-100 border-gray-300"
          }`}
        >
          <FaFileAlt
            className={`w-5 h-5 mx-auto mb-1 ${
              lesson.assignment
                ? canAccessPart("assignment")
                  ? "text-purple-500"
                  : "text-gray-400"
                : "text-gray-300"
            }`}
          />
          <p className="regular-12 text-gray-600">
            {lesson.assignment ? "واجب" : "لا يوجد واجب"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {shouldShowPurchaseButton() && (
          <button
            onClick={() => onPurchase(lesson)}
            className="cursor-pointer bg-accent text-white py-3 px-8 rounded-lg bold-16 hover:bg-opacity-90 transition-colors flexCenter gap-2"
          >
            <FaShoppingCart className="w-4 h-4" />
            شراء الدرس
          </button>
        )}

        {shouldShowViewButton() && (
          <button
            onClick={() => {
              onViewLesson(lesson);
            }}
            className="flex-1 bg-secondary text-white py-3 px-4 rounded-lg bold-16 hover:bg-opacity-90 transition-colors flexCenter gap-2 cursor-pointer"
          >
            <FaEye className="w-4 h-4" />
            {accessStatus?.isEnhancedAccess ? "إدارة الدرس" : "عرض الدرس"}
          </button>
        )}

        {!shouldShowPurchaseButton() &&
          !shouldShowViewButton() &&
          user?.role === "STUDENT" && (
            <div className="flex-1 bg-gray-100 text-gray-500 py-3 px-4 rounded-lg bold-16 flexCenter gap-2">
              <FaLock className="w-4 h-4" />
              غير متاح
            </div>
          )}

        {(user?.role === "INSTRUCTOR" || user?.role === "ASSISTANT") &&
          !shouldShowViewButton() && (
            <div className="flex-1 bg-gray-100 text-gray-500 py-3 px-4 rounded-lg bold-16 flexCenter gap-2">
              <FaLock className="w-4 h-4" />
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
