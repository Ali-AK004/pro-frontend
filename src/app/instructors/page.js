"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaChalkboardTeacher,
  FaUsers,
  FaBookOpen,
  FaArrowLeft,
} from "react-icons/fa";
import { studentAPI, handleAPIError } from "../services/studentAPI";
import { toast } from "react-toastify";
import Link from "next/link";
import NavBar from "../components/navBar";

const Instructors = () => {
  const [instructorId, setInstructorId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!instructorId.trim()) {
      setError("يرجى إدخال ID المدرس");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await studentAPI.profile.getInstructorFullProfile(
        instructorId.trim()
      );

      // Navigate to instructor profile page
      router.push(`/instructors/${instructorId.trim()}`);
    } catch (error) {
      console.error("Error fetching instructor profile:", error);
      setError(handleAPIError(error, "حدث خطأ أثناء جلب بيانات المدرس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInstructorId(e.target.value);
    if (error) setError(null); // Clear error when typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <NavBar />
      <div className="relative max-container p-4 md:padding-container pt-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href={"/"}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-300 text-gray-700 hover:text-blue-600 shadow-sm hover:shadow-md"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="font-medium">العودة للصفحة الرئيسية</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <FaChalkboardTeacher className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold pb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              المعلمين
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            ابحث عن المعلم باستخدام ID الخاص به لعرض ملفه الشخصي ومعلوماته
            التفصيلية والكورسات التي يقدمها
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl"></div>

            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center flex-col md:flex-row gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <FaSearch className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    البحث عن معلم
                  </h2>
                </div>
                <p className="text-gray-600">
                  أدخل ID المعلم للوصول إلى ملفه الشخصي والكورسات المتاحة
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label
                    htmlFor="instructorId"
                    className="block text-lg font-semibold text-gray-700 mb-3"
                  >
                    ID الملعم
                  </label>
                  <div className="relative">
                    <input
                      id="instructorId"
                      type="text"
                      value={instructorId}
                      onChange={handleInputChange}
                      placeholder="أدخل ID المعلم"
                      className="font-main w-full px-4 py-4 pr-12 border-2 border-gray-300 rounded-lg focus:border-accent focus:outline-none transition-colors regular-16"
                      disabled={isLoading}
                    />
                    <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Error message */}
                {error && <p className="text-red-500 regular-14">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading || !instructorId.trim()}
                  className="w-full bg-accent cursor-pointer text-white py-4 rounded-lg bold-16 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flexCenter gap-2 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      جاري البحث...
                    </>
                  ) : (
                    <>
                      <FaSearch className="w-4 h-4" />
                      البحث عن المعلم
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="bg-blue-100 w-16 h-16 rounded-full flexCenter mx-auto mb-4">
              <FaUsers className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="bold-20 text-gray-900 mb-2">معلومات شاملة</h3>
            <p className="regular-14 text-gray-600">
              اطلع على السيرة الذاتية والخبرات والتخصصات
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="bg-green-100 w-16 h-16 rounded-full flexCenter mx-auto mb-4">
              <FaBookOpen className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="bold-20 text-gray-900 mb-2">الكورسات المتاحة</h3>
            <p className="regular-14 text-gray-600">
              تصفح جميع الكورسات التي يقدمها المدرس
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-secondary bg-opacity-10 rounded-xl p-6 mt-12">
          <h3 className="bold-20 text-gray-900 mb-4 flexCenter gap-2">
            <FaChalkboardTeacher className="w-6 h-6 text-accent" />
            كيفية العثور على ID المدرس
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="bold-16 text-gray-800 mb-2">من خلال الكورس:</h4>
              <p className="regular-14 text-gray-600">
                يمكنك العثور على ID المدرس في صفحة تفاصيل أي كورس يقدمه
              </p>
            </div>
            <div>
              <h4 className="bold-16 text-gray-800 mb-2">من الإدارة:</h4>
              <p className="regular-14 text-gray-600">
                يمكن الحصول على ID المدرس من إدارة المنصة أو من المدرس مباشرة
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructors;
