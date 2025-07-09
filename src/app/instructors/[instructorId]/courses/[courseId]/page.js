'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaBookOpen, FaPlay, FaArrowLeft, FaShoppingCart, FaCreditCard, FaTag, FaImage, FaClock, FaUser, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const CourseDetails = () => {
  const params = useParams();
  const router = useRouter();
  const { instructorId, courseId } = params;

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // جلب بيانات الكورس من API المدرس
  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://localhost:8080/api/students/instructors/${instructorId}/full-profile`,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );

        if (response.data && response.data.courses) {
          const foundCourse = response.data.courses.find(c => c.id === courseId);
          console.log(response.data)
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
        setError('حدث خطأ أثناء تحميل بيانات الكورس');
      } finally {
        setIsLoading(false);
      }
    };

    if (instructorId && courseId) {
      fetchCourse();
    }
  }, [instructorId, courseId]);

  // فتح مودال الدفع لحصة معينة
  const handlePurchaseLesson = (lesson) => {
    setSelectedLesson(lesson);
    setShowPaymentModal(true);
    setPaymentResult(null);
  };

  // معالجة عملية الدفع
  const handlePayment = async () => {
  if (!paymentMethod) {
    alert('يرجى اختيار طريقة الدفع');
    return;
  }

  if (paymentMethod === 'ACCESS_CODE' && !accessCode.trim()) {
    alert('يرجى إدخال كود الوصول');
    return;
  }

  setIsProcessingPayment(true);

  try {
    const requestData = {
      lessonId: selectedLesson.id,
      accessCode: accessCode
    };

    console.log(requestData)

    const response = await axios.post(
      'http://localhost:8080/api/payments/access-lesson',
      JSON.stringify(requestData), // Explicitly stringify
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json', // Crucial header
          'Accept': 'application/json'
        }
      }
    );

    setPaymentResult({
      success: true,
      message: 'تم شراء الحصة بنجاح!',
      data: response.data
    });

  } catch (error) {
    console.error('Payment error:', error.response?.data || error.message);
    setPaymentResult({
      success: false,
      message: error.response?.data?.detail || 'حدث خطأ أثناء عملية الدفع',
      data: null
    });
  } finally {
    setIsProcessingPayment(false);
  }
};

  // إغلاق مودال الدفع
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedLesson(null);
    setPaymentMethod('');
    setAccessCode('');
    setPaymentResult(null);
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
          <h2 className="bold-24 text-gray-900 mb-6">الحصص المتاحة للشراء</h2>

          <div className="space-y-4">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => (
                <div
                  key={lesson.id || index}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="bold-18 text-gray-900 mb-2">
                        {lesson.name}
                      </h3>

                      <p className="regular-14 text-gray-600 mb-4">
                        {lesson.description || 'وصف الحصة غير متاح'}
                      </p>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => handlePurchaseLesson(lesson)}
                        className="bg-accent cursor-pointer text-white px-6 py-3 rounded-lg bold-14 hover:bg-opacity-90 transition-colors flexCenter gap-2 shadow-md hover:shadow-lg"
                      >
                        <FaShoppingCart className="w-4 h-4" />
                        شراء الحصة
                      </button>
                    </div>
                  </div>
                </div>
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
        {showPaymentModal && selectedLesson && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-50 flexCenter z-50">
            <div className="bg-white rounded-2xl p-8 max-w-[700px] w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="bold-24 text-gray-900 mb-6 text-center">شراء الحصة</h2>

              {/* Lesson Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="bold-16 text-gray-900 mb-3">تفاصيل الحصة</h3>
                <div className="space-y-2">
                  <div className="flexBetween">
                    <span className="regular-14 text-gray-600">الكورس:</span>
                    <span className="regular-14 text-gray-900">{course.name}</span>
                  </div>
                  <div className="flexBetween">
                    <span className="regular-14 text-gray-600">الحصة:</span>
                    <span className="regular-14 text-gray-900">{selectedLesson.name || 'درس'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="bold-16 text-gray-900 mb-4">طريقة الدفع</h3>

                <div className="space-y-3">
                  {/* Access Code Payment */}
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    paymentMethod === 'ACCESS_CODE' ? 'border-accent bg-accent bg-opacity-10' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ACCESS_CODE"
                      checked={paymentMethod === 'ACCESS_CODE'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3 pr-5">
                      <FaTag className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="bold-14 text-gray-900">كود الوصول</div>
                        <div className="regular-12 text-gray-600">ادفع باستخدام كود وصول</div>
                      </div>
                    </div>
                  </label>

                  {/* Fawry Payment */}
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    paymentMethod === 'FAWRY' ? 'border-accent bg-accent bg-opacity-10' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="FAWRY"
                      checked={paymentMethod === 'FAWRY'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3 pr-5">
                      <FaCreditCard className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="bold-14 text-gray-900">فوري</div>
                        <div className="regular-12 text-gray-600">ادفع عبر خدمة فوري</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Access Code Input */}
              {paymentMethod === 'ACCESS_CODE' && (
                <div className="mb-6">
                  <label className="block bold-14 text-gray-700 mb-2">
                    كود الوصول
                  </label>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => {setAccessCode(e.target.value)}}
                    placeholder="أدخل كود الوصول"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-accent focus:outline-none regular-14"
                  />
                </div>
              )}

              {/* Payment Result */}
              {paymentResult && (
                <div className={`mb-6 p-4 rounded-lg ${
                  paymentResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {paymentResult.success ? (
                      <FaCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <FaTimes className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`bold-14 ${paymentResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {paymentResult.message}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 cursor-pointer border border-gray-300 text-gray-700 py-3 rounded-lg bold-14 hover:bg-gray-50 transition-colors"
                  disabled={isProcessingPayment}
                >
                  إلغاء
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!paymentMethod || isProcessingPayment || (paymentMethod === 'ACCESS_CODE' && !accessCode.trim())}
                  className="flex-1 cursor-pointer bg-accent text-white py-3 rounded-lg bold-14 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flexCenter gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <FaCreditCard className="w-4 h-4" />
                      تأكيد الشراء
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;