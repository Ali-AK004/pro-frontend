"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaPlay,
  FaQuestionCircle,
  FaFileAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
  FaUnlock,
  FaCalendarAlt,
  FaDollarSign,
  FaUser,
  FaBook,
  FaGraduationCap,
  FaEye,
  FaStar,
  FaCheck,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-toastify";
import NavBar from "@/app/components/navBar";
import { studentAPI } from "@/app/services/studentAPI";
import examAPI, { handleAPIError } from "@/app/services/examAPI";
import assignmentAPI from "@/app/services/assignmentAPI";
import LessonVideoPlayer from "../../../../../../components/LessonVideoPlayer";
import { useUserData } from "../../../../../../../../models/UserContext";

const LessonPage = () => {
  const params = useParams();
  const router = useRouter();
  const { instructorId, courseId, lessonId } = params;
  const { user } = useUserData();

  // State management
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [assignmentSubmission, setAssignmentSubmission] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructorData, setInstructorData] = useState(null);
  const [accessExpiry, setAccessExpiry] = useState(null);

  // Exam timer states
  const [examStarted, setExamStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examTimerInterval, setExamTimerInterval] = useState(null);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Fetch lesson data
  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  // Update URL hash when tab changes and read from hash on load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["overview", "exam", "video", "assignment"].includes(hash)) {
        setActiveTab(hash);
      } else if (!hash) {
        // If no hash, default to overview
        setActiveTab("overview");
      }
    };

    // Read from hash on component mount
    handleHashChange();

    // Listen for hash changes (browser back/forward)
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    // Update hash when tab changes (but avoid infinite loop)
    const currentHash = window.location.hash.replace("#", "");
    if (activeTab && activeTab !== currentHash) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (examTimerInterval) {
        clearInterval(examTimerInterval);
      }
    };
  }, [examTimerInterval]);

  const fetchLessonData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentAPI.lessons.getLessonDetails(lessonId);
      setLessonData(response.data);

      // Fetch instructor data using URL parameter (more reliable)
      try {
        const instructorResponse =
          await studentAPI.profile.getInstructorFullProfile(instructorId);
        setInstructorData(instructorResponse.data);
      } catch (instructorError) {
        toast.error("فشل في تحميل بيانات المدرس");
      }

      try {
        const accessResponse = await studentAPI.payments.checkAccess(lessonId);
        if (accessResponse.data.expiryDate) {
          setAccessExpiry(accessResponse.data.expiryDate);
        }
      } catch (accessError) {
        toast.error("خطأ في إحضار بيانات الوصول");
      }

      // Set initial tab based on access and progress
      setInitialTab(response.data);
    } catch (error) {
      setError(handleAPIError(error, "فشل في تحميل بيانات الدرس"));
      toast.error(handleAPIError(error, "فشل في تحميل بيانات الدرس"));
    } finally {
      setIsLoading(false);
    }
  };

  const setInitialTab = (data) => {
    if (!data.hasAccess) {
      setActiveTab("overview");
      return;
    }

    // Determine initial tab based on progress and access
    // Don't automatically open exam tab - let user start it manually
    if (data.canAccessVideo && data.videoUrl) {
      setActiveTab("video");
    } else if (data.canAccessAssignment && data.assignment) {
      setActiveTab("assignment");
    } else if (data.canAccessExam && data.exam) {
      setActiveTab("exam");
    } else {
      setActiveTab("overview");
    }
  };

  // Start exam timer
  const startExamTimer = (timeLimitMinutes) => {
    const totalSeconds = timeLimitMinutes * 60;
    setTimeRemaining(totalSeconds);
    setExamStarted(true);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit exam
          clearInterval(interval);
          handleExamSubmit(true); // true indicates auto-submit due to timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setExamTimerInterval(interval);
  };

  // Format time remaining for display
  const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle exam submission
  const handleExamSubmit = async (isAutoSubmit = false) => {
    if (!lessonData?.exam?.id) return;

    try {
      setIsSubmitting(true);

      // Clear timer if it exists
      if (examTimerInterval) {
        clearInterval(examTimerInterval);
        setExamTimerInterval(null);
      }

      // Convert exam answers
      const formattedAnswers = {};
      Object.keys(examAnswers).forEach((questionId) => {
        const answer = examAnswers[questionId];
        formattedAnswers[questionId] = Array.isArray(answer)
          ? answer.join(",")
          : answer;
      });

      // Submit exam
      const response = await examAPI.exams.submit(
        lessonData.exam.id,
        formattedAnswers
      );

      // Immediately after submission, fetch the latest results
      const submission = await examAPI.exams.getSubmission(
        lessonData.exam.id,
        user.id
      );

      // Update state with the fetched results
      setExamResult(submission.data);
      setExamSubmitted(true);
      setExamStarted(false);
      setTimeRemaining(0);

      // Show appropriate message
      if (submission.data.passed) {
        await fetchLessonData();
        toast.success(`تهانينا! لقد نجحت - درجتك: ${submission.data.score}%`);
      } else {
        toast.error(`لم تجتز الامتحان. الدرجة: ${submission.data.score}%`);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تقديم الامتحان"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchExamSubmission = async () => {
    try {
      if (lessonData?.exam?.id) {
        const studentId = user.id;
        const submission = await examAPI.exams.getSubmission(
          lessonData.exam.id,
          studentId
        );
        setExamResult(submission.data);
      }
    } catch (error) {
      console.log(handleAPIError(error, "فشل في تحميل نتائج الامتحان"));
    }
  };

  useEffect(() => {
    if (activeTab === "exam" && lessonData?.exam?.id) {
      fetchExamSubmission();
    }
  }, [activeTab, lessonData?.exam?.id]);

  // Handle assignment submission
  const handleAssignmentSubmit = async () => {
    if (!lessonData?.assignment?.id || !assignmentSubmission.trim()) {
      toast.error("يرجى كتابة إجابة الواجب");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await assignmentAPI.assignments.submit(
        lessonData.assignment.id,
        assignmentSubmission
      );

      toast.success("تم تسليم الواجب بنجاح");
      // Refresh lesson data
      await fetchLessonData();
      setActiveTab("overview");
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تسليم الواجب"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle video completion
  const handleVideoComplete = async () => {
    try {
      await studentAPI.lessons.markVideoWatched(lessonId);
      toast.success("تم تسجيل مشاهدة الفيديو");
      // Refresh lesson data
      await fetchLessonData();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تسجيل مشاهدة الفيديو"));
    }
  };

  const loadAssignmentData = async () => {
    try {
      const response = await studentAPI.lessons.getAssignment(lessonId);
      return response.data;
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل بيانات الواجب"));
      return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-main">
        <NavBar />
        <div className="flexCenter min-h-[80vh]">
          <div className="flexCenter flex-col">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            <p className="mt-4 regular-16 text-gray-600">جاري تحميل الدرس...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-main">
        <NavBar />
        <div className="flexCenter min-h-[80vh]">
          <div className="text-center">
            <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="bold-24 text-gray-900 mb-2">خطأ في تحميل الدرس</h2>
            <p className="regular-16 text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-accent cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-main">
        <NavBar />
        <div className="flexCenter min-h-[80vh]">
          <div className="text-center">
            <p className="regular-16 text-gray-600">
              لم يتم العثور على بيانات الدرس
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    lesson,
    exam,
    assignment,
    hasAccess,
    canAccessVideo,
    canAccessExam,
    canAccessAssignment,
    progressStatus,
    accessError,
    videoUrl,
  } = lessonData;

  return (
    <div className="min-h-screen bg-main">
      <NavBar />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-container padding-container py-12 md:py-6">
          <div className="flex items-center flex-col md:flex-row gap-6 justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
              >
                <FaArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="bold-32 text-gray-900">{lesson.name}</h1>
                <p className="regular-16 text-gray-600 mt-1">
                  {lesson.description}
                </p>
              </div>
            </div>

            {/* Price and Status */}
            <div className="flex items-center gap-4">
              <div className="bg-accent text-white px-4 py-2 rounded-lg bold-16 flex items-center gap-2">
                <FaDollarSign className="w-4 h-4" />
                {lesson.price} جنيه
              </div>

              {hasAccess ? (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg bold-14 flex items-center gap-2">
                  <FaUnlock className="w-4 h-4" />
                  لديك وصول
                </div>
              ) : (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg bold-14 flex items-center gap-2">
                  <FaLock className="w-4 h-4" />
                  مقفل
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-lg">
        <div className="max-container padding-container">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
            <TabButton
              id="overview"
              label="نظرة عامة"
              icon={FaBook}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isAccessible={true}
            />

            {exam && (
              <TabButton
                id="exam"
                label="الامتحان"
                icon={FaQuestionCircle}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAccessible={canAccessExam}
              />
            )}

            <TabButton
              id="video"
              label="الفيديو"
              icon={FaPlay}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isAccessible={canAccessVideo}
            />

            {assignment && (
              <TabButton
                id="assignment"
                label="الواجب"
                icon={FaFileAlt}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAccessible={canAccessAssignment}
              />
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="max-container padding-container py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl"></div>

          <div className="relative">
            {activeTab === "overview" && (
              <OverviewTab
                lesson={lesson}
                exam={exam}
                assignment={assignment}
                hasAccess={hasAccess}
                progressStatus={progressStatus}
                accessError={accessError}
                instructorData={instructorData}
                accessExpiry={accessExpiry}
                loadAssignmentData={loadAssignmentData}
              />
            )}

            {activeTab === "exam" && exam && (
              <ExamTab
                exam={exam}
                examAnswers={examAnswers}
                setExamAnswers={setExamAnswers}
                examResult={examResult}
                setExamSubmitted={setExamSubmitted}
                setExamResult={setExamResult}
                setActiveTab={setActiveTab}
                onSubmit={handleExamSubmit}
                isSubmitting={isSubmitting}
                canAccess={canAccessExam}
                examStarted={examStarted}
                timeRemaining={timeRemaining}
                startExamTimer={startExamTimer}
                formatTimeRemaining={formatTimeRemaining}
                examSubmitted={examSubmitted}
                fetchExamSubmission={fetchExamSubmission}
              />
            )}

            {activeTab === "video" && (
              <VideoTab
                lesson={lesson}
                videoUrl={videoUrl}
                onVideoComplete={handleVideoComplete}
                canAccess={canAccessVideo}
                accessError={accessError}
                progressStatus={lessonData?.progress?.progressStatus}
              />
            )}

            {activeTab === "assignment" && assignment && (
              <AssignmentTab
                assignment={assignment}
                submission={assignmentSubmission}
                setSubmission={setAssignmentSubmission}
                onSubmit={handleAssignmentSubmit}
                isSubmitting={isSubmitting}
                canAccess={canAccessAssignment}
                loadAssignmentData={loadAssignmentData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({
  id,
  label,
  icon: Icon,
  activeTab,
  setActiveTab,
  isAccessible,
}) => {
  const isActive = activeTab === id;
  const canClick = isAccessible;

  return (
    <button
      onClick={() => canClick && setActiveTab(id)}
      className={`group relative flex items-center gap-3 px-6 py-4 rounded-t-2xl transition-all duration-300 font-semibold cursor-pointer ${
        isActive
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
          : canClick
            ? "bg-white/80 backdrop-blur-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-300"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
      }`}
      disabled={!canClick}
    >
      <div
        className={`p-2 rounded-lg transition-all duration-300 ${
          isActive
            ? "bg-white/20"
            : canClick
              ? "bg-gray-100 group-hover:bg-blue-100"
              : "bg-gray-200"
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-all duration-300 ${
            isActive
              ? "text-white"
              : canClick
                ? "text-gray-600 group-hover:text-blue-600"
                : "text-gray-400"
          }`}
        />
      </div>
      <span className="text-sm">{label}</span>
      {!canClick && (
        <div className="p-1 bg-red-100 rounded-full">
          <FaLock className="w-3 h-3 text-red-500" />
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-t-full"></div>
      )}
    </button>
  );
};

// Overview Tab Component
const OverviewTab = ({
  lesson,
  exam,
  assignment,
  hasAccess,
  progressStatus,
  accessError,
  instructorData,
  accessExpiry,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProgressStatusText = (status) => {
    switch (status) {
      case "PURCHASED":
        return "تم الشراء";
      case "EXAM_PASSED":
        return "تم اجتياز الامتحان";
      case "VIDEO_WATCHED":
        return "تم مشاهدة الفيديو";
      case "ASSIGNMENT_DONE":
        return "تم إنجاز الواجب";
      default:
        return "غير محدد";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Enhanced Lesson Image */}
        {lesson.photoUrl && (
          <div className="group bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200/50 hover:shadow-xl transition-all duration-300">
            <div className="relative overflow-hidden">
              <img
                src={lesson.photoUrl}
                alt={lesson.name}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  {lesson.name}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Lesson Description */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200/50 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <FaBook className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">وصف الدرس</h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              {lesson.description || "لا يوجد وصف متاح لهذا الدرس"}
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Lesson Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="bold-18 text-gray-900 mb-4">معلومات الدرس</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FaDollarSign className="w-4 h-4 text-gray-500" />
              <span className="regular-14 text-gray-700">
                السعر: {lesson.price} جنيه
              </span>
            </div>

            {instructorData.fullname && (
              <div className="flex items-center gap-3">
                <FaUser className="w-4 h-4 text-gray-500" />
                <span className="regular-14 text-gray-700">
                  المدرس: {instructorData.fullname}
                </span>
              </div>
            )}

            {accessExpiry && (
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="w-4 h-4 text-gray-500" />
                <span className="regular-14 text-gray-700">
                  انتهاء الوصول: {formatDate(accessExpiry)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Components */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="bold-18 text-gray-900 mb-4">مكونات الدرس</h3>
          <div className="space-y-3">
            {exam && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <FaQuestionCircle className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <span className="regular-14 text-gray-700 block">
                    {exam.title}
                  </span>
                  <span className="regular-12 text-gray-500">
                    درجة النجاح: {exam.passingScore}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <FaPlay className="w-5 h-5 text-green-500" />
              <span className="regular-14 text-gray-700">فيديو تعليمي</span>
            </div>

            {assignment && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <FaFileAlt className="w-5 h-5 text-purple-500" />
                <div className="flex-1">
                  <span className="regular-14 text-gray-700 block">
                    {assignment.title}
                  </span>
                  <span className="regular-12 text-gray-500">
                    تاريخ التسليم: {formatDate(assignment.dueDate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Access Status */}
          {!hasAccess && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <FaLock className="w-5 h-5 text-red-500" />
                <h3 className="bold-18 text-red-800">الوصول مقيد</h3>
              </div>
              <p className="regular-14 text-red-700">
                {accessError || "تحتاج إلى شراء هذا الدرس للوصول إلى المحتوى"}
              </p>
            </div>
          )}

          {/* Progress Status */}
          {hasAccess && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center flex-col gap-3 mb-3">
                <FaGraduationCap className="w-5 h-5 text-blue-500" />
                <h3 className="bold-18 text-blue-800">حالة التقدم</h3>
              </div>
              <p className="regular-14 text-blue-700">
                {getProgressStatusText(progressStatus)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Exam Tab Component
const ExamTab = ({
  exam,
  examAnswers,
  setExamAnswers,
  examResult,
  onSubmit,
  isSubmitting,
  canAccess,
  examStarted,
  timeRemaining,
  startExamTimer,
  formatTimeRemaining,
  examSubmitted,
  setActiveTab,
  setExamSubmitted,
  setExamResult,
  fetchExamSubmission,
}) => {
  useEffect(() => {
    if (examSubmitted && !examResult) {
      fetchExamSubmission();
    }
  }, [examSubmitted, examResult, fetchExamSubmission]);

  if (!canAccess) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl shadow-xl border border-red-200/50 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-2xl"></div>
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mb-6 shadow-lg">
            <FaLock className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            الامتحان مقفل
          </h3>
          <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
            تحتاج إلى شراء الدرس للوصول إلى الامتحان والاستفادة من جميع
            المحتويات التعليمية
          </p>
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-red-200">
              <FaExclamationTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-700">
                مطلوب شراء الدرس
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (examResult) {
    const questionResults = examResult.questionResults || {};
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
              examResult.passed
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {examResult.passed ? (
              <FaCheckCircle className="w-12 h-12" />
            ) : (
              <FaExclamationTriangle className="w-12 h-12" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {examResult.passed ? "تهانينا! لقد نجحت" : "لم تنجح في الامتحان"}
          </h2>
          <p className="text-gray-600">
            {examResult.lessonName} - {examResult.examTitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">معلومات التقديم</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">وقت التقديم</p>
                <p className="font-medium">
                  {(() => {
                    try {
                      const [year, month, day, hours, minutes, seconds] =
                        examResult.submissionTime;
                      const date = new Date(
                        year,
                        month - 1,
                        day,
                        hours,
                        minutes,
                        seconds
                      );

                      return date.toLocaleString("ar-EG", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      });
                    } catch {
                      return "غير محدد";
                    }
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">عدد المحاولات</p>
                <p className="font-medium">{examResult.attemptNumber}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">النتيجة</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">درجتك</p>
                <p
                  className={`text-2xl font-bold ${
                    examResult.passed ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {examResult.score}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">درجة النجاح</p>
                <p className="font-medium">{examResult.passingScore}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">تفاصيل الإجابات</h3>
          <div className="space-y-4">
            {Object.entries(questionResults).map(([questionId, result]) => {
              const studentAnswer =
                examResult.studentAnswers?.[questionId] || "لا توجد إجابة";

              return (
                <div
                  key={questionId}
                  className={`p-4 border rounded-lg ${
                    result.correct
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {result.questionText || "سؤال بدون نص"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        إجابتك: {studentAnswer}
                      </p>
                      {result.feedback && (
                        <p className="text-sm text-gray-700 mt-2">
                          <span className="font-medium">تعليق:</span>{" "}
                          {result.feedback}
                        </p>
                      )}
                    </div>
                    <span
                      className={`p-3 rounded-full flexCenter text-sm ${
                        result.correct
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {result.correct ? "صحيح" : "خطأ"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!examResult.passed && (
          <div className="text-center">
            <button
              onClick={() => {
                setExamResult(null);
                setExamSubmitted(false);
                setExamAnswers({});
                setActiveTab("exam");
              }}
              className="bg-blue-600 text-white px-6 py-3 cursor-pointer rounded-lg hover:bg-blue-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleAnswerChange = (questionId, answerId, checked = true) => {
    const question = exam.questions.find((q) => q.id === questionId);

    if (question.questionType === "MULTIPLE_CHOICE") {
      const currentAnswers = examAnswers[questionId] || [];
      if (checked) {
        setExamAnswers({
          ...examAnswers,
          [questionId]: [...currentAnswers, answerId],
        });
      } else {
        setExamAnswers({
          ...examAnswers,
          [questionId]: currentAnswers.filter((id) => id !== answerId),
        });
      }
    } else {
      // SINGLE_CHOICE or TRUE_FALSE
      setExamAnswers({
        ...examAnswers,
        [questionId]: answerId,
      });
    }
  };

  const isAnswerSelected = (questionId, answerId) => {
    const question = exam.questions.find((q) => q.id === questionId);
    if (question.questionType === "MULTIPLE_CHOICE") {
      return (examAnswers[questionId] || []).includes(answerId);
    }
    return examAnswers[questionId] === answerId;
  };

  const allQuestionsAnswered = exam.questions.every((question) => {
    const answer = examAnswers[question.id];
    if (question.questionType === "MULTIPLE_CHOICE") {
      return answer && answer.length > 0;
    }
    return answer !== undefined && answer !== null;
  });

  // Show exam start confirmation if exam hasn't started yet
  if (!examStarted) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-2xl border border-blue-200/50 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>

        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-8 shadow-lg">
            <FaQuestionCircle className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {exam.title}
          </h2>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/50 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              معلومات الامتحان
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {exam.questions?.length || 0}
                </div>
                <p className="text-gray-600 font-medium">عدد الأسئلة</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {exam.passingScore}
                </div>
                <p className="text-gray-600 font-medium">درجة النجاح</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {exam.timeLimitMinutes || "غير محدد"}
                </div>
                <p className="text-gray-600 font-medium">دقيقة</p>
              </div>
              {/* <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">1</div>
                <p className="text-gray-600 font-medium">محاولة واحدة</p>
              </div> */}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-yellow-800 mb-2">
                    تعليمات مهمة:
                  </h4>
                  <ul className="text-yellow-700 space-y-2 text-right">
                    <li>
                      • لديك {exam.timeLimitMinutes || "غير محدد"} دقيقة لإكمال
                      الامتحان
                    </li>
                    <li>• سيتم تقديم الامتحان تلقائياً عند انتهاء الوقت</li>
                    <li>• لا يمكن إيقاف المؤقت بعد البدء</li>
                    <li>• تأكد من اتصالك بالإنترنت</li>
                    <li>• يجب الإجابة على جميع الأسئلة</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => startExamTimer(exam.timeLimitMinutes || 60)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-2xl font-bold text-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
            >
              <FaPlay className="w-6 h-6 inline-block ml-3" />
              بدء الامتحان
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-2xl border border-blue-200/50 p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>

      {/* Enhanced Exam Header with Timer */}
      <div className="relative text-center mb-8 pb-6 border-b border-blue-200/50">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
          <FaQuestionCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">{exam.title}</h2>

        {/* Timer Display */}
        <div className="mb-6">
          <div
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-2xl shadow-lg ${
              timeRemaining <= 300
                ? "bg-red-500 text-white animate-pulse"
                : "bg-white/80 text-gray-800"
            }`}
          >
            <FaClock className="w-6 h-6" />
            <span>الوقت المتبقي: {formatTimeRemaining(timeRemaining)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="bg-white/80 backdrop-blur-sm text-blue-700 px-6 py-3 rounded-2xl border border-blue-200 shadow-sm">
            <span className="font-bold">درجة النجاح: {exam.passingScore}%</span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm text-purple-700 px-6 py-3 rounded-2xl border border-purple-200 shadow-sm">
            <span className="font-bold">
              عدد الأسئلة: {exam.questions?.length || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {exam.questions?.map((question, index) => (
          <div
            key={question.id}
            className="group bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            {/* Question background decoration */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>

            <div className="flex items-start gap-6 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {index + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
                  {question.questionText}
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
                    <FaStar className="w-4 h-4" />
                    النقاط: {question.points}
                  </div>
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm font-semibold">
                    <FaQuestionCircle className="w-4 h-4" />
                    {question.questionType === "SINGLE_CHOICE"
                      ? "اختيار واحد"
                      : question.questionType === "MULTIPLE_CHOICE"
                        ? "اختيار متعدد"
                        : "صح أم خطأ"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {question.answers?.map((answer, answerIndex) => (
                <label
                  key={answer.id}
                  className={`group/answer flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                    isAnswerSelected(question.id, answer.id)
                      ? "border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-blue-300 bg-white/50 hover:bg-blue-50/50"
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                      isAnswerSelected(question.id, answer.id)
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 group-hover/answer:border-blue-400"
                    }`}
                  >
                    <input
                      type={
                        question.questionType === "MULTIPLE_CHOICE"
                          ? "checkbox"
                          : "radio"
                      }
                      name={`question-${question.id}`}
                      checked={isAnswerSelected(question.id, answer.id)}
                      onChange={(e) =>
                        handleAnswerChange(
                          question.id,
                          answer.id,
                          e.target.checked
                        )
                      }
                      className="sr-only"
                    />
                    {isAnswerSelected(question.id, answer.id) && (
                      <FaCheck className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isAnswerSelected(question.id, answer.id)
                          ? "bg-white/20 text-blue-700"
                          : "bg-gray-100 text-gray-600 group-hover/answer:bg-blue-100 group-hover/answer:text-blue-600"
                      }`}
                    >
                      {String.fromCharCode(65 + answerIndex)}
                    </div>
                    <span
                      className={`text-lg font-medium transition-colors duration-300 ${
                        isAnswerSelected(question.id, answer.id)
                          ? "text-blue-900"
                          : "text-gray-700 group-hover/answer:text-blue-700"
                      }`}
                    >
                      {answer.answerText}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Submit Section */}
      <div className="relative mt-12 pt-8 border-t border-blue-200/50">
        <div className="text-center">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-blue-200 shadow-sm">
              <FaCheckCircle
                className={`w-5 h-5 ${allQuestionsAnswered ? "text-green-500" : "text-gray-400"}`}
              />
              <span
                className={`font-semibold ${allQuestionsAnswered ? "text-green-700" : "text-gray-600"}`}
              >
                تم الإجابة على {Object.keys(examAnswers).length} من{" "}
                {exam.questions?.length || 0} أسئلة
              </span>
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={!allQuestionsAnswered || isSubmitting}
            className={`group relative inline-flex items-center gap-3 px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              allQuestionsAnswered && !isSubmitting
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                جاري التقديم...
              </>
            ) : (
              <>
                <FaCheck className="w-6 h-6" />
                تقديم الامتحان
              </>
            )}
          </button>

          {!allQuestionsAnswered && (
            <div className="mt-6 flex items-center gap-2 bg-red-50 text-red-700 px-6 py-3 rounded-2xl border border-red-200">
              <FaExclamationTriangle className="w-5 h-5" />
              <span className="font-semibold">
                يرجى الإجابة على جميع الأسئلة قبل التقديم
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Video Tab Component
const VideoTab = ({
  lesson,
  onVideoComplete,
  canAccess,
  accessError,
  videoUrl,
  progressStatus,
}) => {
  if (!canAccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <FaLock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="bold-18 text-gray-600 mb-2">الفيديو مقفل</h3>
          <p className="regular-14 text-gray-500">
            {accessError ||
              "تحتاج إلى اجتياز الامتحان أولاً للوصول إلى الفيديو"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm md:p-6">
      <h2 className="bold-24 text-gray-900 mb-6 mx-2 hidden lg:block">
        فيديو الدرس
      </h2>

      <div className="w-[calc(100% + 1px)] -mx-10 -mt-10 md:-mx-15 lg:mx-0 lg:mt-0 md:w-auto">
        <LessonVideoPlayer
          lesson={{
            id: lesson?.id,
            name: lesson?.name,
            description: lesson?.description,
            videoUrl: videoUrl || lesson?.videoUrl,
            videoThumbnailUrl: lesson?.videoThumbnailUrl,
            videoDuration: lesson?.videoDuration,
            videoStatus: lesson?.videoStatus,
            hasVideo: !!(videoUrl || lesson?.videoUrl),
          }}
          onVideoEnd={onVideoComplete}
          autoplay={false}
          showVideoInfo={true}
        />
      </div>

      <div className="bg-blue-50 border mt-5 border-blue-200 rounded-lg p-4">
        <div className="flex items-center flex-col md:flex-row gap-6 justify-between">
          <div className="flex items-center gap-3">
            <FaEye className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="bold-14 text-blue-800">تتبع المشاهدة</h4>
              <p className="regular-12 text-blue-600">
                اضغط على الزر بعد مشاهدة الفيديو لفتح الواجب
              </p>
            </div>
          </div>
          <button
            onClick={onVideoComplete}
            disabled={
              progressStatus === "VIDEO_WATCHED" ||
              progressStatus === "ASSIGNMENT_DONE"
            }
            className={`px-4 py-2 rounded-lg cursor-pointer font-medium transition-colors ${
              progressStatus === "VIDEO_WATCHED" ||
              progressStatus === "ASSIGNMENT_DONE"
                ? "bg-green-100 text-green-700 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {progressStatus === "VIDEO_WATCHED" ||
            progressStatus === "ASSIGNMENT_DONE"
              ? "✓ تم المشاهدة"
              : "تم المشاهدة"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Assignment Tab Component
const AssignmentTab = ({
  assignment,
  submission,
  setSubmission,
  onSubmit,
  isSubmitting,
  canAccess,
  loadAssignmentData,
}) => {
  const [assignmentData, setAssignmentData] = useState(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);

  useEffect(() => {
    const fetchAssignmentData = async () => {
      setIsLoadingAssignment(true);
      try {
        const data = await loadAssignmentData();
        setAssignmentData(data);
      } catch (error) {
        toast.error("خطأ في عرض بيانات الواجب");
      } finally {
        setIsLoadingAssignment(false);
      }
    };

    if (canAccess) {
      fetchAssignmentData();
    }
  }, [canAccess]);

  if (!canAccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <FaLock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="bold-18 text-gray-600 mb-2">الواجب مقفل</h3>
          <p className="regular-14 text-gray-500">
            تحتاج إلى مشاهدة الفيديو أولاً للوصول إلى الواجب
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingAssignment) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue =
    assignment.dueDate && new Date(assignment.dueDate) < new Date();

  const isSubmitted =
    assignmentData?.submissionText && assignmentData?.submissionDate;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h2 className="bold-24 text-gray-900">{assignment.title}</h2>
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 text-purple-600 px-4 py-2 rounded-lg">
            <span className="bold-14">النقاط: {assignment.maxPoints}</span>
          </div>
          {isOverdue && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg">
              <span className="bold-14">متأخر</span>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Description */}
      <div className="mb-6">
        <h3 className="bold-18 text-gray-900 mb-3">وصف الواجب</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="regular-16 text-gray-700 leading-relaxed">
            {assignment.description || "لا يوجد وصف متاح لهذا الواجب"}
          </p>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="bold-14 text-blue-800">تاريخ التسليم</h4>
              <p className="regular-12 text-blue-600">
                {formatDate(assignment.dueDate)}
              </p>
            </div>
          </div>
        </div>

        {assignmentData?.grade !== null &&
          assignmentData?.grade !== undefined && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaGraduationCap className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="bold-14 text-green-800">الدرجة</h4>
                  <p className="regular-12 text-green-600">
                    {assignmentData.grade} من {assignment.maxPoints}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Submission Status */}
      {isSubmitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <FaCheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="bold-18 text-green-800">تم التسليم</h3>
          </div>
          <p className="regular-14 text-green-700 mb-3">
            تم تسليم الواجب في: {formatDate(assignmentData.submissionDate)}
          </p>
          <div className="bg-white rounded-lg p-4">
            <h4 className="bold-14 text-gray-900 mb-2">إجابتك:</h4>
            <p className="regular-14 text-gray-700 whitespace-pre-wrap">
              {assignmentData.submissionText}
            </p>
          </div>
          {assignmentData.feedback && (
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <h4 className="bold-14 text-blue-900 mb-2">تعليق المدرس:</h4>
              <p className="regular-14 text-blue-700 whitespace-pre-wrap">
                {assignmentData.feedback}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="bold-18 text-gray-900">كتابة الإجابة</h3>
          <textarea
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={isOverdue}
          />

          <div className="flex justify-between items-center">
            <p className="regular-12 text-gray-500">{submission.length} حرف</p>

            <button
              onClick={onSubmit}
              disabled={!submission.trim() || isSubmitting || isOverdue}
              className={`px-6 py-2 rounded-lg cursor-pointer bold-14 transition-colors ${
                submission.trim() && !isSubmitting && !isOverdue
                  ? "bg-accent text-white hover:bg-opacity-90"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "جاري التسليم..." : "تسليم الواجب"}
            </button>
          </div>

          {isOverdue && (
            <p className="regular-12 text-red-500">
              انتهى موعد تسليم هذا الواجب
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonPage;
