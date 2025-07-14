'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaBookOpen, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import LessonCard from './components/LessonCard';
import LessonViewer from './components/LessonViewer';
import PaymentModal from './components/PaymentModal';
import { lessonAPI, handleAPIError } from './services/lessonAPI';

const CourseDetails = () => {
  const params = useParams();
  const router = useRouter();
  const { instructorId, courseId } = params;

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedLessonProgress, setSelectedLessonProgress] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLessonViewer, setShowLessonViewer] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // جلب بيانات الكورس من API المدرس
  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await lessonAPI.courses.getInstructorProfile(instructorId);
        const instructorData = response.data;

        if (instructorData && instructorData.courses) {
          const foundCourse = instructorData.courses.find(c => c.id === courseId);
          if (foundCourse) {
            setCourse(foundCourse);
          } else {
            setError('لم يتم العثور على الكورس');
          }
        } else {
          setError('لم يتم العثور على الكورس');
        }
      } catch (err) {
        console.error('خطأ في جلب بيانات الكورس:', err);
        setError(handleAPIError(err, 'حدث خطأ أثناء تحميل بيانات الكورس'));
      } finally {
        setIsLoading(false);
      }
    };

    if (instructorId && courseId) {
      fetchCourse();
    }
  }, [instructorId, courseId, refreshTrigger]);

  // Handler functions
  const handlePurchaseLesson = (lesson) => {
    setSelectedLesson(lesson);
    setShowPaymentModal(true);
  };

  const handleViewLesson = (lesson, lessonProgress) => {
    setSelectedLesson(lesson);
    setSelectedLessonProgress(lessonProgress);
    setShowLessonViewer(true);
  };

  const handlePaymentSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowPaymentModal(false);
    toast.success('تم شراء الدرس بنجاح!');
  };

  const handleProgressUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBackFromViewer = () => {
    setShowLessonViewer(false);
    setSelectedLesson(null);
    setSelectedLessonProgress(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-main flexCenter">
        <div className="flexCenter flex-col">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 regular-16 text-gray-600">جاري تحميل بيانات الكورس...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-main flexCenter">
        <div className="text-center">
          <FaBookOpen className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="bold-24 text-gray-600 mb-4">{error}</h2>
          <button
            onClick={() => router.push('/instructors')}
            className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors flexCenter gap-2"
          >
            <FaArrowLeft className="w-4 h-4" />
            العودة للبحث
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  // Show lesson viewer if a lesson is selected
  if (showLessonViewer && selectedLesson) {
    return (
      <LessonViewer
        lesson={selectedLesson}
        lessonProgress={selectedLessonProgress}
        onBack={handleBackFromViewer}
        onProgressUpdate={handleProgressUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-main py-8">
      <div className="max-container padding-container">
        {/* Back Button */}
        <button
          onClick={() => router.push('/instructors')}
          className="flexCenter gap-2 text-accent hover:text-opacity-80 transition-colors mb-6"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="regular-16">العودة للمدرسين</span>
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Course Image */}
            <div className="w-48 h-48 rounded-xl overflow-hidden bg-gray-100 flexCenter flex-shrink-0">
              {course.photoUrl ? (
                <img
                  src={course.photoUrl}
                  alt={course.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <FaBookOpen className="w-24 h-24 text-gray-400" />
            </div>

            {/* Course Info */}
            <div className="flex-1 text-center lg:text-right">
              <h1 className="bold-32 text-gray-900 mb-4">{course.name}</h1>
              <p className="regular-18 text-gray-600 mb-6 max-w-2xl">{course.description}</p>

              {/* Course Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="bold-20 text-accent">{course.lessons?.length || 0}</div>
                  <div className="regular-14 text-gray-600">حصة</div>
                </div>
                <div className="text-center">
                  <div className="bold-20 text-accent">المدرس</div>
                  <div className="regular-14 text-gray-600">{instructorId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="bold-24 text-gray-900 mb-6">دروس الكورس</h2>

          <div className="flex gap-6">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id || index}
                  lesson={lesson}
                  onPurchase={handlePurchaseLesson}
                  onViewLesson={handleViewLesson}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <FaBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="bold-18 text-gray-600 mb-2">لا توجد حصص</h3>
                <p className="regular-14 text-gray-500">لم يتم إضافة حصص لهذا الكورس بعد</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          lesson={selectedLesson}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
};

export default CourseDetails;