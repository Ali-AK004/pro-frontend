import React, { useState, useEffect } from 'react';
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
  FaDownload
} from 'react-icons/fa';
import { lessonAPI, handleAPIError, LessonProgressStatus } from '../services/lessonAPI';
import { toast } from 'react-toastify';

const LessonCard = ({ lesson, onPurchase, onViewLesson }) => {
  const [accessStatus, setAccessStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(null);

  useEffect(() => {
    checkLessonAccess();
  }, [lesson.id]);

  const checkLessonAccess = async () => {
    try {
      setIsLoading(true);
      const response = await lessonAPI.payment.checkAccess(lesson.id);
      setAccessStatus(response.data);
      
      // If has access, get lesson details for progress
      if (response.data.hasAccess) {
        const lessonDetails = await lessonAPI.lessons.getDetails(lesson.id);
        setLessonProgress(lessonDetails.data);
      }
    } catch (error) {
      // If error, assume no access
      setAccessStatus({ hasAccess: false });
    } finally {
      setIsLoading(false);
    }
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
    switch (status) {
      case LessonProgressStatus.PURCHASED:
        return 'تم الشراء - ابدأ الامتحان';
      case LessonProgressStatus.EXAM_PASSED:
        return 'تم اجتياز الامتحان - شاهد الفيديو';
      case LessonProgressStatus.VIDEO_WATCHED:
        return 'تم مشاهدة الفيديو - حل الواجب';
      case LessonProgressStatus.ASSIGNMENT_DONE:
        return 'مكتمل';
      default:
        return 'غير متاح';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case LessonProgressStatus.PURCHASED:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case LessonProgressStatus.EXAM_PASSED:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case LessonProgressStatus.VIDEO_WATCHED:
        return 'text-green-600 bg-green-50 border-green-200';
      case LessonProgressStatus.ASSIGNMENT_DONE:
        return 'text-green-700 bg-green-100 border-green-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const canAccessPart = (part) => {
    if (!lessonProgress) return false;
    
    const status = lessonProgress.progressStatus;
    
    switch (part) {
      case 'exam':
        return status === LessonProgressStatus.PURCHASED;
      case 'video':
        return [
          LessonProgressStatus.EXAM_PASSED,
          LessonProgressStatus.VIDEO_WATCHED,
          LessonProgressStatus.ASSIGNMENT_DONE
        ].includes(status);
      case 'assignment':
        return [
          LessonProgressStatus.VIDEO_WATCHED,
          LessonProgressStatus.ASSIGNMENT_DONE
        ].includes(status);
      default:
        return false;
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
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
      {/* Lesson Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="bold-18 text-gray-900 mb-2 flex items-center gap-2">
            {lesson.name}
            {accessStatus?.hasAccess && getProgressIcon(lessonProgress?.progressStatus)}
          </h3>
          <p className="regular-14 text-gray-600 mb-3">
            {lesson.description || 'وصف الدرس غير متاح'}
          </p>
        </div>
        
        {/* Price Badge */}
        <div className="bg-accent text-white px-3 py-1 rounded-full bold-14 flex items-center gap-1">
          <FaDollarSign className="w-3 h-3" />
          {lesson.price} جنيه
        </div>
      </div>

      {/* Progress Status */}
      {accessStatus?.hasAccess && lessonProgress && (
        <div className={`mb-4 px-3 py-2 rounded-lg border ${getProgressColor(lessonProgress.progressStatus)}`}>
          <div className="flex items-center gap-2">
            {getProgressIcon(lessonProgress.progressStatus)}
            <span className="bold-14">{getProgressText(lessonProgress.progressStatus)}</span>
          </div>
        </div>
      )}

      {/* Lesson Components */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Exam */}
        <div className={`p-3 rounded-lg border text-center ${
          lesson.exam 
            ? (canAccessPart('exam') ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200')
            : 'bg-gray-100 border-gray-300'
        }`}>
          <FaQuestionCircle className={`w-5 h-5 mx-auto mb-1 ${
            lesson.exam 
              ? (canAccessPart('exam') ? 'text-blue-500' : 'text-gray-400')
              : 'text-gray-300'
          }`} />
          <p className="regular-12 text-gray-600">
            {lesson.exam ? 'امتحان' : 'لا يوجد امتحان'}
          </p>
        </div>

        {/* Video */}
        <div className={`p-3 rounded-lg border text-center ${
          canAccessPart('video') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <FaPlay className={`w-5 h-5 mx-auto mb-1 ${
            canAccessPart('video') ? 'text-green-500' : 'text-gray-400'
          }`} />
          <p className="regular-12 text-gray-600">فيديو</p>
        </div>

        {/* Assignment */}
        <div className={`p-3 rounded-lg border text-center ${
          lesson.assignment 
            ? (canAccessPart('assignment') ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200')
            : 'bg-gray-100 border-gray-300'
        }`}>
          <FaFileAlt className={`w-5 h-5 mx-auto mb-1 ${
            lesson.assignment 
              ? (canAccessPart('assignment') ? 'text-purple-500' : 'text-gray-400')
              : 'text-gray-300'
          }`} />
          <p className="regular-12 text-gray-600">
            {lesson.assignment ? 'واجب' : 'لا يوجد واجب'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!accessStatus?.hasAccess ? (
          <button
            onClick={() => onPurchase(lesson)}
            className="flex-1 bg-accent text-white py-3 px-4 rounded-lg bold-16 hover:bg-opacity-90 transition-colors flexCenter gap-2"
          >
            <FaShoppingCart className="w-4 h-4" />
            شراء الدرس
          </button>
        ) : (
          <button
            onClick={() => onViewLesson(lesson, lessonProgress)}
            className="flex-1 bg-secondary text-white py-3 px-4 rounded-lg bold-16 hover:bg-opacity-90 transition-colors flexCenter gap-2"
          >
            <FaEye className="w-4 h-4" />
            عرض الدرس
          </button>
        )}
      </div>

      {/* Access Expiry Info */}
      {accessStatus?.hasAccess && accessStatus?.expiryDate && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
          <p className="regular-12 text-yellow-700">
            ينتهي الوصول في: {new Date(accessStatus.expiryDate).toLocaleDateString('ar-EG')}
          </p>
        </div>
      )}
    </div>
  );
};

export default LessonCard;
