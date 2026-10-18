"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaChalkboardTeacher,
  FaBookOpen,
  FaStar,
  FaArrowLeft,
  FaPlay,
  FaAward,
} from "react-icons/fa";

import { studentAPI, handleAPIError } from "../../services/studentAPI";
import Link from "next/link";
import Image from "next/image";
import NavBar from "@/app/components/navBar";

const InstructorProfile = () => {
  const params = useParams();
  const router = useRouter();
  const [instructor, setInstructor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { instructorId } = params;

  useEffect(() => {
    const fetchInstructor = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await studentAPI.profile.getInstructorFullProfile(
          instructorId.trim()
        );

        if (response.data) {
          setInstructor(response.data);
        } else {
          setError("لم يتم العثور على المدرس");
        }
      } catch (err) {
        setError(handleAPIError(err, "حدث خطأ أثناء تحميل بيانات المدرس"));
        setInstructor(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (instructorId) {
      fetchInstructor();
    }
  }, [instructorId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative text-center">
          <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <FaChalkboardTeacher className="w-10 h-10 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-200 border-t-brand-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">
            جاري تحميل بيانات المدرس...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaChalkboardTeacher className="w-12 h-12 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-8">
            تأكد من صحة ID المدرس وحاول مرة أخرى
          </p>
          <button
            onClick={() => router.push("/instructors")}
            className="bg-brand-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-brand-700 transition-all duration-150 flex items-center justify-center gap-3 mx-auto"
          >
            <FaArrowLeft className="w-4 h-4" />
            العودة للبحث
          </button>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl"></div>
      </div>

      <NavBar />
      <div className="relative max-container py-4 md:py-6 lg:py-8 px-4 md:px-6 lg:px-20">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href={"/instructors"}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm hover:bg-brand-50 border border-gray-200 hover:border-brand-300 rounded-xl transition-all duration-150 text-gray-700 hover:text-brand-600 shadow-sm"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="font-medium">العودة للبحث</span>
          </Link>
        </div>

        {/* Instructor Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 lg:p-12 mb-6 lg:mb-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-brand-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/10 rounded-full blur-2xl"></div>

          <div className="relative flex flex-col md:flex-row items-center gap-8 lg:gap-12">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-xl">
                {instructor.photoUrl ? (
                  <Image
                    src={instructor.photoUrl}
                    width={160}
                    height={160}
                    alt="صورة المدرس"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <FaChalkboardTeacher className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-3 shadow-sm">
                <FaStar className="w-4 h-4 text-white" />
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full border-4 border-brand-400/30 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border-4 border-brand-400/20 animate-ping animation-delay-75"></div>
            </div>

            {/* Info */}
            <div className="flex-1 flex items-center md:justify-between flex-col md:flex-row w-full lg:w-auto text-center lg:text-right space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <FaAward className="w-4 h-4" />
                  مدرس معتمد
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  م/ {instructor.fullname}
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {instructor.bio ||
                    "مدرس خبير في مجاله مع سنوات من الخبرة في التدريس والتعليم"}
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-col md:w-[250px] w-full gap-2 md:gap-4">
                <div className="bg-brand-500 text-white p-3 md:p-4 rounded-xl md:rounded-xl text-center">
                  <div className="text-xl md:text-2xl font-bold">
                    {instructor.totalCourses ?? instructor.courses?.length ?? 0}
                  </div>
                  <div className="text-xs md:text-sm opacity-90">كورس</div>
                </div>
                <div className="bg-brand-500 text-white p-3 md:p-4 rounded-xl md:rounded-2xl text-center">
                  <div className="text-xl md:text-2xl font-bold">
                    {instructor.totalLessons ??
                      (instructor.courses?.reduce((total, course) => total + (course.lessons?.length || 0), 0) || 0)}
                  </div>
                  <div className="text-xs md:text-sm opacity-90">درس</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Courses */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center justify-center md:justify-start gap-2">
                <FaBookOpen className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                الكورسات المتاحة
              </h2>

              <div className="space-y-6">
                {instructor.courses && instructor.courses.length > 0 ? (
                  instructor.courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white border border-gray-200 overflow-hidden rounded-xl transition-all duration-150"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* صورة الكورس */}
                        <div className="w-full md:w-[200px] h-[200px] md:h-[200px] overflow-hidden bg-gray-100 flexCenter relative md:rounded-r-xl">
                          {course.photoUrl ? (
                            <Image
                              src={course.photoUrl}
                              width={200}
                              height={200}
                              alt={course.name}
                              priority
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback =
                                  e.currentTarget.nextElementSibling;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : (
                            <>
                              <FaChalkboardTeacher className="w-16 h-16 text-gray-400 hidden md:block" />
                            </>
                          )}
                        </div>

                        {/* محتوى الكورس */}
                        <div className="flex flex-col flex-1 justify-between p-4 md:p-6 space-y-4">
                          {/* Header with title and lessons count */}
                          <div className="space-y-3">
                            <div className="flex flex-wrap sm:items-start justify-between gap-3">
                              <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                                {course.name}
                              </h3>
                              <div className="flex items-center gap-2 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm font-medium self-start sm:self-center">
                                <FaBookOpen className="w-4 h-4" />
                                <span>{course.lessons?.length || 0} درس</span>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-600 leading-relaxed text-sm md:text-base line-clamp-2 md:line-clamp-3">
                              {course.description || "وصف الكورس غير متوفر"}
                            </p>
                          </div>

                          {/* Action button */}
                          <div className="flex items-center justify-center md:justify-end pt-2">
                            <Link
                              href={`/instructors/${instructor.id}/courses/${course.id}`}
                              className="w-full md:w-auto bg-brand-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-600 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
                            >
                              <FaPlay className="w-4 h-4" />
                              عرض التفاصيل
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FaBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="bold-18 text-gray-600 mb-2">
                      لا توجد كورسات
                    </h3>
                    <p className="regular-14 text-gray-500">
                      لم يقم هذا المدرس بإنشاء أي كورسات بعد
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:space-y-8">
            {/* Instructor Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaChalkboardTeacher className="w-5 h-5 text-brand-600" />
                معلومات المدرس
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-5">
                  <FaChalkboardTeacher className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">ID المدرس</p>
                    <p className="bold-14 text-gray-900">{instructor.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <FaBookOpen className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-600">عدد الكورسات</p>
                    <p className="bold-14 text-gray-900">
                      {instructor.totalCourses ?? instructor.courses?.length ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaBookOpen className="w-5 h-5 text-emerald-600" />
                ملخص الكورسات
              </h2>

              <div className="space-y-3">
                {instructor.courses && instructor.courses.length > 0 ? (
                  instructor.courses.map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-brand-50 transition-all duration-150"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">
                          {course.name}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <FaPlay className="w-3 h-3" />
                          {course.lessons?.length || 0} درس
                        </p>
                      </div>
                      <span className="text-xs bg-brand-500 text-white px-3 py-1 rounded-full font-medium">
                        #{index + 1}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="regular-14 text-gray-500 text-center">
                    لا توجد كورسات
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfile;
