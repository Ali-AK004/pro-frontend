import React, { useState, useEffect } from "react";
import {
  FaPlay,
  FaQuestionCircle,
  FaFileAlt,
  FaClock,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarAlt,
  FaAward,
  FaClipboardCheck,
} from "react-icons/fa";
import {
  studentAPI,
  handleAPIError,
  LessonProgressStatus,
  canAccessLessonPart,
  formatProgressStatus,
  getNextStep,
} from "../../../../../services/studentAPI";
import { examAPI } from "../../../../../services/examAPI";
import { assignmentAPI } from "../../../../../services/assignmentAPI";
import { toast } from "react-toastify";

const LessonViewer = ({
  lesson,
  lessonProgress,
  onBack,
  onProgressUpdate,
  initialTab = null,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || "overview");
  const [examData, setExamData] = useState(null);
  const [assignmentData, setAssignmentData] = useState(null);
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [assignmentSubmission, setAssignmentSubmission] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  useEffect(() => {
    // Load exam and assignment data if available
    if (lesson.exam) {
      loadExamData();
    }
    if (lesson.assignment) {
      loadAssignmentData();
    }

    // Set initial tab based on progress or passed parameter
    if (initialTab) {
      setActiveTab(initialTab);
    } else {
      setInitialTab();
    }
  }, [lesson, lessonProgress, initialTab]);

  const setInitialTab = () => {
    const status = lessonProgress?.progressStatus;

    switch (status) {
      case LessonProgressStatus.PURCHASED:
        if (lesson.exam) {
          setActiveTab("exam");
        } else {
          setActiveTab("video");
        }
        break;
      case LessonProgressStatus.EXAM_PASSED:
        setActiveTab("video");
        break;
      case LessonProgressStatus.VIDEO_WATCHED:
        if (lesson.assignment) {
          setActiveTab("assignment");
        } else {
          setActiveTab("video");
        }
        break;
      default:
        setActiveTab("overview");
    }
  };

  const loadExamData = async () => {
    try {
      // Use the new lesson-specific exam endpoint
      const response = await studentAPI.lessons.getExam(lesson.id);
      setExamData(response.data);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل بيانات الامتحان"));
    }
  };

  const loadAssignmentData = async () => {
    try {
      // Use the new lesson-specific assignment endpoint
      const response = await studentAPI.lessons.getAssignment(lesson.id);
      setAssignmentData(response.data);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل بيانات الواجب"));
    }
  };

  const handleExamSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await examAPI.exams.submit(lesson.exam.id, examAnswers);
      setExamResult(response.data);

      if (response.data.passed) {
        toast.success("تهانينا! لقد اجتزت الامتحان بنجاح");
        onProgressUpdate();
        setActiveTab("video");
      } else {
        toast.error(`لم تجتز الامتحان. درجتك: ${response.data.score}%`);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تقديم الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoEnd = () => {
    // Call the new backend endpoint to mark video as watched
    handleVideoComplete();
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentSubmission.trim()) {
      toast.error("يرجى كتابة إجابة الواجب");
      return;
    }

    try {
      setIsLoading(true);
      await assignmentAPI.assignments.submit(
        lesson.assignment.id,
        assignmentSubmission
      );
      toast.success("تم تقديم الواجب بنجاح");
      onProgressUpdate();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تقديم الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoComplete = async () => {
    try {
      await studentAPI.lessons.markVideoWatched(lesson.id);
      setVideoWatched(true);
      onProgressUpdate(); // Refresh progress to enable assignment tab
      toast.success("تم تسجيل مشاهدة الفيديو");

      // Auto-switch to assignment tab if available
      if (
        lesson.assignment &&
        canAccessLessonPart(
          LessonProgressStatus.VIDEO_WATCHED,
          "assignment",
          !!lesson.exam,
          !!lesson.assignment
        )
      ) {
        setActiveTab("assignment");
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تسجيل مشاهدة الفيديو"));
    }
  };

  const canAccessTab = (tab) => {
    const status = lessonProgress?.progressStatus;

    return canAccessLessonPart(status, tab, !!lesson.exam, !!lesson.assignment);
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case "exam":
        return <FaQuestionCircle className="w-4 h-4" />;
      case "video":
        return <FaPlay className="w-4 h-4" />;
      case "assignment":
        return <FaFileAlt className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    // <div className="min-h-screen bg-gray-50">
    //   {/* Header */}
    //   <div className="bg-white shadow-sm border-b">
    //     <div className="max-w-7xl mx-auto px-4 py-4">
    //       <div className="flex items-center justify-between">
    //         <div className="flex items-center gap-4">
    //           <button
    //             onClick={onBack}
    //             className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
    //           >
    //             <FaArrowLeft className="w-4 h-4" />
    //             العودة للكورس
    //           </button>
    //           <div>
    //             <h1 className="bold-24 text-gray-900">{lesson.name}</h1>
    //             <p className="regular-14 text-gray-600">
    //               الحالة: {getProgressText(lessonProgress?.progressStatus)}
    //             </p>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>

    //   {/* Navigation Tabs */}
    //   <div className="bg-white border-b">
    //     <div className="max-w-7xl mx-auto px-4">
    //       <nav className="flex space-x-8 space-x-reverse">
    //         <button
    //           onClick={() => setActiveTab("overview")}
    //           className={`py-4 px-2 border-b-2 font-medium text-sm ${
    //             activeTab === "overview"
    //               ? "border-accent text-accent"
    //               : "border-transparent text-gray-500 hover:text-gray-700"
    //           }`}
    //         >
    //           نظرة عامة
    //         </button>

    //         {lesson.exam && (
    //           <button
    //             onClick={() => canAccessTab("exam") && setActiveTab("exam")}
    //             disabled={!canAccessTab("exam")}
    //             className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
    //               activeTab === "exam"
    //                 ? "border-accent text-accent"
    //                 : canAccessTab("exam")
    //                   ? "border-transparent text-gray-500 hover:text-gray-700"
    //                   : "border-transparent text-gray-300 cursor-not-allowed"
    //             }`}
    //           >
    //             {getTabIcon("exam")}
    //             الامتحان
    //           </button>
    //         )}

    //         <button
    //           onClick={() => canAccessTab("video") && setActiveTab("video")}
    //           disabled={!canAccessTab("video")}
    //           className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
    //             activeTab === "video"
    //               ? "border-accent text-accent"
    //               : canAccessTab("video")
    //                 ? "border-transparent text-gray-500 hover:text-gray-700"
    //                 : "border-transparent text-gray-300 cursor-not-allowed"
    //           }`}
    //         >
    //           {getTabIcon("video")}
    //           الفيديو
    //         </button>

    //         {lesson.assignment && (
    //           <button
    //             onClick={() =>
    //               canAccessTab("assignment") && setActiveTab("assignment")
    //             }
    //             disabled={!canAccessTab("assignment")}
    //             className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
    //               activeTab === "assignment"
    //                 ? "border-accent text-accent"
    //                 : canAccessTab("assignment")
    //                   ? "border-transparent text-gray-500 hover:text-gray-700"
    //                   : "border-transparent text-gray-300 cursor-not-allowed"
    //             }`}
    //           >
    //             {getTabIcon("assignment")}
    //             الواجب
    //           </button>
    //         )}
    //       </nav>
    //     </div>
    //   </div>

    //   {/* Content */}
    //   <div className="max-w-7xl mx-auto px-4 py-8">
    //     {activeTab === "overview" && (
    //       <OverviewTab lesson={lesson} lessonProgress={lessonProgress} />
    //     )}

    //     {activeTab === "exam" && lesson.exam && (
    //       <ExamTab
    //         examData={examData}
    //         examAnswers={examAnswers}
    //         setExamAnswers={setExamAnswers}
    //         examResult={examResult}
    //         onSubmit={handleExamSubmit}
    //         isLoading={isLoading}
    //       />
    //     )}

    //     {activeTab === "video" && (
    //       <VideoTab
    //         lesson={lesson}
    //         onVideoEnd={handleVideoEnd}
    //         videoWatched={videoWatched}
    //       />
    //     )}

    //     {activeTab === "assignment" && lesson.assignment && (
    //       <AssignmentTab
    //         assignmentData={assignmentData}
    //         submission={assignmentSubmission}
    //         setSubmission={setAssignmentSubmission}
    //         onSubmit={handleAssignmentSubmit}
    //         isLoading={isLoading}
    //       />
    //     )}
    //   </div>
    // </div>
    <></>
  );
};

// Helper function to get progress text (using imported helper)
const getProgressText = (status) => {
  return formatProgressStatus(status);
};

// Overview Tab Component
const OverviewTab = ({ lesson, lessonProgress }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="bold-24 text-gray-900 mb-4">نظرة عامة على الدرس</h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="bold-18 text-gray-900 mb-3">تفاصيل الدرس</h3>
        <p className="regular-16 text-gray-600 mb-4">{lesson.description}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bold-14 text-gray-700">السعر:</span>
            <span className="regular-14 text-gray-600">
              {lesson.price} جنيه
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bold-14 text-gray-700">الحالة:</span>
            <span className="regular-14 text-gray-600">
              {getProgressText(lessonProgress?.progressStatus)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="bold-18 text-gray-900 mb-3">مكونات الدرس</h3>
        <div className="space-y-3">
          {lesson.exam && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <FaQuestionCircle className="w-5 h-5 text-blue-500" />
              <span className="regular-14 text-gray-700">امتحان</span>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <FaPlay className="w-5 h-5 text-green-500" />
            <span className="regular-14 text-gray-700">فيديو تعليمي</span>
          </div>
          {lesson.assignment && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <FaFileAlt className="w-5 h-5 text-purple-500" />
              <span className="regular-14 text-gray-700">واجب</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Exam Tab Component
const ExamTab = ({
  examData,
  examAnswers,
  setExamAnswers,
  examResult,
  onSubmit,
  isLoading,
}) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    if (examStarted && examData?.timeLimitMinutes && !examResult) {
      const totalSeconds = examData.timeLimitMinutes * 60;
      setTimeLeft(totalSeconds);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onSubmit(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examStarted, examData, examResult, onSubmit]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!examData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <FaClock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="regular-16 text-gray-600">جاري تحميل الامتحان...</p>
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
          <h2 className="bold-24 text-gray-900 mb-2">
            {examResult.passed ? "تهانينا!" : "لم تجتز الامتحان"}
          </h2>
          <p className="regular-16 text-gray-600 mb-4">
            درجتك: {examResult.score}% من {examData.passingScore}% مطلوبة للنجاح
          </p>
          {examResult.passed && (
            <p className="regular-14 text-green-600">
              يمكنك الآن مشاهدة الفيديو
            </p>
          )}

          {/* Show detailed results if available */}
          {examResult.questionResults && (
            <div className="mt-6 text-right">
              <h3 className="bold-18 text-gray-900 mb-4">تفاصيل النتائج</h3>
              <div className="space-y-3">
                {Object.entries(examResult.questionResults).map(
                  ([questionId, result], index) => (
                    <div
                      key={questionId}
                      className={`p-3 rounded-lg ${result.correct ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="regular-14">السؤال {index + 1}</span>
                        <span
                          className={`bold-14 ${result.correct ? "text-green-600" : "text-red-600"}`}
                        >
                          {result.correct ? "صحيح" : "خطأ"} ({result.score}/
                          {result.maxScore})
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <FaPlay className="w-16 h-16 text-accent mx-auto mb-4" />
          <h2 className="bold-24 text-gray-900 mb-4">{examData.title}</h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="bold-16 text-gray-900">
                  {examData.questions?.length || 0}
                </div>
                <div className="regular-12 text-gray-600">عدد الأسئلة</div>
              </div>
              <div>
                <div className="bold-16 text-gray-900">
                  {examData.timeLimitMinutes} دقيقة
                </div>
                <div className="regular-12 text-gray-600">الوقت المحدد</div>
              </div>
              <div>
                <div className="bold-16 text-gray-900">
                  {examData.passingScore}%
                </div>
                <div className="regular-12 text-gray-600">درجة النجاح</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExamStarted(true)}
            className="bg-accent text-white px-8 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors"
          >
            بدء الامتحان
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h2 className="bold-24 text-gray-900">{examData.title}</h2>
        {timeLeft !== null && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft < 300
                ? "bg-red-50 text-red-600"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            <FaClock className="w-4 h-4" />
            <span className="bold-16">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {examData.questions?.map((question, index) => (
          <QuestionComponent
            key={question.id}
            question={question}
            questionIndex={index}
            examAnswers={examAnswers}
            setExamAnswers={setExamAnswers}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="bg-accent text-white px-8 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "جاري التقديم..." : "تقديم الامتحان"}
        </button>
      </div>
    </div>
  );
};

// Question Component for different question types
const QuestionComponent = ({
  question,
  questionIndex,
  examAnswers,
  setExamAnswers,
}) => {
  const handleAnswerChange = (answerId, checked = true) => {
    if (question.questionType === "MULTIPLE_CHOICE") {
      const currentAnswers = examAnswers[question.id] || [];
      if (checked) {
        setExamAnswers({
          ...examAnswers,
          [question.id]: [...currentAnswers, answerId],
        });
      } else {
        setExamAnswers({
          ...examAnswers,
          [question.id]: currentAnswers.filter((id) => id !== answerId),
        });
      }
    } else {
      // SINGLE_CHOICE or TRUE_FALSE
      setExamAnswers({
        ...examAnswers,
        [question.id]: answerId,
      });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="bold-16 text-gray-900 flex-1">
          السؤال {questionIndex + 1}: {question.questionText}
        </h3>
        <div className="text-sm text-gray-500 mr-4">{question.points} نقطة</div>
      </div>

      <div className="space-y-2">
        {question.answers?.map((answer) => {
          const isChecked =
            question.questionType === "MULTIPLE_CHOICE"
              ? (examAnswers[question.id] || []).includes(answer.id)
              : examAnswers[question.id] === answer.id;

          return (
            <label
              key={answer.id}
              className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded"
            >
              <input
                type={
                  question.questionType === "MULTIPLE_CHOICE"
                    ? "checkbox"
                    : "radio"
                }
                name={`question_${question.id}`}
                checked={isChecked}
                onChange={(e) =>
                  handleAnswerChange(answer.id, e.target.checked)
                }
                className="w-4 h-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <span className="regular-14 text-gray-700">
                {answer.answerText}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

// Video Tab Component
const VideoTab = ({ lesson, onVideoEnd, videoWatched }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="bold-24 text-gray-900 mb-6">فيديو الدرس</h2>

    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
      <video
        src={lesson.videoUrl}
        controls
        className="w-full h-full"
        onEnded={onVideoEnd}
        poster={lesson.photoUrl}
      >
        متصفحك لا يدعم تشغيل الفيديو
      </video>
    </div>

    {videoWatched && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <FaCheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
        <p className="bold-14 text-green-700">تم تسجيل مشاهدة الفيديو بنجاح</p>
      </div>
    )}
  </div>
);

// Assignment Tab Component
const AssignmentTab = ({
  assignmentData,
  submission,
  setSubmission,
  onSubmit,
  isLoading,
}) => {
  if (!assignmentData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <FaClock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="regular-16 text-gray-600">جاري تحميل الواجب...</p>
        </div>
      </div>
    );
  }

  // Check if assignment is already submitted
  const isSubmitted =
    assignmentData.submissionText && assignmentData.submissionDate;
  const isOverdue =
    assignmentData.dueDate && new Date(assignmentData.dueDate) < new Date();
  const isGraded =
    assignmentData.grade !== null && assignmentData.grade !== undefined;

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = () => {
    if (!assignmentData.dueDate) return "غير محدد";

    const now = new Date();
    const due = new Date(assignmentData.dueDate);
    const diff = due - now;

    if (diff <= 0) return "منتهي الصلاحية";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} يوم و ${hours} ساعة`;
    } else {
      return `${hours} ساعة`;
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-6">
          <FaClipboardCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="bold-24 text-gray-900 mb-2">تم تقديم الواجب</h2>
          <p className="regular-16 text-gray-600">
            تم تقديم واجبك بنجاح في {formatDate(assignmentData.submissionDate)}
          </p>
        </div>

        {/* Assignment Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="bold-18 text-gray-900 mb-3">{assignmentData.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="w-4 h-4 text-blue-500" />
              <span className="regular-12 text-gray-600">
                موعد التسليم: {formatDate(assignmentData.dueDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaAward className="w-4 h-4 text-green-500" />
              <span className="regular-12 text-gray-600">
                النقاط القصوى: {assignmentData.maxPoints}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaClipboardCheck className="w-4 h-4 text-purple-500" />
              <span className="regular-12 text-gray-600">
                الحالة: {isGraded ? "تم التقييم" : "في انتظار التقييم"}
              </span>
            </div>
          </div>
          {assignmentData.description && (
            <p className="regular-14 text-gray-600 whitespace-pre-wrap">
              {assignmentData.description}
            </p>
          )}
        </div>

        {/* Submitted Answer */}
        <div className="mb-6">
          <h4 className="bold-16 text-gray-900 mb-3">إجابتك المقدمة:</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="regular-14 text-gray-700 whitespace-pre-wrap">
              {assignmentData.submissionText}
            </p>
          </div>
        </div>

        {/* Grade and Feedback */}
        {isGraded && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="bold-16 text-green-900">النتيجة</h4>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full bold-14">
                {assignmentData.grade} / {assignmentData.maxPoints}
              </span>
            </div>
            {assignmentData.feedback && (
              <div>
                <h5 className="bold-14 text-green-900 mb-2">تعليق المدرس:</h5>
                <p className="regular-14 text-green-700">
                  {assignmentData.feedback}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="bold-24 text-gray-900">{assignmentData.title}</h2>
        {isOverdue && (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
            منتهي الصلاحية
          </span>
        )}
      </div>

      {/* Assignment Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="w-4 h-4 text-blue-500" />
            <div>
              <div className="regular-12 text-gray-600">موعد التسليم</div>
              <div className="bold-12 text-gray-900">
                {formatDate(assignmentData.dueDate)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaClock
              className={`w-4 h-4 ${isOverdue ? "text-red-500" : "text-orange-500"}`}
            />
            <div>
              <div className="regular-12 text-gray-600">الوقت المتبقي</div>
              <div
                className={`bold-12 ${isOverdue ? "text-red-600" : "text-gray-900"}`}
              >
                {getTimeRemaining()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaAward className="w-4 h-4 text-green-500" />
            <div>
              <div className="regular-12 text-gray-600">النقاط القصوى</div>
              <div className="bold-12 text-gray-900">
                {assignmentData.maxPoints}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Description */}
      {assignmentData.description && (
        <div className="mb-6">
          <h3 className="bold-18 text-gray-900 mb-3">تعليمات الواجب</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="regular-16 text-gray-700 whitespace-pre-wrap">
              {assignmentData.description}
            </p>
          </div>
        </div>
      )}

      {/* Submission Form */}
      <div className="mb-6">
        <label className="block bold-16 text-gray-900 mb-3">إجابتك:</label>
        <textarea
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          placeholder="اكتب إجابتك هنا..."
          disabled={isOverdue}
        />
        {isOverdue && (
          <p className="mt-2 text-sm text-red-600">
            لا يمكن تقديم الواجب بعد انتهاء الموعد المحدد
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={onSubmit}
          disabled={isLoading || !submission.trim() || isOverdue}
          className="bg-accent text-white px-8 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "جاري التقديم..." : "تقديم الواجب"}
        </button>
      </div>
    </div>
  );
};

export default LessonViewer;
