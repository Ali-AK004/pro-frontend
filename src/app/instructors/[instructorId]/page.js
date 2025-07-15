"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBookOpen,
  FaStar,
  FaGraduationCap,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaArrowLeft,
  FaPlay,
  FaClock,
  FaAward,
} from "react-icons/fa";

import { studentAPI, handleAPIError } from "../../services/studentAPI";
import { toast } from "react-toastify";
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
        console.error("خطأ في جلب بيانات المدرس:", err);
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
      <div className="min-h-screen bg-main flexCenter">
        <div className="flexCenter flex-col">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 regular-16 text-gray-600">
            جاري تحميل بيانات المدرس...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-main flexCenter">
        <div className="text-center">
          <FaChalkboardTeacher className="w-24 h-24 text-gray-300 mx-auto mb-4" />
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

  if (!instructor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-main">
      <NavBar />
      <div className="max-container py-8 padding-container">
        {/* Back Button */}
        <div className="flex items-center justify-start">
          <Link
            href={"/instructors"}
            className="flexCenter hover:bg-[#088395] hover:border hover:border-[#088395] hover:text-white gap-2 cursor-pointer text-accent hover:text-opacity-80 transition-all border border-accent rounded-lg py-1 px-4 mb-6"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="regular-16">العودة للبحث</span>
          </Link>
        </div>

        {/* Instructor Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flexCenter">
                {instructor.photoUrl ? (
                  <Image
                    src={instructor.photoUrl}
                    width={128}
                    height={128}
                    alt="صورة المدرس"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <FaChalkboardTeacher className="w-16 h-16 text-gray-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-2">
                <FaStar className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center">
              <h1 className="bold-32 text-gray-900 mb-5">
                م/ {instructor.fullname}
              </h1>
              <p className="regular-16 text-gray-600 mb-6 max-w-2xl">
                {instructor.bio || "مدرس خبير في مجاله"}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="bold-20 text-accent">
                    {instructor.courses?.length || 0}
                  </div>
                  <div className="regular-14 text-gray-600">كورس</div>
                </div>
                <div className="text-center">
                  <div className="bold-20 text-accent">
                    {instructor.courses?.reduce(
                      (total, course) => total + (course.lessons?.length || 0),
                      0
                    ) || 0}
                  </div>
                  <div className="regular-14 text-gray-600">درس</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Courses */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="bold-24 text-gray-900 mb-6 flexCenter gap-2">
                <FaBookOpen className="w-6 h-6 text-accent" />
                الكورسات المتاحة
              </h2>

              <div className="space-y-4 ">
                {instructor.courses && instructor.courses.length > 0 ? (
                  instructor.courses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-gray-200 overflow-hidden rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start  gap-4">
                        {/* صورة الكورس */}
                        <div className="mx-auto w-[200px] h-[200px] md:mx-0 overflow-hidden bg-gray-100 flexCenter relative">
                          {instructor.courses?.map(
                            (course) =>
                              course.photoUrl && (
                                <Image
                                  key={course.id}
                                  src={course.photoUrl}
                                  width={200}
                                  height={200}
                                  alt={course.name}
                                  priority
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    // If you have a fallback element:
                                    const fallback =
                                      e.currentTarget.nextElementSibling;
                                    if (fallback)
                                      fallback.style.display = "flex";
                                  }}
                                />
                              )
                          )}
                        </div>

                        {/* محتوى الكورس */}
                        <div className="flex flex-col flex-1 justify-between h-[200px] py-5 pl-3">
                          <div className="flexBetween mb-2">
                            <h3 className="bold-18 text-gray-900">
                              {course.name}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                              <div className="flexCenter gap-1">
                                <FaBookOpen className="w-4 h-4" />
                                <span>{course.lessons?.length || 0} درس</span>
                              </div>
                            </div>
                          </div>

                          <p className="regular-14 text-gray-600 mb-3">
                            {course.description}
                          </p>
                          <div className="flex items-center justify-end">
                            <Link
                              href={`/instructors/${instructor.id}/courses/${course.id}`}
                              className="bg-accent text-white px-4 py-2 rounded-lg regular-14 hover:bg-opacity-90 transition-colors flexCenter gap-2"
                            >
                              <FaPlay className="w-3 h-3" />
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
          <div className="space-y-8">
            {/* Instructor Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="bold-20 text-gray-900 mb-6">معلومات المدرس</h2>

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
                      {instructor.courses?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="bold-20 text-gray-900 mb-6 flexCenter gap-2">
                <FaBookOpen className="w-5 h-5 text-accent" />
                ملخص الكورسات
              </h2>

              <div className="space-y-3">
                {instructor.courses && instructor.courses.length > 0 ? (
                  instructor.courses.map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="bold-14 text-gray-900">{course.name}</p>
                        <p className="regular-12 text-gray-600">
                          {course.lessons?.length || 0} درس
                        </p>
                      </div>
                      <span className="text-xs bg-accent text-white px-2 py-1 rounded">
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
