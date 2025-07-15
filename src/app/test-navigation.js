"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FaArrowRight, FaPlay, FaBook } from "react-icons/fa";

const TestNavigation = () => {
  const router = useRouter();

  const testRoutes = [
    {
      name: "صفحة الكورس",
      path: "/instructors/instructor1/courses/course1",
      description: "صفحة عرض الكورس مع قائمة الدروس"
    },
    {
      name: "صفحة الدرس",
      path: "/instructors/instructor1/courses/course1/lessons/HHwtwb732",
      description: "صفحة عرض الدرس الجديدة مع التبويبات"
    },
    {
      name: "صفحة اختبار API",
      path: "/test-lesson-page",
      description: "صفحة اختبار API والبيانات"
    }
  ];

  const navigateTo = (path) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-main p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="bold-32 text-gray-900 mb-8 text-center">اختبار التنقل بين الصفحات</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="bold-24 text-gray-900 mb-4">التحديثات المنجزة</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-green-600">
              <FaPlay className="w-4 h-4" />
              <span>تم إنشاء صفحة عرض الدرس الجديدة</span>
            </div>
            <div className="flex items-center gap-3 text-green-600">
              <FaPlay className="w-4 h-4" />
              <span>تم ربط صفحة الكورس بصفحة الدرس الجديدة</span>
            </div>
            <div className="flex items-center gap-3 text-green-600">
              <FaPlay className="w-4 h-4" />
              <span>تم إزالة LessonViewer القديم</span>
            </div>
            <div className="flex items-center gap-3 text-green-600">
              <FaPlay className="w-4 h-4" />
              <span>تم تحديث LessonCard للتوجيه الصحيح</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testRoutes.map((route, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <FaBook className="w-5 h-5 text-accent" />
                <h3 className="bold-18 text-gray-900">{route.name}</h3>
              </div>
              
              <p className="regular-14 text-gray-600 mb-4">
                {route.description}
              </p>
              
              <div className="bg-gray-50 rounded p-3 mb-4">
                <code className="text-sm text-gray-700">{route.path}</code>
              </div>
              
              <button
                onClick={() => navigateTo(route.path)}
                className="w-full bg-accent text-white py-2 px-4 rounded-lg bold-14 hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
              >
                <span>انتقل</span>
                <FaArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="bold-18 text-blue-900 mb-3">كيفية الاختبار</h3>
          <ol className="space-y-2 text-blue-800">
            <li>1. انتقل إلى صفحة الكورس</li>
            <li>2. اضغط على "عرض الدرس" في أي درس</li>
            <li>3. ستنتقل إلى صفحة الدرس الجديدة</li>
            <li>4. تأكد من عمل التبويبات والمحتوى</li>
          </ol>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="bold-18 text-yellow-900 mb-3">ملاحظات مهمة</h3>
          <ul className="space-y-2 text-yellow-800">
            <li>• تأكد من تشغيل الخادم على localhost:8080</li>
            <li>• تأكد من وجود بيانات الدرس في قاعدة البيانات</li>
            <li>• استخدم معرف الدرس: HHwtwb732 للاختبار</li>
            <li>• تحقق من عمل API endpoint للدرس</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestNavigation;
