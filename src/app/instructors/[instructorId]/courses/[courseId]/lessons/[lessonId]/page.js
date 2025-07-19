"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaPlay,
  FaQuestionCircle,
  FaFileAlt,
  FaClock,
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
  FaDownload,
} from "react-icons/fa";
import { toast } from "react-toastify";
import NavBar from "@/app/components/navBar";
import { studentAPI } from "@/app/services/studentAPI";
import examAPI, { handleAPIError } from "@/app/services/examAPI";
import assignmentAPI from "@/app/services/assignmentAPI";
import { useUserData } from "../../../../../../../../models/UserContext";
import CustomVideoPlayer from "../../components/CustomVideoPlayer";

const LessonPage = () => {
  const params = useParams();
  const router = useRouter();
  const { lessonId } = params;

  // State management
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [assignmentSubmission, setAssignmentSubmission] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch lesson data
  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentAPI.lessons.getLessonDetails(lessonId);
      setLessonData(response.data);

      // Set initial tab based on access and progress
      setInitialTab(response.data);
    } catch (error) {
      console.error("Error fetching lesson data:", error);
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
    if (
      data.canAccessExam &&
      data.exam &&
      data.progressStatus === "PURCHASED"
    ) {
      setActiveTab("exam");
    } else if (data.canAccessVideo && data.videoUrl) {
      setActiveTab("video");
    } else if (data.canAccessAssignment && data.assignment) {
      setActiveTab("assignment");
    } else {
      setActiveTab("overview");
    }
  };

  // Handle exam submission
  const handleExamSubmit = async () => {
    if (!lessonData?.exam?.id) return;

    try {
      setIsSubmitting(true);
      const response = await examAPI.exams.submit(
        lessonData.exam.id,
        examAnswers
      );
      setExamResult(response.data);

      if (response.data.passed) {
        toast.success("تهانينا! لقد اجتزت الامتحان بنجاح");
        // Refresh lesson data to update progress
        await fetchLessonData();
        setActiveTab("video");
      } else {
        toast.error(`لم تجتز الامتحان. درجتك: ${response.data.score}%`);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تقديم الامتحان"));
    } finally {
      setIsSubmitting(false);
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
      await assignmentAPI.assignments.submit(
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
              className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-container padding-container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-container padding-container">
          <div className="flex gap-8">
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

      {/* Content */}
      <div className="max-container padding-container py-8">
        {activeTab === "overview" && (
          <OverviewTab
            lesson={lesson}
            exam={exam}
            assignment={assignment}
            hasAccess={hasAccess}
            progressStatus={progressStatus}
            accessError={accessError}
          />
        )}

        {activeTab === "exam" && exam && (
          <ExamTab
            exam={exam}
            examAnswers={examAnswers}
            setExamAnswers={setExamAnswers}
            examResult={examResult}
            onSubmit={handleExamSubmit}
            isSubmitting={isSubmitting}
            canAccess={canAccessExam}
          />
        )}

        {activeTab === "video" && (
          <VideoTab
            lesson={lesson}
            videoUrl={videoUrl}
            onVideoComplete={handleVideoComplete}
            canAccess={canAccessVideo}
            accessError={accessError}
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
          />
        )}
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
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
        isActive
          ? "border-accent text-accent"
          : canClick
            ? "border-transparent text-gray-600 hover:text-accent hover:border-gray-300"
            : "border-transparent text-gray-400 cursor-not-allowed"
      }`}
      disabled={!canClick}
    >
      <Icon className="w-4 h-4" />
      <span className="bold-14">{label}</span>
      {!canClick && <FaLock className="w-3 h-3" />}
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
        {/* Lesson Image */}
        {lesson.photoUrl && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img
              src={lesson.photoUrl}
              alt={lesson.name}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Lesson Description */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="bold-24 text-gray-900 mb-4">وصف الدرس</h2>
          <p className="regular-16 text-gray-700 leading-relaxed">
            {lesson.description || "لا يوجد وصف متاح لهذا الدرس"}
          </p>
        </div>

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
            <div className="flex items-center gap-3 mb-3">
              <FaGraduationCap className="w-5 h-5 text-blue-500" />
              <h3 className="bold-18 text-blue-800">حالة التقدم</h3>
            </div>
            <p className="regular-14 text-blue-700">
              {getProgressStatusText(progressStatus)}
            </p>
          </div>
        )}
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

            {lesson.instructorName && (
              <div className="flex items-center gap-3">
                <FaUser className="w-4 h-4 text-gray-500" />
                <span className="regular-14 text-gray-700">
                  المدرس: {lesson.instructorName}
                </span>
              </div>
            )}

            {lesson.accessExpiryDate && (
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="w-4 h-4 text-gray-500" />
                <span className="regular-14 text-gray-700">
                  انتهاء الوصول: {formatDate(lesson.accessExpiryDate)}
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
}) => {
  if (!canAccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <FaLock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="bold-18 text-gray-600 mb-2">الامتحان مقفل</h3>
          <p className="regular-14 text-gray-500">
            تحتاج إلى شراء الدرس للوصول إلى الامتحان
          </p>
        </div>
      </div>
    );
  }

  if (examResult) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          {examResult.passed ? (
            <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}

          <h2 className="bold-24 text-gray-900 mb-4">
            {examResult.passed ? "تهانينا! لقد نجحت" : "لم تنجح في الامتحان"}
          </h2>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="regular-16 text-gray-700">
              درجتك: <span className="bold-16">{examResult.score}%</span>
            </p>
            <p className="regular-14 text-gray-600">
              درجة النجاح المطلوبة: {exam.passingScore}%
            </p>
          </div>

          {!examResult.passed && (
            <p className="regular-14 text-gray-600">
              يمكنك إعادة المحاولة مرة أخرى
            </p>
          )}
        </div>
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flexCenter flex-col mb-6 pb-4 border-b border-gray-200">
        <h2 className="bold-32 text-center text-gray-900">{exam.title}</h2>
        <div className="flex items-center border">
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg">
            <span className="bold-14">درجة النجاح: {exam.passingScore}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {exam.questions?.map((question, index) => (
          <div
            key={question.id}
            className="border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="bg-accent text-white w-8 h-8 rounded-full flexCenter bold-14 flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1">
                <h3 className="bold-16 text-gray-900 mb-2">
                  {question.questionText}
                </h3>
                <p className="regular-12 text-gray-500">
                  النقاط: {question.points} | النوع:{" "}
                  {question.questionType === "SINGLE_CHOICE"
                    ? "اختيار واحد"
                    : question.questionType === "MULTIPLE_CHOICE"
                      ? "اختيار متعدد"
                      : "صح أم خطأ"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {question.answers?.map((answer) => (
                <label
                  key={answer.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isAnswerSelected(question.id, answer.id)
                      ? "border-accent bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
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
                    className="w-4 h-4 text-accent"
                  />
                  <span className="regular-14 text-gray-700">
                    {answer.answerText}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <button
          onClick={onSubmit}
          disabled={!allQuestionsAnswered || isSubmitting}
          className={`px-8 py-3 rounded-lg bold-16 transition-colors ${
            allQuestionsAnswered && !isSubmitting
              ? "bg-accent text-white hover:bg-opacity-90"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "جاري التقديم..." : "تقديم الامتحان"}
        </button>

        {!allQuestionsAnswered && (
          <p className="regular-12 text-red-500 mt-2">
            يرجى الإجابة على جميع الأسئلة قبل التقديم
          </p>
        )}
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

  // if (!lesson.videoUrl) {
  //   return (
  //     <div className="bg-white rounded-lg shadow-sm p-6">
  //       <div className="text-center">
  //         <FaExclamationTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
  //         <h3 className="bold-18 text-gray-600 mb-2">الفيديو غير متاح</h3>
  //         <p className="regular-14 text-gray-500">
  //           لم يتم رفع فيديو لهذا الدرس بعد
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="bold-24 text-gray-900 mb-6">فيديو الدرس</h2>

      <div className="aspect-video rounded-lg w-full max-w-4xl mx-auto mb-4">
        <CustomVideoPlayer
          videoUrl={videoUrl || lesson?.videoUrl}
          onEnded={onVideoComplete}
          poster={lesson?.photoUrl}
          className="w-full h-full"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FaEye className="w-5 h-5 text-blue-500" />
          <div>
            <h4 className="bold-14 text-blue-800">تتبع المشاهدة</h4>
            <p className="regular-12 text-blue-600">
              سيتم تسجيل مشاهدتك للفيديو تلقائياً عند انتهاء التشغيل
            </p>
          </div>
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
}) => {
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
  const isSubmitted = assignment.submissionText && assignment.submissionDate;

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

        {assignment.grade !== null && assignment.grade !== undefined && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FaGraduationCap className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="bold-14 text-green-800">الدرجة</h4>
                <p className="regular-12 text-green-600">
                  {assignment.grade} من {assignment.maxPoints}
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
            تم تسليم الواجب في: {formatDate(assignment.submissionDate)}
          </p>
          <div className="bg-white rounded-lg p-4">
            <h4 className="bold-14 text-gray-900 mb-2">إجابتك:</h4>
            <p className="regular-14 text-gray-700 whitespace-pre-wrap">
              {assignment.submissionText}
            </p>
          </div>
          {assignment.feedback && (
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <h4 className="bold-14 text-blue-900 mb-2">تعليق المدرس:</h4>
              <p className="regular-14 text-blue-700">{assignment.feedback}</p>
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
              className={`px-6 py-2 rounded-lg bold-14 transition-colors ${
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
