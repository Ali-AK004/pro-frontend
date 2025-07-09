'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaBookOpen, FaPlay, FaArrowLeft, FaShoppingCart, FaCreditCard, FaTag, FaImage, FaClock, FaUser } from 'react-icons/fa';
import axios from 'axios';

const CourseDetails = () => {
  const params = useParams();
  const router = useRouter();
  const { id: courseId } = params;
  
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  // جلب بيانات الكورس من API المدرس (نستخدم نفس البيانات)
  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // نحتاج لجلب بيانات المدرس أولاً للحصول على الكورس
        // هذا مثال - في الواقع ستحتاج لـ API مخصص للكورس
        const response = await axios.get(
          `http://localhost:8080/api/students/instructors/X0Nm1w44V/full-profile`,
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

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleLessonSelect = (lessonId) => {
    setSelectedLessons(prev => {
      if (prev.includes(lessonId)) {
        return prev.filter(id => id !== lessonId);
      } else {
        return [...prev, lessonId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedLessons.length === course.lessons.length) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons(course.lessons.map(lesson => lesson.id));
    }
  };

  const calculateTotal = () => {
    return selectedLessons.length * 50; // سعر ثابت 50 جنيه لكل حصة
  };

  const handlePurchase = () => {
    if (selectedLessons.length === 0) {
      alert('يرجى اختيار حصة واحدة على الأقل');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('يرجى اختيار طريقة الدفع');
      return;
    }

    try {
      // هنا ستكون عملية الدفع الحقيقية
      console.log('Payment details:', {
        courseId,
        selectedLessons,
        paymentMethod,
        discountCode,
        total: calculateTotal()
      });

      alert('تم الشراء بنجاح!');
      setShowPaymentModal(false);
      setSelectedLessons([]);
    } catch (error) {
      console.error('خطأ في عملية الدفع:', error);
      alert('حدث خطأ أثناء عملية الدفع');
    }
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
            onClick={() => router.push('/courses')}
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
          onClick={() => router.push('/courses')}
          className="flexCenter gap-2 text-accent hover:text-opacity-80 transition-colors mb-6"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="regular-16">العودة للبحث</span>
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="bold-20 text-accent">{course.lessons?.length || 0}</div>
                  <div className="regular-14 text-gray-600">حصة</div>
                </div>
                <div className="text-center">
                  <div className="bold-20 text-accent">50</div>
                  <div className="regular-14 text-gray-600">جنيه/حصة</div>
                </div>
                <div className="text-center">
                  <div className="bold-20 text-accent">4.8</div>
                  <div className="regular-14 text-gray-600">التقييم</div>
                </div>
              </div>

              {/* Course ID */}
              <div className="bg-gray-100 rounded-lg p-3 inline-block">
                <span className="regular-14 text-gray-600">معرف الكورس: </span>
                <span className="bold-14 text-gray-900">{course.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flexBetween mb-6">
                <h2 className="bold-24 text-gray-900">الحصص المتاحة</h2>
                <button
                  onClick={handleSelectAll}
                  className="text-accent hover:text-opacity-80 transition-colors regular-14"
                >
                  {selectedLessons.length === course.lessons?.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </button>
              </div>

              <div className="space-y-4">
                {course.lessons && course.lessons.length > 0 ? (
                  course.lessons.map((lesson, index) => (
                    <div 
                      key={lesson.id || index} 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                        selectedLessons.includes(lesson.id || index)
                          ? 'border-accent bg-accent bg-opacity-10'
                          : 'border-gray-200 hover:border-accent hover:bg-gray-50'
                      }`}
                      onClick={() => handleLessonSelect(lesson.id || index)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded border-2 flexCenter ${
                          selectedLessons.includes(lesson.id || index)
                            ? 'bg-accent border-accent'
                            : 'border-gray-300'
                        }`}>
                          {selectedLessons.includes(lesson.id || index) && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </div>

                        {/* Lesson Content */}
                        <div className="flex-1">
                          <div className="flexBetween mb-2">
                            <h3 className="bold-16 text-gray-900">
                              الحصة {index + 1}: {lesson.title || `درس ${index + 1}`}
                            </h3>
                            <span className="bold-14 text-accent">50 جنيه</span>
                          </div>
                          
                          <p className="regular-14 text-gray-600 mb-2">
                            {lesson.description || 'وصف الحصة غير متاح'}
                          </p>
                          
                          <div className="flex gap-4 text-sm text-gray-500">
                            <div className="flexCenter gap-1">
                              <FaClock className="w-3 h-3" />
                              <span>45 دقيقة</span>
                            </div>
                            <div className="flexCenter gap-1">
                              <FaPlay className="w-3 h-3" />
                              <span>فيديو تفاعلي</span>
                            </div>
                          </div>
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
          </div>

          {/* Purchase Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="bold-20 text-gray-900 mb-4">ملخص الشراء</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flexBetween">
                  <span className="regular-14 text-gray-600">الحصص المحددة:</span>
                  <span className="bold-14 text-gray-900">{selectedLessons.length}</span>
                </div>
                <div className="flexBetween">
                  <span className="regular-14 text-gray-600">سعر الحصة:</span>
                  <span className="bold-14 text-gray-900">50 جنيه</span>
                </div>
                <hr />
                <div className="flexBetween">
                  <span className="bold-16 text-gray-900">الإجمالي:</span>
                  <span className="bold-18 text-accent">{calculateTotal()} جنيه</span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={selectedLessons.length === 0}
                className="w-full bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flexCenter gap-2 shadow-md hover:shadow-lg"
              >
                <FaShoppingCart className="w-4 h-4" />
                شراء الحصص المحددة
              </button>

              {selectedLessons.length === 0 && (
                <p className="text-center text-gray-500 regular-12 mt-2">
                  يرجى اختيار حصة واحدة على الأقل
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="bold-24 text-gray-900 mb-6 text-center">إتمام عملية الشراء</h2>

              {/* Purchase Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="bold-16 text-gray-900 mb-3">ملخص الطلب</h3>
                <div className="space-y-2">
                  <div className="flexBetween">
                    <span className="regular-14 text-gray-600">الكورس:</span>
                    <span className="regular-14 text-gray-900">{course.name}</span>
                  </div>
                  <div className="flexBetween">
                    <span className="regular-14 text-gray-600">عدد الحصص:</span>
                    <span className="regular-14 text-gray-900">{selectedLessons.length}</span>
                  </div>
                  <hr />
                  <div className="flexBetween">
                    <span className="bold-16 text-gray-900">الإجمالي:</span>
                    <span className="bold-16 text-accent">{calculateTotal()} جنيه</span>
                  </div>
                </div>
              </div>

              {/* Discount Code */}
              <div className="mb-6">
                <label className="block bold-14 text-gray-700 mb-2">
                  كود الخصم (اختياري)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="أدخل كود الخصم"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-accent focus:outline-none regular-14"
                  />
                  <button className="bg-secondary text-white px-4 py-2 rounded-lg regular-14 hover:bg-opacity-90 transition-colors">
                    تطبيق
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="bold-16 text-gray-900 mb-4">طريقة الدفع</h3>

                <div className="space-y-3">
                  {/* Discount Code Payment */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="discount_code"
                      checked={paymentMethod === 'discount_code'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <FaTag className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="bold-14 text-gray-900">كود خصم</div>
                        <div className="regular-12 text-gray-600">ادفع باستخدام كود خصم</div>
                      </div>
                    </div>
                  </label>

                  {/* Fawry Payment */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="fawry"
                      checked={paymentMethod === 'fawry'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <FaCreditCard className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="bold-14 text-gray-900">فوري</div>
                        <div className="regular-12 text-gray-600">ادفع عبر خدمة فوري</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg bold-14 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!paymentMethod}
                  className="flex-1 bg-accent text-white py-3 rounded-lg bold-14 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flexCenter gap-2"
                >
                  <FaCreditCard className="w-4 h-4" />
                  تأكيد الدفع
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
