"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaBookOpen,
  FaArrowLeft,
  FaPlay,
  FaChalkboardTeacher,
  FaStar,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import components
import LessonCard from "./components/LessonCard";
import PaymentModal from "./components/PaymentModal";
import { studentAPI, handleAPIError } from "../../../../services/studentAPI";

const CourseDetails = () => {
  const params = useParams();
  const router = useRouter();
  const { instructorId, courseId } = params;

  const [course, setCourse] = useState(null);
  const [instructorData, setInstructorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // جلب بيانات الكورس من API المدرس
  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          await studentAPI.profile.getInstructorFullProfile(instructorId);
        const instructorData = response.data;

        setInstructorData(instructorData);

        if (instructorData && instructorData.courses) {
          const foundCourse = instructorData.courses.find(
            (c) => c.id === courseId
          );
          if (foundCourse) {
            setCourse(foundCourse);
          } else {
            setError("لم يتم العثور على الكورس");
          }
        } else {
          setError("لم يتم العثور على الكورس");
        }
      } catch (err) {
        console.error("خطأ في جلب بيانات الكورس:", err);
        setError(handleAPIError(err, "حدث خطأ أثناء تحميل بيانات الكورس"));
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

  const handleViewLesson = (lesson) => {
    // Navigate to the new lesson page
    router.push(
      `/instructors/${instructorId}/courses/${courseId}/lessons/${lesson.id}`
    );
  };

  const handlePaymentSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShowPaymentModal(false);
    toast.success("تم شراء الدرس بنجاح!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-main flexCenter">
        <div className="flexCenter flex-col">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 regular-16 text-gray-600">
            جاري تحميل بيانات الكورس...
          </p>
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
            onClick={() => router.push("/instructors")}
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

  return (
    <div className="min-h-screen bg-main py-8">
      <div className="max-container padding-container">
        {/* Enhanced Navigation */}
        <div className="mb-8 space-y-4">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              الرئيسية
            </button>
            <span className="text-gray-400 mx-2">/</span>
            <button
              onClick={() => router.push("/instructors")}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              المدرسين
            </button>
            <span className="text-gray-400 mx-2">/</span>
            <button
              onClick={() => router.push(`/instructors/${instructorId}`)}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              {instructorData?.fullname || "المدرس"}
            </button>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-gray-900 font-bold">
              {course?.name || "الكورس"}
            </span>
          </nav>

          {/* Back Button */}
          <button
            onClick={() => router.push("/instructors")}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-300 text-gray-700 hover:text-blue-600 shadow-sm hover:shadow-md group"
          >
            <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">العودة للمدرسين</span>
          </button>
        </div>

        {/* Enhanced Course Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 md:p-12 mb-8 relative overflow-hidden group hover:shadow-3xl transition-all duration-500">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl"></div>

          <div className="relative flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
            {/* Enhanced Course Image */}
            <div className="relative group/image">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-30 group-hover/image:opacity-50 transition-opacity"></div>
              <div className="relative w-56 h-56 lg:w-64 lg:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-xl flex-shrink-0">
                {course.photoUrl ? (
                  <img
                    src={course.photoUrl}
                    alt={course.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <FaBookOpen className="w-20 h-20 lg:w-24 lg:h-24 text-gray-400" />
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-2xl border-4 border-blue-400/30 animate-ping"></div>
              <div className="absolute inset-2 rounded-2xl border-4 border-purple-400/20 animate-ping animation-delay-75"></div>
            </div>

            {/* Enhanced Course Info */}
            <div className="flex-1 text-center lg:text-right space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <FaBookOpen className="w-4 h-4" />
                كورس متاح
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {course.name}
              </h1>

              <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {course.description || "وصف الكورس غير متاح"}
              </p>

              {/* Enhanced Course Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <FaPlay className="w-8 h-8 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl font-bold mb-1">
                      {course.lessons?.length || 0}
                    </div>
                    <div className="text-sm opacity-90">درس</div>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <FaChalkboardTeacher className="w-8 h-8 mx-auto mb-3 opacity-80" />
                    <div className="text-lg font-bold mb-1">المدرس</div>
                    <div className="text-sm opacity-90">
                      {instructorData?.fullname || "غير محدد"}
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden md:col-span-2 lg:col-span-1">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <FaStar className="w-8 h-8 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl font-bold mb-1">متاح</div>
                    <div className="text-sm opacity-90">الحالة</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="bold-24 text-gray-900 mb-6">دروس الكورس</h2>

          <div className="grid grid-cols-1 gap-6">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  instructorId={instructorId}
                  onPurchase={handlePurchaseLesson}
                  onViewLesson={handleViewLesson}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <FaBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="bold-18 text-gray-600 mb-2">لا توجد حصص</h3>
                <p className="regular-14 text-gray-500">
                  لم يتم إضافة حصص لهذا الكورس بعد
                </p>
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
