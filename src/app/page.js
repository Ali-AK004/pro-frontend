"use client";
import React from "react";
import Link from "next/link";
import {
  FaGraduationCap,
  FaUsers,
  FaBookOpen,
  FaCertificate,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaArrowRight,
  FaPlay,
  FaRobot,
  FaClipboardList,
  FaChartLine,
  FaCode,
  FaLaptopCode,
  FaUserGraduate,
} from "react-icons/fa";
import { useUserData } from "../../models/UserContext";
import NavBar from "./components/navBar";
import Footer from "./components/footer";
import { ProgressiveLoader, SkeletonCard } from "./components/OptimizedLoader";
import { performanceUtils } from "./components/PerformanceMonitor";

export default function Home() {
  const { user, loading } = useUserData();

  const homeSkeleton = (
    <div className="min-h-screen bg-main">
      <div className="animate-pulse">
        {/* Navbar skeleton */}
        <div className="bg-white shadow-lg h-16 mb-8"></div>

        {/* Hero section skeleton */}
        <div className="max-container padding-container py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="bg-gray-200 h-16 rounded w-3/4"></div>
              <div className="bg-gray-200 h-6 rounded w-full"></div>
              <div className="bg-gray-200 h-6 rounded w-2/3"></div>
              <div className="bg-gray-200 h-12 rounded w-1/3"></div>
            </div>
            <div className="bg-gray-200 h-64 rounded-2xl"></div>
          </div>
        </div>

        {/* Features skeleton */}
        <div className="max-container padding-container py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ProgressiveLoader isLoading={loading} skeleton={homeSkeleton}>
      <div className="min-h-screen bg-main">
        <NavBar />
        {/* Hero Section */}
        <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-container padding-container py-20 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Content */}
              <div className="text-center lg:text-right space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200/50 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">
                      منصة التعليم الذكي الأولى
                    </span>
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    تعلم بذكاء واحصل على
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                      درجات أعلى!
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    منصة تعليمية متطورة تجمع بين الذكاء الاصطناعي والتعلم
                    التفاعلي. احصل على مساعد ذكي شخصي، تدرب على امتحانات حقيقية،
                    وتابع تقدمك لحظة بلحظة.
                  </p>
                </div>

                {/* Action Buttons */}
                {user ? (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link
                      href="/instructors"
                      className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      ابدأ التعلم الآن
                      <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link
                      href="/signup"
                      className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      ابدأ التعلم الآن
                      <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/login"
                      className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm bg-white/50"
                    >
                      تسجيل الدخول
                      <FaPlay className="w-3 h-3 group-hover:text-blue-600 transition-colors" />
                    </Link>
                  </div>
                )}

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span>+1000 طالب ناجح</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <span>4.9/5 تقييم</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="relative lg:order-first order-last">
                {/* Main Card */}
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                  <div className="text-center space-y-6">
                    {/* Icon with animation */}
                    <div className="relative inline-block">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <FaGraduationCap className="w-16 h-16 text-white" />
                      </div>
                      {/* AI Badge */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-3 shadow-lg animate-bounce">
                        <FaRobot className="w-5 h-5 text-white" />
                      </div>
                      {/* Pulse rings */}
                      <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping"></div>
                      <div className="absolute inset-2 rounded-full border-4 border-purple-400/20 animate-ping animation-delay-75"></div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-gray-900">
                        نجاحك مضمون معنا
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        أكثر من 95% من طلابنا يحققون درجات أعلى مع مساعدنا الذكي
                      </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full w-[95%] animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Floating Stats Cards */}
                <div className="absolute -top-6 -left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20 transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <FaChartLine className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">95%</p>
                      <p className="text-sm text-gray-600">معدل النجاح</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20 transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <FaRobot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">24/7</p>
                      <p className="text-sm text-gray-600">مساعدة ذكية</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -left-12 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-xl border border-white/20 transform hover:scale-105 transition-transform hidden lg:block">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <FaCertificate className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">Free</p>
                      <p className="text-xs text-gray-600">تجربة مجانية</p>
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-8 right-8 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute bottom-12 left-12 w-3 h-3 bg-pink-400 rounded-full animate-pulse animation-delay-150"></div>
                <div className="absolute top-1/3 right-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-300"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Student Success Stats Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl"></div>

          <div className="relative max-container padding-container">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <FaChartLine className="w-4 h-4" />
                إحصائيات مذهلة
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                طلابنا يحققون نتائج
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent block">
                  استثنائية!
                </span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                انضم إلى آلاف الطلاب الذين غيروا مستقبلهم الأكاديمي معنا
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Success Rate */}
              <div className="group">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 group-hover:transform group-hover:-translate-y-2">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <FaChartLine className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        95%
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        معدل النجاح
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        من طلابنا يحسنون درجاتهم بشكل ملحوظ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24/7 Support */}
              <div className="group">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 group-hover:transform group-hover:-translate-y-2">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <FaRobot className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        24/7
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        مساعدة فورية
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        مساعد ذكي متاح في أي وقت تحتاجه
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free Trial */}
              <div className="group">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 group-hover:transform group-hover:-translate-y-2">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <FaCertificate className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Free
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        تجربة مجانية
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        ابدأ رحلتك التعليمية بدون أي تكلفة
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unlimited Practice */}
              <div className="group">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 group-hover:transform group-hover:-translate-y-2">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <FaClipboardList className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        ∞
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        تدريب لا محدود
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        امتحانات وواجبات بلا حدود للتدريب
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-container padding-container">
            <div className="text-center mb-16">
              <h2 className="bold-48 text-gray-900 mb-4">
                كل ما تحتاجه للنجاح في مكان واحد
              </h2>
              <p className="regular-18 text-gray-600 max-w-2xl mx-auto">
                أدوات ذكية مصممة خصيصاً لمساعدتك على التفوق والحصول على أعلى
                الدرجات
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 - Personal AI Tutor */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-transparent hover:border-blue-200">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:shadow-lg transition-all">
                  <FaRobot className="w-10 h-10 text-white" />
                </div>
                <h3 className="bold-20 text-gray-900 mb-3">
                  مدرس شخصي ذكي مجاني
                </h3>
                <p className="regular-14 text-gray-600 mb-4">
                  احصل على إجابات فورية لأسئلتك، شرح مبسط للمفاهيم الصعبة،
                  ونصائح للمذاكرة - متاح 24/7 مجاناً!
                </p>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  مجاني تماماً
                </div>
              </div>

              {/* Feature 2 - Practice Tests */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-transparent hover:border-green-200">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:shadow-lg transition-all">
                  <FaClipboardList className="w-10 h-10 text-white" />
                </div>
                <h3 className="bold-20 text-gray-900 mb-3">
                  تدرب على امتحانات حقيقية
                </h3>
                <p className="regular-14 text-gray-600 mb-4">
                  امتحانات تجريبية مشابهة للامتحانات الحقيقية مع تصحيح فوري
                  وتحليل نقاط ضعفك لتحسين أدائك
                </p>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  تحسن مضمون
                </div>
              </div>

              {/* Feature 3 - Progress Tracking */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border-2 border-transparent hover:border-orange-200">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:shadow-lg transition-all">
                  <FaChartLine className="w-10 h-10 text-white" />
                </div>
                <h3 className="bold-20 text-gray-900 mb-3">تتبع تقدمك بذكاء</h3>
                <p className="regular-14 text-gray-600 mb-4">
                  شاهد تحسن درجاتك، اكتشف نقاط قوتك وضعفك، واحصل على خطة شخصية
                  للوصول لأهدافك
                </p>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                  تحليل ذكي
                </div>
              </div>

              {/* Feature 4 - Easy Access */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border-2 border-transparent hover:border-indigo-200">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-600 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:shadow-lg transition-all">
                  <FaCode className="w-10 h-10 text-white" />
                </div>
                <h3 className="bold-20 text-gray-900 mb-3">وصول سهل وآمن</h3>
                <p className="regular-14 text-gray-600 mb-4">
                  ادخل بكود بسيط واحصل على وصول فوري لجميع الدروس والامتحانات -
                  بدون تعقيدات!
                </p>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                  سهل وسريع
                </div>
              </div>

              {/* Feature 5 - Expert Teachers */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border-2 border-transparent hover:border-teal-200">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:shadow-lg transition-all">
                  <FaUserGraduate className="w-10 h-10 text-white" />
                </div>
                <h3 className="bold-20 text-gray-900 mb-3">
                  أفضل المدرسين في مصر
                </h3>
                <p className="regular-14 text-gray-600 mb-4">
                  تعلم من نخبة المدرسين المتخصصين الذين ساعدوا آلاف الطلاب على
                  التفوق والنجاح
                </p>
                <div className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">
                  خبرة مثبتة
                </div>
              </div>

              {/* Feature 6 - Flexible Learning */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-transparent hover:border-pink-200">
                <div className="bg-gradient-to-r from-pink-500 to-rose-600 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:shadow-lg transition-all">
                  <FaGraduationCap className="w-10 h-10 text-white" />
                </div>
                <h3 className="bold-20 text-gray-900 mb-3">
                  تعلم في أي وقت ومكان
                </h3>
                <p className="regular-14 text-gray-600 mb-4">
                  ادرس من البيت، المدرسة، أو أي مكان تريده. منصتنا متاحة 24/7
                  على جميع الأجهزة
                </p>
                <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">
                  مرونة كاملة
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Student Success Stories Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="max-container padding-container">
            <div className="text-center mb-16">
              <h2 className="bold-48 text-gray-900 mb-4">
                طلابنا يحققون المعجزات!
              </h2>
              <p className="regular-18 text-gray-600 max-w-2xl mx-auto">
                اقرأ قصص نجاح حقيقية من طلاب حسنوا درجاتهم بشكل مذهل
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Success Story 1 */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-green-500">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flexCenter text-white font-bold">
                    أ
                  </div>
                  <div className="mr-3">
                    <h4 className="bold-16 text-gray-900">أحمد محمد</h4>
                    <p className="regular-12 text-gray-600">طالب ثانوية عامة</p>
                  </div>
                </div>
                <p className="regular-14 text-gray-700 mb-4">
                  "كانت درجاتي في الرياضيات ضعيفة جداً، لكن بعد استخدام المساعد
                  الذكي والتدرب على الامتحانات، حسنت درجاتي من 45% إلى 92%!"
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-green-600 font-bold">45% → 92%</div>
                  <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>

              {/* Success Story 2 */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flexCenter text-white font-bold">
                    ف
                  </div>
                  <div className="mr-3">
                    <h4 className="bold-16 text-gray-900">فاطمة علي</h4>
                    <p className="regular-12 text-gray-600">طالبة إعدادية</p>
                  </div>
                </div>
                <p className="regular-14 text-gray-700 mb-4">
                  "المساعد الذكي ساعدني أفهم العلوم بطريقة سهلة ومبسطة. الآن أنا
                  من أوائل الفصل والكل يسألني عن سر تفوقي!"
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-blue-600 font-bold">المركز الأول</div>
                  <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>

              {/* Success Story 3 */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flexCenter text-white font-bold">
                    م
                  </div>
                  <div className="mr-3">
                    <h4 className="bold-16 text-gray-900">محمد حسن</h4>
                    <p className="regular-12 text-gray-600">طالب جامعي</p>
                  </div>
                </div>
                <p className="regular-14 text-gray-700 mb-4">
                  "الامتحانات التجريبية خلتني أتدرب على أسئلة مشابهة للامتحان
                  الحقيقي. نجحت في مادة كانت صعبة عليي جداً!"
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-purple-600 font-bold">نجاح مضمون</div>
                  <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            </div>

            {/* Call to Action in Success Section */}
            <div className="text-center mt-12">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-xl inline-block">
                <h3 className="bold-24 mb-2">أنت التالي في قائمة النجاح!</h3>
                <p className="regular-16 mb-4">
                  انضم لآلاف الطلاب الناجحين واحصل على نفس النتائج المذهلة
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span>✅ مساعد ذكي مجاني</span>
                  <span>✅ امتحانات تجريبية</span>
                  <span>✅ نتائج مضمونة</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {user ? (
          <section className="py-20 bg-gradient-to-r from-accent to-secondary">
            <div className="max-container padding-container">
              <div className="text-center text-white">
                <h2 className="bold-48 mb-4">جاهز لتحسين درجاتك؟</h2>
                <p className="regular-18 mb-8 max-w-2xl mx-auto">
                  ابدأ رحلتك نحو التفوق الأكاديمي! اختر مدرسك المفضل واحصل على
                  مساعد ذكي مجاني
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/instructors"
                    className="bg-white text-accent px-8 py-4 rounded-lg bold-16 hover:bg-gray-100 transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
                  >
                    اختر مدرسك الآن
                    <FaArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="flex items-center gap-2">
                      <FaRobot className="w-5 h-5" />
                      <span className="regular-14">مساعد مجاني</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaChartLine className="w-5 h-5" />
                      <span className="regular-14">تحسن مضمون</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-20 bg-gradient-to-r from-accent to-secondary">
            <div className="max-container padding-container">
              <div className="text-center text-white">
                <h2 className="bold-48 mb-4">احصل على درجات أعلى مجاناً!</h2>
                <p className="regular-18 mb-8 max-w-2xl mx-auto">
                  سجل الآن واحصل فوراً على مدرس ذكي شخصي مجاني، امتحانات
                  تجريبية، وتتبع ذكي لتقدمك - كل هذا بدون أي تكلفة!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/signup"
                    className="bg-white text-accent px-8 py-4 rounded-lg bold-16 hover:bg-gray-100 transition-all duration-300 inline-flex items-center gap-2 shadow-lg transform hover:scale-105"
                  >
                    ابدأ مجاناً الآن
                    <FaArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="flex items-center gap-2">
                      <FaRobot className="w-5 h-5" />
                      <span className="regular-14">مدرس مجاني</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaChartLine className="w-5 h-5" />
                      <span className="regular-14">نتائج مضمونة</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <Footer id="footer" />
      </div>
    </ProgressiveLoader>
  );
}
