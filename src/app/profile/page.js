'use client';
import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaMapMarkerAlt, FaIdCard, FaUserGraduate, FaBook, FaClock, FaEdit, FaPlay, FaImage } from 'react-icons/fa';
import { useUserData } from '../../../models/UserContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '../../../components/navBar';
import axios from 'axios';

const Profile = () => {
  const { user } = useUserData();
  const router = useRouter()

  const [userLessons, setUserLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [lessonsError, setLessonsError] = useState(null);

  const [showAllLessons, setShowAllLessons] = useState(false);
  const [lessonsToShow, setLessonsToShow] = useState(3);

  // التحقق من حالة التحميل بناءً على وجود بيانات المستخدم
  const isLoading = !user;

  // جلب الحصص من الـ API
  useEffect(() => {
    const fetchUserLessons = async () => {
      if (!user) return;

      try {
        setIsLoadingLessons(true);
        setLessonsError(null);

        const response = await axios.get('http://localhost:8080/api/students/my-lessons', {
          withCredentials: true
        });

        setUserLessons(response.data || []);
      } catch (error) {
        console.error('خطأ في جلب الحصص:', error);
        setLessonsError('فشل في تحميل الحصص');
        setUserLessons([]);
      } finally {
        setIsLoadingLessons(false);
      }
    };

    fetchUserLessons();
  }, [user]);

  // دالة لتحديد حالة الحصة بناءً على تاريخ انتهاء الصلاحية
  const getLessonStatus = (lesson) => {
    if (lesson.expired) {
      return 'expired';
    }

    const expiryDate = new Date(lesson.accessExpiryDate);
    const now = new Date();

    if (expiryDate < now) {
      return 'expired';
    }

    return 'active';
  };

  // دالة للحصول على تفاصيل حالة الحصة
  const getLessonStatusBadge = (lesson) => {
    const status = getLessonStatus(lesson);

    const statusConfig = {
      active: {
        text: 'نشط',
        color: 'bg-green-100 text-green-800'
      },
      expired: {
        text: 'منتهي الصلاحية',
        color: 'bg-red-100 text-red-800'
      }
    };

    return statusConfig[status] || statusConfig.active;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { text: 'نشط', color: 'bg-green-100 text-green-800' },
      paused: { text: 'متوقف', color: 'bg-yellow-100 text-yellow-800' }
    };

    return statusConfig[status] || statusConfig.active;
  };

  const handleShowMore = () => {
    setShowAllLessons(true);
    setLessonsToShow(userLessons.length);
  };

  const handleShowLess = () => {
    setShowAllLessons(false);
    setLessonsToShow(3);
  };

  // الحصول على الحصص المراد عرضها
  const displayedLessons = showAllLessons ? userLessons : userLessons.slice(0, lessonsToShow);

  // دالة للحصول على تفاصيل الدور
  const getRoleDetails = (role) => {
    const roleConfig = {
      STUDENT: {
        text: 'طالب',
        color: 'bg-blue-100 text-blue-800',
        icon: FaUserGraduate,
        description: 'يمكنك الوصول للكورسات والدروس'
      },
      INSTRUCTOR: {
        text: 'مدرس',
        color: 'bg-green-100 text-green-800',
        icon: FaUser,
        description: 'يمكنك إنشاء وإدارة الكورسات'
      },
      ASSISTANT: {
        text: 'مساعد',
        color: 'bg-yellow-100 text-yellow-800',
        icon: FaUser,
        description: 'يمكنك مساعدة المدرسين والطلاب'
      },
      ADMIN: {
        text: 'مدير',
        color: 'bg-red-100 text-red-800',
        icon: FaUser,
        description: 'لديك صلاحيات كاملة على النظام'
      }
    };

    return roleConfig[role] || roleConfig.STUDENT;
  };

  // دالة للحصول على عنوان قسم الكورسات حسب الدور
  const getCourseSectionTitle = (role) => {
    const titles = {
      STUDENT: 'الحصص المشتراة',
      INSTRUCTOR: 'الحصص التي أدرسها',
      ASSISTANT: 'الحصص التي تساعد فيها',
      ADMIN: 'جميع الحصص'
    };

    return titles[role] || titles.STUDENT;
  };

  // دالة للحصول على رسالة عدم وجود كورسات/حصص حسب الدور
  const getEmptyCoursesMessage = (role) => {
    const messages = {
      STUDENT: {
        title: 'لا توجد حصص مشتراة',
        description: 'لم تقم بشراء أي حصص بعد - ابدأ رحلتك التعليمية الآن'
      },
      INSTRUCTOR: {
        title: 'لا توجد حصص تدرسها',
        description: 'لم تقم بإنشاء أي حصص بعد - ابدأ بإنشاء أول كورس لك'
      },
      ASSISTANT: {
        title: 'لا توجد حصص مساعدة',
        description: 'لم يتم تعيينك كمساعد في أي حصص بعد'
      },
      ADMIN: {
        title: 'لا توجد حصص في النظام',
        description: 'لا توجد حصص مسجلة في المنصة حالياً'
      }
    };

    return messages[role] || messages.STUDENT;
  };

  // دالة للحصول على تسميات الإحصائيات حسب الدور
  const getStatsLabels = (role) => {
    const labels = {
      STUDENT: {
        total: 'إجمالي الحصص',
        completed: 'كورسات مكتملة',
        lessons: 'دروس مكتملة'
      },
      INSTRUCTOR: {
        total: 'الكورسات التي أدرسها',
        completed: 'كورسات منتهية',
        lessons: 'دروس منشورة'
      },
      ASSISTANT: {
        total: 'كورسات مساعدة',
        completed: 'كورسات منتهية',
        lessons: 'دروس مساعدة'
      },
      ADMIN: {
        total: 'إجمالي الكورسات',
        completed: 'كورسات مكتملة',
        lessons: 'إجمالي الدروس'
      }
    };

    return labels[role] || labels.STUDENT;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-main flexCenter">
        <div className="flexCenter flex-col">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 regular-16 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
  }


  return (
    <div className="min-h-screen bg-main">
      <NavBar />
      <div className="max-container padding-container py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="md:items-center md:justify-between gap-4 md:gap-0 flex-col md:flex-row flex">
            <div className="md:justify-between md:items-center flex flex-col md:flex-row gap-4 w-full">
              <div className='flex flex-col justify-center text-center md:text-right md:justify- md:flex-row items-center space-x-4 md:gap-3 gap-2 space-x-reverse'>
                <div className="relative">
                  <Image
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                    width={80}
                    height={80}
                    alt="صورة المستخدم"
                    className="w-20 h-20 rounded-full object-cover border-4 border-secondary"
                    onError={(e) => {
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-accent text-white rounded-full p-1">
                    <FaUser className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <h1 className="bold-32 text-gray-900">{user?.fullname}</h1>
                  <p className="regular-16 text-gray-600">@{user?.username}</p>
                </div>
              </div>
                <div className="flex items-center flex-col space-x-2 space-x-reverse gap-3">
                  <span className={`inline-block px-10 py-1 rounded-full bold-16  ${getRoleDetails(user?.role).color}`}>
                    {getRoleDetails(user?.role).text}
                  </span>
                  <p className="regular-12 text-center md:text-right text-gray-500">{getRoleDetails(user?.role).description}</p>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* معلومات المستخدم */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="bold-20 text-gray-900 mb-6">المعلومات الشخصية</h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaEnvelope className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">البريد الإلكتروني</p>
                    <p className="bold-14 text-gray-900">{user?.email|| 'لا يوجد'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaPhone className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">رقم الهاتف</p>
                    <p className="bold-14 text-gray-900">{user?.phoneNumber|| 'لا يوجد'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaPhone className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">هاتف ولي الأمر</p>
                    <p className="bold-14 text-gray-900">{user?.parentPhoneNumber || 'لا يوجد'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaIdCard className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">الرقم القومي</p>
                    <p className="bold-14 text-gray-900">{user?.nationalId|| 'لا يوجد'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaCalendarAlt className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">تاريخ الميلاد</p>
                    <p className="bold-14 text-gray-900">{formatDate(user?.dateOfBirth)|| 'لا يوجد'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaMapMarkerAlt className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">المحافظة</p>
                    <p className="bold-14 text-gray-900">{user?.government|| 'لا يوجد'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaClock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">تاريخ التسجيل</p>
                    <p className="bold-14 text-gray-900">{formatDate(user?.createdAt)|| 'لا يوجد'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* الحصص والكورسات */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flexBetween mb-6">
                <h2 className="bold-20 text-gray-900">{getCourseSectionTitle(user?.role)}</h2>
                <div className="flex flex-col md:flex-row gap-2 items-center space-x-2 space-x-reverse">
                  <FaBook className="w-5 h-5 text-accent" />
                  <span className="regular-14 text-gray-600">
                    {isLoadingLessons ? 'جاري التحميل...' : `${userLessons.length} حصة`}
                  </span>
                </div>
              </div>

              {isLoadingLessons ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="regular-16 text-gray-600">جاري تحميل الحصص...</p>
                </div>
              ) : lessonsError ? (
                <div className="text-center py-12">
                  <FaUserGraduate className="w-16 h-16 text-red-300 mx-auto mb-4" />
                  <h3 className="bold-18 text-red-600 mb-2">خطأ في التحميل</h3>
                  <p className="regular-14 text-red-500">{lessonsError}</p>
                </div>
              ) : userLessons.length === 0 ? (
                <div className="text-center py-12">
                  <FaUserGraduate className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="bold-18 text-gray-600 mb-2">{getEmptyCoursesMessage(user?.role).title}</h3>
                  <p className="regular-14 text-gray-500">{getEmptyCoursesMessage(user?.role).description}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedLessons.map((lesson) => {
                    const statusBadge = getLessonStatusBadge(lesson);
                    return (
                      <div key={lesson.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start md:items-center pl-4 md:flex-row flex-col md:gap-4 space-x-4 space-x-reverse">
                          {/* صورة الحصة */}
                          <div className="mx-auto w-[200px] h-[200px] md:mx-0 overflow-hidden bg-gray-100 flexCenter relative">
                            {lesson.photoUrl ? (
                              <Image
                                src={lesson.photoUrl}
                                width={200}
                                height={200}
                                alt={lesson.name}
                                priority
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                          </div>

                          <div className="flex-1">
                            <div className="flexBetween mb-2">
                              <h3 className="bold-16 text-gray-900">{lesson.name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                {statusBadge.text}
                              </span>
                            </div>

                            <p className="regular-14 text-gray-600 mb-2">{lesson.description}</p>

                            <p className="regular-14 text-gray-600 mb-2">المعلم : <span className="bold-14">{lesson.instructorName}</span></p>

                            <div className="flex md:gap-4 items-center  space-x-4 space-x-reverse mb-3">
                              <div className="flex flex-col md:flex-row items-center gap-1">
                                <FaClock className="w-4 h-4 text-gray-500" />
                                <span className="regular-12 text-gray-600">
                                  ينتهي: {formatDate(lesson.accessExpiryDate)}
                                </span>
                              </div>
                            </div>

                            <div className="flex space-x-2 gap-2 flex-col md:flex-row md:justify-end space-x-reverse">
                              <Link
                                href={`/instructor/${lesson.instructorId}/lessons/${lesson.id}`}
                                className={`px-4 py-2 rounded-md regular-12 transition-colors flexCenter gap-2 ${
                                  lesson.expired
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-accent text-white hover:bg-opacity-90 cursor-pointer'
                                }`}
                                disabled={lesson.expired}
                              >
                                <FaPlay className="w-3 h-3" />
                                {lesson.expired ? 'منتهية الصلاحية' : 'بدء الحصة'}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* زر عرض المزيد/عرض أقل */}
                  {userLessons.length > 3 && (
                    <div className="text-center mt-6">
                      {!showAllLessons ? (
                        <button
                          onClick={handleShowMore}
                          className="bg-secondary cursor-pointer text-white px-6 py-3 rounded-lg hover:bg-secondry transition-colors regular-14"
                        >
                          عرض المزيد ({userLessons.length - 3} حصة إضافية)
                        </button>
                      ) : (
                        <button
                          onClick={handleShowLess}
                          className="border border-secondary cursor-pointer text-secondary px-6 py-3 rounded-lg hover:bg-secondary hover:text-white transition-colors regular-14"
                        >
                          عرض أقل
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <FaUserGraduate className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="bold-18 text-gray-900">
                  {isLoadingLessons ? '...' : userLessons.filter(lesson => !lesson.expired).length}
                </h3>
                <p className="regular-14 text-gray-600">حصص نشطة</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <FaClock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="bold-18 text-gray-900">
                  {isLoadingLessons ? '...' : userLessons.filter(lesson => lesson.expired).length}
                </h3>
                <p className="regular-14 text-gray-600">حصص منتهية</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;