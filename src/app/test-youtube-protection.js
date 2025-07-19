"use client";
import React, { useState } from "react";
import CustomVideoPlayer from "./instructors/[instructorId]/courses/[courseId]/components/CustomVideoPlayer";
import { FaYoutube, FaShield, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const TestYouTubeProtection = () => {
  const [selectedVideo, setSelectedVideo] = useState("");
  const [testResults, setTestResults] = useState({});

  const testVideos = [
    {
      id: "youtube-standard",
      name: "YouTube Standard URL",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description: "رابط YouTube عادي - يجب منع الوصول إلى controls",
      platform: "YouTube"
    },
    {
      id: "youtube-short",
      name: "YouTube Short URL",
      url: "https://youtu.be/dQw4w9WgXcQ",
      description: "رابط YouTube مختصر - يجب منع الوصول إلى controls",
      platform: "YouTube"
    },
    {
      id: "youtube-embed",
      name: "YouTube Embed URL",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      description: "رابط YouTube embed - يجب منع الوصول إلى controls",
      platform: "YouTube"
    },
    {
      id: "vimeo-video",
      name: "Vimeo Video",
      url: "https://vimeo.com/90509568",
      description: "فيديو Vimeo - يجب إخفاء controls الأصلية",
      platform: "Vimeo"
    },
    {
      id: "mp4-direct",
      name: "Direct MP4 File",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      description: "ملف MP4 مباشر - تحكم مخصص كامل",
      platform: "Direct"
    }
  ];

  const protectionFeatures = [
    {
      feature: "منع الوصول إلى YouTube controls",
      description: "طبقة شفافة تغطي منطقة controls العلوية",
      status: "active"
    },
    {
      feature: "تعطيل keyboard shortcuts",
      description: "منع استخدام اختصارات لوحة المفاتيح للتحكم",
      status: "active"
    },
    {
      feature: "إخفاء معلومات الفيديو",
      description: "إخفاء عنوان الفيديو ومعلومات القناة",
      status: "active"
    },
    {
      feature: "منع الانتقال إلى YouTube",
      description: "تعطيل الروابط التي تؤدي إلى موقع YouTube",
      status: "active"
    },
    {
      feature: "تحكم مخصص كامل",
      description: "استبدال controls الأصلية بتحكم مخصص",
      status: "active"
    },
    {
      feature: "دعم منصات متعددة",
      description: "دعم YouTube, Vimeo, Dailymotion وملفات مباشرة",
      status: "active"
    }
  ];

  const handleVideoComplete = () => {
    alert("تم انتهاء الفيديو!");
    console.log("Video completed!");
  };

  const testProtection = (videoId) => {
    // هذا اختبار بصري - يجب على المستخدم التحقق يدوياً
    setTestResults(prev => ({
      ...prev,
      [videoId]: {
        tested: true,
        timestamp: new Date().toLocaleTimeString()
      }
    }));
  };

  return (
    <div className="min-h-screen bg-main p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaShield className="w-8 h-8 text-green-500" />
            <h1 className="bold-32 text-gray-900">اختبار حماية YouTube Controls</h1>
          </div>
          <p className="regular-16 text-gray-600">
            اختبار منع الوصول إلى controls الأصلية لـ YouTube ومنصات الفيديو الأخرى
          </p>
        </div>

        {/* Protection Features */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="bold-24 text-gray-900 mb-4">ميزات الحماية المطبقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protectionFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <FaCheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="bold-16 text-green-800">{feature.feature}</h3>
                  <p className="regular-14 text-green-700">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="bold-24 text-gray-900 mb-4">اختر فيديو للاختبار</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testVideos.map((video) => (
              <div
                key={video.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedVideo === video.url
                    ? "border-accent bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedVideo(video.url)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <FaYoutube className={`w-5 h-5 ${
                    video.platform === "YouTube" ? "text-red-500" :
                    video.platform === "Vimeo" ? "text-blue-500" :
                    "text-gray-500"
                  }`} />
                  <span className="bold-16 text-gray-900">{video.name}</span>
                </div>
                
                <p className="regular-14 text-gray-600 mb-3">{video.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {video.platform}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      testProtection(video.id);
                    }}
                    className="text-xs bg-accent text-white px-3 py-1 rounded hover:bg-opacity-90 transition-colors"
                  >
                    اختبار الحماية
                  </button>
                </div>

                {testResults[video.id] && (
                  <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
                    تم الاختبار في: {testResults[video.id].timestamp}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Video Player */}
        {selectedVideo && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaShield className="w-5 h-5 text-green-500" />
              <h2 className="bold-24 text-gray-900">مشغل الفيديو المحمي</h2>
            </div>
            
            <div className="mb-4">
              <p className="regular-14 text-gray-600 mb-2">الرابط المحدد:</p>
              <code className="text-sm text-gray-700 bg-gray-100 p-2 rounded block break-all">
                {selectedVideo}
              </code>
            </div>

            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <CustomVideoPlayer
                videoUrl={selectedVideo}
                onEnded={handleVideoComplete}
              />
            </div>
          </div>
        )}

        {/* Test Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="bold-18 text-yellow-900">تعليمات الاختبار</h3>
          </div>
          <ol className="space-y-2 text-yellow-800">
            <li>1. اختر فيديو من القائمة أعلاه</li>
            <li>2. حاول الضغط على المنطقة العلوية من الفيديو (حيث توجد controls YouTube عادة)</li>
            <li>3. تأكد من عدم ظهور controls YouTube الأصلية</li>
            <li>4. جرب استخدام اختصارات لوحة المفاتيح (مسافة، أسهم، إلخ)</li>
            <li>5. تأكد من عمل التحكم المخصص في الأسفل فقط</li>
            <li>6. تحقق من عدم وجود روابط تؤدي إلى YouTube</li>
          </ol>
        </div>

        {/* Expected Results */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="bold-18 text-green-900 mb-3">النتائج المتوقعة</h3>
          <ul className="space-y-2 text-green-800">
            <li>✅ عدم ظهور controls YouTube الأصلية</li>
            <li>✅ عدم إمكانية الضغط على المنطقة العلوية</li>
            <li>✅ تعطيل اختصارات لوحة المفاتيح</li>
            <li>✅ ظهور التحكم المخصص في الأسفل فقط</li>
            <li>✅ عدم وجود روابط إلى YouTube</li>
            <li>✅ إمكانية التحكم الكامل من خلال الواجهة المخصصة</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestYouTubeProtection;
