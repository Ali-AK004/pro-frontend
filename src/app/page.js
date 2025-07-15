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
} from "react-icons/fa";
import { useUserData } from "../../models/UserContext";
import NavBar from "./components/navBar";
import Footer from "./components/footer";

export default function Home() {
  const { user, loading } = useUserData();
  if (loading) {
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
  return (
    <div className="min-h-screen bg-main">
      <NavBar />
      {/* Hero Section */}
      <section className="relative min-h-screen flexCenter">
        <div className="max-container padding-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-right">
              <h1 className="bold-64 text-gray-900 mb-6 leading-tight">
                منصة التعليم الرقمي
                <span className="text-accent block">الأولى في مصر</span>
              </h1>
              <p className="regular-18 text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                ابدأ رحلتك التعليمية مع أفضل المدرسين والكورسات التفاعلية. تعلم
                في أي وقت ومن أي مكان بأحدث التقنيات التعليمية.
              </p>
              {user ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/instructors"
                    className="bg-accent text-white px-8 py-4 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
                  >
                    ابدأ التعلم الآن
                    <FaArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/signup"
                    className="bg-accent text-white px-8 py-4 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
                  >
                    ابدأ التعلم الآن
                    <FaArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="border-2 border-secondary text-secondary px-8 py-4 rounded-lg bold-16 hover:bg-[#87ceeb] hover:text-white transition-all duration-300 flexCenter gap-2"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              )}
            </div>

            {/* Hero Image/Video */}
            <div className="relative">
              <div className="bg-secondary rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 flexCenter flex-col">
                  <FaGraduationCap className="w-24 h-24 text-accent mb-4" />
                  <h3 className="bold-24 text-gray-900 mb-2">تعليم متميز</h3>
                  <p className="regular-16 text-gray-600 text-center">
                    أكثر من 10,000 طالب يثقون بنا
                  </p>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg p-4 shadow-lg">
                <div className="flexCenter gap-2">
                  <FaUsers className="w-6 h-6 text-accent" />
                  <div>
                    <p className="bold-16 text-gray-900">5000+</p>
                    <p className="regular-12 text-gray-600">طالب</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-4 shadow-lg">
                <div className="flexCenter gap-2">
                  <FaBookOpen className="w-6 h-6 text-secondary" />
                  <div>
                    <p className="bold-16 text-gray-900">200+</p>
                    <p className="regular-12 text-gray-600">كورس</p>
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
            <h2 className="bold-48 text-gray-900 mb-4">لماذا تختارنا؟</h2>
            <p className="regular-18 text-gray-600 max-w-2xl mx-auto">
              نقدم تجربة تعليمية متكاملة تجمع بين أحدث التقنيات وأفضل المدرسين
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-accent bg-opacity-10 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:bg-opacity-20 transition-all">
                <FaGraduationCap className="w-10 h-10 text-white" />
              </div>
              <h3 className="bold-20 text-gray-900 mb-3">مدرسين خبراء</h3>
              <p className="regular-14 text-gray-600">
                نخبة من أفضل المدرسين المتخصصين في جميع المواد
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-secondary bg-opacity-10 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:bg-opacity-20 transition-all">
                <FaPlay className="w-10 h-10 text-white" />
              </div>
              <h3 className="bold-20 text-gray-900 mb-3">دروس تفاعلية</h3>
              <p className="regular-14 text-gray-600">
                محتوى تفاعلي وممتع يجعل التعلم أكثر متعة وفعالية
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-green-500 bg-opacity-10 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:bg-opacity-20 transition-all">
                <FaCertificate className="w-10 h-10 text-white" />
              </div>
              <h3 className="bold-20 text-gray-900 mb-3">شهادات معتمدة</h3>
              <p className="regular-14 text-gray-600">
                احصل على شهادات معتمدة عند إتمام الكورسات بنجاح
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-yellow-500 bg-opacity-10 w-20 h-20 rounded-full flexCenter mx-auto mb-6 group-hover:bg-opacity-20 transition-all">
                <FaUsers className="w-10 h-10 text-white" />
              </div>
              <h3 className="bold-20 text-gray-900 mb-3">مجتمع تعليمي</h3>
              <p className="regular-14 text-gray-600">
                انضم لمجتمع من الطلاب والمدرسين للتعلم والنقاش
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {user ? (
        <section className="py-20 bg-accent">
          <div className="max-container padding-container">
            <div className="text-center text-white">
              <h2 className="bold-48 mb-4">ابدأ رحلتك التعليمية اليوم</h2>
              <p className="regular-18 mb-8 max-w-2xl mx-auto">
                انضم إلى آلاف الطلاب الذين حققوا أهدافهم التعليمية معنا
              </p>
              <Link
                href="/instructors"
                className="bg-white text-accent px-8 py-4 rounded-lg bold-16 hover:bg-gray-100 transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
              >
                ابدأ التعلم الآن
                <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 bg-accent">
          <div className="max-container padding-container">
            <div className="text-center text-white">
              <h2 className="bold-48 mb-4">ابدأ رحلتك التعليمية اليوم</h2>
              <p className="regular-18 mb-8 max-w-2xl mx-auto">
                انضم إلى آلاف الطلاب الذين حققوا أهدافهم التعليمية معنا
              </p>
              <Link
                href="/signup"
                className="bg-white text-accent px-8 py-4 rounded-lg bold-16 hover:bg-gray-100 transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
              >
                سجل الآن مجاناً
                <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer id="footer" />
    </div>
  );
}
