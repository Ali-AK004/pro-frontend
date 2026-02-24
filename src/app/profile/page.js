"use client";
import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaIdCard,
  FaUserGraduate,
  FaBook,
  FaClock,
  FaPlay,
  FaImage,
  FaChalkboardTeacher,
  FaUserShield,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useUserData } from "../../../models/UserContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import NavBar from "../components/navBar";
import apiConfig, { API_ENDPOINTS } from "@/config/api";

const Profile = () => {
  const { user } = useUserData();
  const router = useRouter();

  const [userLessons, setUserLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [lessonsError, setLessonsError] = useState(null);
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [lessonsToShow, setLessonsToShow] = useState(3);

  const isLoading = !user;

  // جلب الحصص من الـ API بناءً على دور المستخدم
  useEffect(() => {
    const fetchUserLessons = async () => {
      if (!user) return;

      try {
        setIsLoadingLessons(true);
        setLessonsError(null);

        let response;

        // Role-based API calls
        if (user.role === "STUDENT") {
          // Student: get their purchased lessons
          response = await axios.get(
            `${apiConfig.baseURL}${API_ENDPOINTS.STUDENTS.MY_LESSONS}`,
            {
              withCredentials: true,
            }
          );
        } else if (user.role === "INSTRUCTOR" || user.role === "ASSISTANT") {
          // Instructor/Assistant: get courses they teach/assist in
          const coursesResponse = await axios.get(
            `${apiConfig.baseURL}/instructors/${user.id}/courses`,
            {
              withCredentials: true,
            }
          );
          
          // Transform courses data to match lesson format if needed
          // Assuming the endpoint returns courses with lessons
          response = { data: coursesResponse.data };
        } else if (user.role === "ADMIN") {
          // Admin: set empty array and show admin message
          setUserLessons([]);
          setIsLoadingLessons(false);
          return;
        }

        setUserLessons(response?.data || []);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        setLessonsError("فشل في تحميل الحصص");
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
      return "expired";
    }

    const expiryDate = new Date(lesson.accessExpiryDate);
    const now = new Date();

    if (expiryDate < now) {
      return "expired";
    }

    return "active";
  };

  // دالة للحصول على تفاصيل حالة الحصة
  const getLessonStatusBadge = (lesson) => {
    const status = getLessonStatus(lesson);

    const statusConfig = {
      active: {
        text: "نشط",
        color: "bg-green-100 text-green-800",
      },
      expired: {
        text: "منتهي الصلاحية",
        color: "bg-red-100 text-red-800",
      },
    };

    return statusConfig[status] || statusConfig.active;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
  const displayedLessons = showAllLessons
    ? userLessons
    : userLessons.slice(0, lessonsToShow);

  // دالة للحصول على تفاصيل الدور
  const getRoleDetails = (role) => {
    const roleConfig = {
      STUDENT: {
        text: "طالب",
        color: "bg-blue-100 text-blue-800",
        icon: FaUserGraduate,
        description: "يمكنك الوصول للكورسات والدروس",
      },
      INSTRUCTOR: {
        text: "مدرس",
        color: "bg-green-100 text-green-800",
        icon: FaChalkboardTeacher,
        description: "يمكنك إنشاء وإدارة الكورسات",
      },
      ASSISTANT: {
        text: "مساعد",
        color: "bg-yellow-100 text-yellow-800",
        icon: FaUser,
        description: "يمكنك مساعدة المدرسين والطلاب",
      },
      ADMIN: {
        text: "مدير",
        color: "bg-red-100 text-red-800",
        icon: FaUserShield,
        description: "لوحة تحكم المدير",
      },
    };

    return roleConfig[role] || roleConfig.STUDENT;
  };

  // دالة للحصول على عنوان قسم الكورسات حسب الدور
  const getCourseSectionTitle = (role) => {
    const titles = {
      STUDENT: "الحصص المشتراة",
      INSTRUCTOR: "الحصص التي تدرسها",
      ASSISTANT: "الحصص التي تساعد فيها",
      ADMIN: "لوحة تحكم المدير",
    };

    return titles[role] || titles.STUDENT;
  };

  // دالة للحصول على رسالة عدم وجود كورسات/حصص حسب الدور
  const getEmptyCoursesMessage = (role) => {
    const messages = {
      STUDENT: {
        title: "لا توجد حصص مشتراة",
        description: "لم تقم بشراء أي حصص بعد - ابدأ رحلتك التعليمية الآن",
      },
      INSTRUCTOR: {
        title: "لا توجد حصص",
        description: "لم تقم بإنشاء أي حصص بعد",
      },
      ASSISTANT: {
        title: "لا توجد حصص",
        description: "لم يتم تعيينك كمساعد في أي حصص بعد",
      },
      ADMIN: {
        title: "مرحباً بك في لوحة التحكم",
        description: "استخدم لوحة تحكم المدير لإدارة المنصة",
      },
    };

    return messages[role] || messages.STUDENT;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-main flexCenter">
        <div className="flexCenter flex-col">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 regular-16 text-gray-600">
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <NavBar />
      <div className="relative max-container px-4 pt-4">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl"></div>

          <div className="relative flex flex-col lg:flex-row items-center gap-8">
            {/* Profile Image and Basic Info */}
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="relative group overflow-hidden w-24 h-24 lg:w-32 lg:h-32 rounded-full shadow-xl flex-shrink-0">
                {/* Background gradient layer - role-based coloring */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    user?.role === "STUDENT"
                      ? "from-blue-100 to-blue-200"
                      : user?.role === "INSTRUCTOR"
                        ? "from-green-100 to-green-200"
                        : user?.role === "ADMIN"
                          ? "from-red-100 to-red-200"
                          : "from-gray-100 to-gray-200"
                  }`}
                ></div>

                {/* White border */}
                <div className="absolute inset-0 border-4 border-white/80 rounded-full pointer-events-none"></div>

                {/* Profile image with error handling */}
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    width={120}
                    height={120}
                    alt="صورة المستخدم"
                    className="relative w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}

                {/* Fallback content - role-specific icon */}
                <div
                  className={`absolute inset-0 flex items-center justify-center ${
                    user?.avatarUrl ? "hidden" : "flex"
                  }`}
                >
                  {user?.role === "STUDENT" ? (
                    <FaUserGraduate className="w-12 h-12 text-blue-600 opacity-80" />
                  ) : user?.role === "INSTRUCTOR" ? (
                    <FaChalkboardTeacher className="w-12 h-12 text-green-600 opacity-80" />
                  ) : user?.role === "ADMIN" ? (
                    <FaUserShield className="w-12 h-12 text-red-600 opacity-80" />
                  ) : (
                    <FaUser className="w-12 h-12 text-gray-500 opacity-80" />
                  )}
                </div>
              </div>

              <div className="text-center lg:text-right">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {user?.fullname}
                </h1>
                <p className="text-lg text-gray-600 mb-4">@{user?.username}</p>
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <span
                    className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold ${getRoleDetails(user?.role).color}`}
                  >
                    {React.createElement(getRoleDetails(user?.role).icon, {
                      className: "w-4 h-4",
                    })}
                    {getRoleDetails(user?.role).text}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 max-w-md">
                  {getRoleDetails(user?.role).description}
                </p>
              </div>
            </div>

            {/* Quick Stats - Only show for non-admin users */}
            {user?.role !== "ADMIN" && (
              <div className="flex-1 w-full md:w-auto lg:mr-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl text-center">
                    <div className="text-2xl font-bold">{userLessons.length}</div>
                    <div className="text-sm opacity-90">إجمالي الحصص</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-2xl text-center">
                    <div className="text-2xl font-bold">
                      {
                        userLessons.filter((lesson) => lesson.expired === false)
                          .length
                      }
                    </div>
                    <div className="text-sm opacity-90">حصص نشطة</div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-2xl text-center">
                    <div className="text-2xl font-bold">
                      {isLoadingLessons
                        ? "..."
                        : userLessons.filter((lesson) => lesson.expired).length}
                    </div>
                    <div className="text-sm opacity-90">حصص منتهية</div>
                  </div>
                </div>
              </div>
            )}
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
                    <p className="regular-14 text-gray-600">
                      البريد الإلكتروني
                    </p>
                    <p className="bold-14 text-gray-900">
                      {user?.email || "لا يوجد"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaPhone className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">رقم الهاتف</p>
                    <p className="bold-14 text-gray-900">
                      {user?.phoneNumber || "لا يوجد"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaPhone className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">هاتف ولي الأمر</p>
                    <p className="bold-14 text-gray-900">
                      {user?.parentPhoneNumber || "لا يوجد"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaIdCard className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">الرقم القومي</p>
                    <p className="bold-14 text-gray-900">
                      {user?.nationalId || "لا يوجد"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaCalendarAlt className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">تاريخ الميلاد</p>
                    <p className="bold-14 text-gray-900">
                      {formatDate(user?.dateOfBirth) || "لا يوجد"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaMapMarkerAlt className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">المحافظة</p>
                    <p className="bold-14 text-gray-900">
                      {user?.government || "لا يوجد"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 gap-5 space-x-reverse">
                  <FaClock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">تاريخ التسجيل</p>
                    <p className="bold-14 text-gray-900">
                      {formatDate(user?.createdAt) || "لا يوجد"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* الحصص والكورسات - Admin View */}
          {user?.role === "ADMIN" ? (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FaUserShield className="w-8 h-8 text-red-500" />
                  <h2 className="bold-24 text-gray-900">لوحة تحكم المدير</h2>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                  <FaExclamationTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="bold-20 text-red-700 mb-3">
                    مرحباً بك في لوحة تحكم المدير
                  </h3>
                  <p className="regular-16 text-red-600 mb-6 max-w-lg mx-auto">
                    لعرض وإدارة جميع بيانات المنصة، يرجى التوجه إلى لوحة تحكم المدير المخصصة
                  </p>
                  <Link
                    href="/admin/dashboard"
                    className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg bold-16 hover:bg-red-700 transition-colors"
                  >
                    الانتقال إلى لوحة التحكم
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Non-admin users view lessons */
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flexBetween mb-6">
                  <h2 className="bold-20 text-gray-900">
                    {getCourseSectionTitle(user?.role)}
                  </h2>
                  <div className="flex flex-col md:flex-row gap-2 items-center space-x-2 space-x-reverse">
                    <FaBook className="w-5 h-5 text-accent" />
                    <span className="regular-14 text-gray-600">
                      {isLoadingLessons
                        ? "جاري التحميل..."
                        : `${userLessons.length} حصة`}
                    </span>
                  </div>
                </div>

                {isLoadingLessons ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="regular-16 text-gray-600">
                      جاري تحميل الحصص...
                    </p>
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
                    <h3 className="bold-18 text-gray-600 mb-2">
                      {getEmptyCoursesMessage(user?.role).title}
                    </h3>
                    <p className="regular-14 text-gray-500">
                      {getEmptyCoursesMessage(user?.role).description}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedLessons.map((lesson) => {
                      const statusBadge = getLessonStatusBadge(lesson);
                      return (
                        <div
                          key={lesson.id}
                          className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow overflow-hidden"
                        >
                          <div className="flex flex-col md:flex-row gap-4 p-4">
                            {/* Lesson Image */}
                            <div className="w-full md:w-[200px] h-[150px] md:h-[200px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                              {lesson.photoUrl ? (
                                <Image
                                  src={lesson.photoUrl}
                                  width={200}
                                  height={200}
                                  alt={lesson.name}
                                  priority
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FaImage className="w-10 h-10" />
                                </div>
                              )}
                            </div>

                            {/* Lesson Content */}
                            <div className="flex-1 flex flex-col">
                              {/* Header with title and status badge */}
                              <div className="flex flex-row sm:items-center justify-between gap-2 mb-3">
                                <h3 className="bold-16 text-gray-900 truncate">
                                  {lesson.name}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-sm text-xs font-medium ${statusBadge.color} self-start sm:self-center`}
                                >
                                  {statusBadge.text}
                                </span>
                              </div>

                              {/* Description */}
                              <p className="regular-14 text-gray-600 mb-3 line-clamp-2">
                                {lesson.description}
                              </p>

                              {/* Instructor info */}
                              <p className="regular-14 text-gray-600 mb-3">
                                {user?.role === "STUDENT" ? "المعلم: " : ""}
                                <span className="bold-14">
                                  {lesson.instructorName}
                                </span>
                              </p>

                              <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                                <div className="flex items-center gap-1 text-gray-600">
                                  <FaClock className="w-4 h-4" />
                                  <span className="regular-12">
                                    {user?.role === "STUDENT" ? "ينتهي: " : ""}
                                    {formatDate(lesson.accessExpiryDate)}
                                  </span>
                                </div>

                                <div className="flex md:justify-end">
                                  <Link
                                    href={`/instructors/${lesson.instructorId}/courses/${lesson.courseId}/lessons/${lesson.id}`}
                                    className={`px-4 py-2 flex-1 cursor-pointer justify-center md:justify-start rounded-md regular-12 transition-colors flex items-center gap-2 ${
                                      lesson.expired
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-accent text-white hover:bg-opacity-90 cursor-pointer"
                                    }`}
                                  >
                                    <FaPlay className="w-3 h-3" />
                                    {lesson.expired
                                      ? "منتهية الصلاحية"
                                      : user?.role === "STUDENT"
                                        ? "بدء الحصة"
                                        : "عرض الحصة"}
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Show More/Less buttons */}
                    {userLessons.length > 3 && (
                      <div className="text-center mt-6 relative z-10">
                        {!showAllLessons ? (
                          <button
                            type="button"
                            onClick={handleShowMore}
                            className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-[#87ceeb]/90 transition-colors regular-14 cursor-pointer"
                            style={{ pointerEvents: "auto" }}
                          >
                            عرض المزيد ({userLessons.length - 3} حصة إضافية)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleShowLess}
                            className="border border-secondary text-secondary px-6 py-3 rounded-lg hover:bg-[#87ceeb] hover:text-white transition-colors regular-14 cursor-pointer"
                            style={{ pointerEvents: "auto" }}
                          >
                            عرض أقل
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;