"use client";
import React, { useState, useEffect, useRef } from "react";
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
import { handleAPIError } from "@/app/services/examAPI";
import ExamPlayer from "@/app/components/exam/ExamPlayer";
import assignmentAPI from "@/app/services/assignmentAPI";
import SecureLessonPlayer from "@/app/components/SecureLessonPlayer";
import { useUserData } from "../../../../../../../../models/UserContext";

const LessonPage = () => {
  const params = useParams();
  const router = useRouter();
  const { instructorId, lessonId } = params;
  const { user } = useUserData();

  // State management
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [assignmentSubmission, setAssignmentSubmission] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructorData, setInstructorData] = useState(null);
  const [accessExpiry, setAccessExpiry] = useState(null);


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
      window.location.hash = activeTab; // This might trigger re-renders
    }
  }, [activeTab]);

  // silent: refresh after an exam without the full-page spinner and without switching tabs
  const fetchLessonData = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const response = await studentAPI.lessons.getLessonDetails(lessonId);
      setLessonData({
        ...response.data,
        remainingVideoViews: response.data.remainingVideoViews || 0
      });

      // A silent refresh (after an exam) only needs the lesson itself
      if (!silent) {
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
      }

      // Set initial tab based on access and progress
      if (!silent) setInitialTab(response.data);
    } catch (error) {
      if (!silent) setError(handleAPIError(error, "فشل في تحميل بيانات الدرس"));
      toast.error(handleAPIError(error, "فشل في تحميل بيانات الدرس"));
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const setInitialTab = (data) => {
    if (!data.hasAccess) {
      setActiveTab("overview");
      return;
    }

    // Determine initial tab based on progress and access
    // Don't automatically open exam tab - let user start it manually
    if (data.canAccessVideo && data.lesson?.hasVideo) {
      setActiveTab("video");
    } else if (data.canAccessAssignment && data.assignment) {
      setActiveTab("assignment");
    } else if (data.canAccessExam && data.exam) {
      setActiveTab("exam");
    } else {
      setActiveTab("overview");
    }
  };

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
      await fetchLessonData();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تسجيل المشاهدة"));
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
            <h2 className="text-base font-semibold text-slate-900 mb-2">خطأ في تحميل الدرس</h2>
            <p className="regular-16 text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-brand-600 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
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
    exam: payloadExam,
    assignment,
    hasAccess,
    canAccessVideo,
    canAccessExam,
    canAccessAssignment,
    progressStatus,
    accessError,
  } = lessonData;
  const exam = payloadExam;

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
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
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
                <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg bold-14 flex items-center gap-2">
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
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-brand-50/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/10 rounded-full blur-2xl"></div>

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
              <ExamPlayer
                key={exam.id}
                examId={exam.id}
                canAccess={canAccessExam}
                onFinished={() => fetchLessonData({ silent: true })}
              />
            )}

            {activeTab === "video" && (
              <VideoTab
                lesson={lesson}
                onVideoComplete={handleVideoComplete}
                canAccess={canAccessVideo}
                accessError={accessError}
                progressStatus={lessonData?.progress?.progressStatus}
                remainingVideoViews={lessonData?.remainingVideoViews}
                onViewsChanged={(n) => setLessonData((prev) => ({ ...prev, remainingVideoViews: n }))}
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
      className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-t-2xl transition-all duration-150 font-semibold cursor-pointer ${isActive
 ? "bg-brand-500 text-white shadow-sm"
 : canClick
 ? "bg-white/80 backdrop-blur-sm text-gray-700 hover:text-brand-600 hover:bg-brand-50 shadow-sm border border-gray-200 hover:border-brand-300"
 : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
 }`}
      disabled={!canClick}
    >
      <div
        className={`p-2 rounded-lg transition-all duration-150   ${isActive
 ? "bg-white/20"
 : canClick
 ? "bg-gray-100 group-hover:bg-brand-100"
 : "bg-gray-200"
 }`}
      >
        <Icon
          className={`w-5 h-5 transition-all duration-150 ${isActive
 ? "text-white"
 : canClick
 ? "text-gray-600 group-hover:text-brand-600"
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
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-t-full"></div>
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
          <div className="group bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200/50 transition-all duration-150">
            <div className="relative overflow-hidden">
              <img
                src={lesson.photoUrl}
                alt={lesson.name}
                className="w-full h-80 object-cover transition-transform duration-150"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 translate-y-2">
                  {lesson.name}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Lesson Description */}
        <div className="bg-brand-50 rounded-2xl shadow-sm border border-brand-200/50 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-400/20 rounded-full blur-xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-500 rounded-xl">
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

            {instructorData && instructorData.fullname && (
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
              <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
                <FaQuestionCircle className="w-5 h-5 text-brand-500" />
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

            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <FaPlay className="w-5 h-5 text-emerald-500" />
              <span className="regular-14 text-gray-700">فيديو تعليمي</span>
            </div>

            {assignment && (
              <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
                <FaFileAlt className="w-5 h-5 text-brand-500" />
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
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-6">
              <div className="flex items-center flex-col gap-3 mb-3">
                <FaGraduationCap className="w-5 h-5 text-brand-500" />
                <h3 className="bold-18 text-brand-800">حالة التقدم</h3>
              </div>
              <p className="regular-14 text-brand-700">
                {getProgressStatusText(progressStatus)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Video Tab Component - MODIFIED VERSION
const VideoTab = ({
  lesson,
  onVideoComplete,
  canAccess,
  accessError,
  progressStatus,
  remainingVideoViews,
  onViewsChanged,
}) => {
  const [isMarking, setIsMarking] = useState(false);
  const watched = progressStatus === "VIDEO_WATCHED" || progressStatus === "ASSIGNMENT_DONE";

  const handleMarkAsWatched = async () => {
    if (isMarking || watched) return;
    setIsMarking(true);
    try {
      await onVideoComplete();
      toast.success("تم تسجيل المشاهدة");
    } finally {
      setIsMarking(false);
    }
  };

  if (!canAccess) {
    return <AccessDenied message={accessError} />;
  }

  return (
    <>
      <div>
        {remainingVideoViews >= 0 ? (
          <p className="text-sm text-gray-500 mb-2">المشاهدات المتبقية: {remainingVideoViews}</p>
        ) : null}
        {remainingVideoViews === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <FaLock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="bold-18 text-gray-600 mb-2">انتهت المشاهدات المتاحة</h3>
            <p className="regular-14 text-gray-500">لقد استنفدت عدد المشاهدات المسموح بها لهذا الدرس.</p>
          </div>
        ) : (
          <SecureLessonPlayer
            lessonId={lesson?.id}
            remainingViews={remainingVideoViews}
            onViewsChanged={onViewsChanged}
          />
        )}
      </div>
      <div className="bg-brand-50 border mt-5 border-brand-200 rounded-lg p-4">
        <div className="flex items-center flex-col md:flex-row gap-6 justify-between">
          <div className="flex items-center gap-3">
            <FaEye className="w-5 h-5 text-brand-500" />
            <div>
              <h4 className="bold-14 text-brand-800">تتبع المشاهدة</h4>
              <p className="regular-12 text-brand-600">اضغط على الزر بعد مشاهدة الفيديو لفتح الواجب</p>
            </div>
          </div>
          <button
            onClick={handleMarkAsWatched}
            disabled={watched || isMarking}
            className={`px-4 py-2 rounded-lg cursor-pointer font-medium transition-colors ${
 watched ? "bg-emerald-100 text-emerald-700 cursor-not-allowed" : "bg-brand-600 text-white hover:bg-brand-700"
 }`}
          >
            {isMarking ? "جاري التسجيل..." : watched ? "✓ تم المشاهدة" : "تم المشاهدة"}
          </button>
        </div>
      </div>
    </>
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
        <h2 className="text-base font-semibold text-slate-900">{assignment.title}</h2>
        <div className="flex items-center gap-3">
          <div className="bg-brand-50 text-brand-600 px-4 py-2 rounded-lg">
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
        <div className="bg-brand-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="w-5 h-5 text-brand-500" />
            <div>
              <h4 className="bold-14 text-brand-800">تاريخ التسليم</h4>
              <p className="regular-12 text-brand-600">
                {formatDate(assignment.dueDate)}
              </p>
            </div>
          </div>
        </div>

        {assignmentData?.grade !== null &&
          assignmentData?.grade !== undefined && (
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaGraduationCap className="w-5 h-5 text-emerald-500" />
                <div>
                  <h4 className="bold-14 text-emerald-800">الدرجة</h4>
                  <p className="regular-12 text-emerald-600">
                    {assignmentData.grade} من {assignment.maxPoints}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Submission Status */}
      {isSubmitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <FaCheckCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="bold-18 text-emerald-800">تم التسليم</h3>
          </div>
          <p className="regular-14 text-emerald-700 mb-3">
            تم تسليم الواجب في: {formatDate(assignmentData.submissionDate)}
          </p>
          <div className="bg-white rounded-lg p-4">
            <h4 className="bold-14 text-gray-900 mb-2">إجابتك:</h4>
            <p className="regular-14 text-gray-700 whitespace-pre-wrap">
              {assignmentData.submissionText}
            </p>
          </div>
          {assignmentData.feedback && (
            <div className="bg-brand-50 rounded-lg p-4 mt-4">
              <h4 className="bold-14 text-brand-900 mb-2">تعليق المدرس:</h4>
              <p className="regular-14 text-brand-700 whitespace-pre-wrap">
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
            className="w-full h-40 px-3 py-2 border border-slate-200 rounded-lg resize-none focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm focus:outline-none"
            disabled={isOverdue}
          />

          <div className="flex justify-between items-center">
            <p className="regular-12 text-gray-500">{submission.length} حرف</p>

            <button
              onClick={onSubmit}
              disabled={!submission.trim() || isSubmitting || isOverdue}
              className={`px-4 py-2 rounded-lg cursor-pointer bold-14 transition-colors ${submission.trim() && !isSubmitting && !isOverdue
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

// Access Denied Component
const AccessDenied = ({ message }) => {
  return (
    <div className="bg-brand-50 rounded-2xl shadow-xl border border-red-200/50 p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/20 rounded-full blur-2xl"></div>
      <div className="relative text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-500 rounded-full mb-6 shadow-sm">
          <FaLock className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">الدخول مقيد</h3>
        <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
          {message || "تحتاج إلى شراء الدرس للوصول إلى هذا المحتوى والاستفادة من جميع المزايا التعليمية"}
        </p>
      </div>
    </div>
  );
};

export default LessonPage;