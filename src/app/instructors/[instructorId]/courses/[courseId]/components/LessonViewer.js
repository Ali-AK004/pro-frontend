import React, { useState, useEffect } from 'react';
import { 
  FaPlay, 
  FaQuestionCircle, 
  FaFileAlt, 
  FaCheck, 
  FaTimes, 
  FaClock,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { lessonAPI, handleAPIError, LessonProgressStatus } from '../services/lessonAPI';
import { toast } from 'react-toastify';

const LessonViewer = ({ lesson, lessonProgress, onBack, onProgressUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [examData, setExamData] = useState(null);
  const [assignmentData, setAssignmentData] = useState(null);
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [assignmentSubmission, setAssignmentSubmission] = useState('');
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
    
    // Set initial tab based on progress
    setInitialTab();
  }, [lesson, lessonProgress]);

  const setInitialTab = () => {
    const status = lessonProgress?.progressStatus;
    
    switch (status) {
      case LessonProgressStatus.PURCHASED:
        if (lesson.exam) {
          setActiveTab('exam');
        } else {
          setActiveTab('video');
        }
        break;
      case LessonProgressStatus.EXAM_PASSED:
        setActiveTab('video');
        break;
      case LessonProgressStatus.VIDEO_WATCHED:
        if (lesson.assignment) {
          setActiveTab('assignment');
        } else {
          setActiveTab('video');
        }
        break;
      default:
        setActiveTab('overview');
    }
  };

  const loadExamData = async () => {
    try {
      const response = await lessonAPI.exams.getExam(lesson.exam.id);
      setExamData(response.data);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل بيانات الامتحان'));
    }
  };

  const loadAssignmentData = async () => {
    try {
      const response = await lessonAPI.assignments.getAssignment(lesson.assignment.id);
      setAssignmentData(response.data);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل بيانات الواجب'));
    }
  };

  const handleExamSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await lessonAPI.exams.submitExam(lesson.exam.id, examAnswers);
      setExamResult(response.data);
      
      if (response.data.passed) {
        toast.success('تهانينا! لقد اجتزت الامتحان بنجاح');
        onProgressUpdate();
        setActiveTab('video');
      } else {
        toast.error(`لم تجتز الامتحان. درجتك: ${response.data.score}%`);
      }
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تقديم الامتحان'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoEnd = () => {
    setVideoWatched(true);
    toast.success('تم تسجيل مشاهدة الفيديو');
    onProgressUpdate();
    
    if (lesson.assignment) {
      setActiveTab('assignment');
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentSubmission.trim()) {
      toast.error('يرجى كتابة إجابة الواجب');
      return;
    }

    try {
      setIsLoading(true);
      await lessonAPI.assignments.submitAssignment(lesson.assignment.id, assignmentSubmission);
      toast.success('تم تقديم الواجب بنجاح');
      onProgressUpdate();
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تقديم الواجب'));
    } finally {
      setIsLoading(false);
    }
  };

  const canAccessTab = (tab) => {
    const status = lessonProgress?.progressStatus;
    
    switch (tab) {
      case 'exam':
        return status === LessonProgressStatus.PURCHASED && lesson.exam;
      case 'video':
        return [
          LessonProgressStatus.EXAM_PASSED,
          LessonProgressStatus.VIDEO_WATCHED,
          LessonProgressStatus.ASSIGNMENT_DONE
        ].includes(status) || (!lesson.exam && status === LessonProgressStatus.PURCHASED);
      case 'assignment':
        return [
          LessonProgressStatus.VIDEO_WATCHED,
          LessonProgressStatus.ASSIGNMENT_DONE
        ].includes(status) && lesson.assignment;
      default:
        return true;
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'exam':
        return <FaQuestionCircle className="w-4 h-4" />;
      case 'video':
        return <FaPlay className="w-4 h-4" />;
      case 'assignment':
        return <FaFileAlt className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                العودة للكورس
              </button>
              <div>
                <h1 className="bold-24 text-gray-900">{lesson.name}</h1>
                <p className="regular-14 text-gray-600">
                  الحالة: {getProgressText(lessonProgress?.progressStatus)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 space-x-reverse">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              نظرة عامة
            </button>
            
            {lesson.exam && (
              <button
                onClick={() => canAccessTab('exam') && setActiveTab('exam')}
                disabled={!canAccessTab('exam')}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'exam'
                    ? 'border-accent text-accent'
                    : canAccessTab('exam')
                    ? 'border-transparent text-gray-500 hover:text-gray-700'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
                }`}
              >
                {getTabIcon('exam')}
                الامتحان
              </button>
            )}
            
            <button
              onClick={() => canAccessTab('video') && setActiveTab('video')}
              disabled={!canAccessTab('video')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'video'
                  ? 'border-accent text-accent'
                  : canAccessTab('video')
                  ? 'border-transparent text-gray-500 hover:text-gray-700'
                  : 'border-transparent text-gray-300 cursor-not-allowed'
              }`}
            >
              {getTabIcon('video')}
              الفيديو
            </button>
            
            {lesson.assignment && (
              <button
                onClick={() => canAccessTab('assignment') && setActiveTab('assignment')}
                disabled={!canAccessTab('assignment')}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'assignment'
                    ? 'border-accent text-accent'
                    : canAccessTab('assignment')
                    ? 'border-transparent text-gray-500 hover:text-gray-700'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
                }`}
              >
                {getTabIcon('assignment')}
                الواجب
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <OverviewTab lesson={lesson} lessonProgress={lessonProgress} />
        )}
        
        {activeTab === 'exam' && lesson.exam && (
          <ExamTab 
            examData={examData}
            examAnswers={examAnswers}
            setExamAnswers={setExamAnswers}
            examResult={examResult}
            onSubmit={handleExamSubmit}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === 'video' && (
          <VideoTab 
            lesson={lesson}
            onVideoEnd={handleVideoEnd}
            videoWatched={videoWatched}
          />
        )}
        
        {activeTab === 'assignment' && lesson.assignment && (
          <AssignmentTab 
            assignmentData={assignmentData}
            submission={assignmentSubmission}
            setSubmission={setAssignmentSubmission}
            onSubmit={handleAssignmentSubmit}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

// Helper function to get progress text
const getProgressText = (status) => {
  switch (status) {
    case LessonProgressStatus.PURCHASED:
      return 'تم الشراء';
    case LessonProgressStatus.EXAM_PASSED:
      return 'تم اجتياز الامتحان';
    case LessonProgressStatus.VIDEO_WATCHED:
      return 'تم مشاهدة الفيديو';
    case LessonProgressStatus.ASSIGNMENT_DONE:
      return 'مكتمل';
    default:
      return 'غير متاح';
  }
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
            <span className="regular-14 text-gray-600">{lesson.price} جنيه</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bold-14 text-gray-700">الحالة:</span>
            <span className="regular-14 text-gray-600">{getProgressText(lessonProgress?.progressStatus)}</span>
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
const ExamTab = ({ examData, examAnswers, setExamAnswers, examResult, onSubmit, isLoading }) => {
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
            {examResult.passed ? 'تهانينا!' : 'لم تجتز الامتحان'}
          </h2>
          <p className="regular-16 text-gray-600 mb-4">
            درجتك: {examResult.score}% من {examData.passingScore}% مطلوبة للنجاح
          </p>
          {examResult.passed && (
            <p className="regular-14 text-green-600">يمكنك الآن مشاهدة الفيديو</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="bold-24 text-gray-900">{examData.title}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>الوقت المحدد: {examData.timeLimitMinutes} دقيقة</span>
          <span>درجة النجاح: {examData.passingScore}%</span>
        </div>
      </div>

      <div className="space-y-6">
        {examData.questions?.map((question, index) => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="bold-16 text-gray-900 mb-3">
              السؤال {index + 1}: {question.questionText}
            </h3>

            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option}
                    checked={examAnswers[question.id] === option}
                    onChange={(e) => setExamAnswers({
                      ...examAnswers,
                      [question.id]: e.target.value
                    })}
                    className="w-4 h-4 text-accent"
                  />
                  <span className="regular-14 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onSubmit}
          disabled={isLoading || Object.keys(examAnswers).length !== examData.questions?.length}
          className="bg-accent text-white px-8 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري التقديم...' : 'تقديم الامتحان'}
        </button>
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
const AssignmentTab = ({ assignmentData, submission, setSubmission, onSubmit, isLoading }) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="bold-24 text-gray-900 mb-6">{assignmentData.title}</h2>

      <div className="mb-6">
        <h3 className="bold-18 text-gray-900 mb-3">تعليمات الواجب</h3>
        <p className="regular-16 text-gray-600 whitespace-pre-wrap">
          {assignmentData.description}
        </p>
      </div>

      <div className="mb-6">
        <label className="block bold-16 text-gray-900 mb-3">إجابتك:</label>
        <textarea
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          placeholder="اكتب إجابتك هنا..."
        />
      </div>

      <div className="text-center">
        <button
          onClick={onSubmit}
          disabled={isLoading || !submission.trim()}
          className="bg-accent text-white px-8 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري التقديم...' : 'تقديم الواجب'}
        </button>
      </div>
    </div>
  );
};

export default LessonViewer;
