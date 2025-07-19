"use client";
import React, { useState } from "react";
import CustomVideoPlayer from "./instructors/[instructorId]/courses/[courseId]/components/CustomVideoPlayer";
import { FaPlay, FaYoutube, FaVideo } from "react-icons/fa";

const TestVideoPlayer = () => {
  const [selectedVideo, setSelectedVideo] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const testVideos = [
    {
      name: "YouTube Video 1",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "youtube",
      description: "رابط YouTube عادي",
    },
    {
      name: "YouTube Video 2",
      url: "https://youtu.be/dQw4w9WgXcQ",
      type: "youtube",
      description: "رابط YouTube مختصر",
    },
    {
      name: "YouTube Embed",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      type: "youtube",
      description: "رابط YouTube embed",
    },
    {
      name: "MP4 Video",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      type: "mp4",
      description: "ملف فيديو MP4 مباشر",
    },
  ];

  const handleVideoComplete = () => {
    alert("تم انتهاء الفيديو!");
    console.log("Video completed!");
  };

  return (
    <div className="min-h-screen bg-main p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="bold-32 text-gray-900 mb-8 text-center">
          اختبار مشغل الفيديو المخصص
        </h1>

        {/* Video Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="bold-24 text-gray-900 mb-4">اختر فيديو للاختبار</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {testVideos.map((video, index) => (
              <button
                key={index}
                onClick={() => setSelectedVideo(video.url)}
                className={`p-4 rounded-lg border-2 transition-all text-right ${
                  selectedVideo === video.url
                    ? "border-accent bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {video.type === "youtube" ? (
                    <FaYoutube className="w-5 h-5 text-red-500" />
                  ) : (
                    <FaVideo className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="bold-16 text-gray-900">{video.name}</span>
                </div>
                <p className="regular-14 text-gray-600 mb-2">
                  {video.description}
                </p>
                <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded">
                  {video.url}
                </code>
              </button>
            ))}
          </div>

          {/* Custom URL Input */}
          <div className="border-t pt-4">
            <h3 className="bold-18 text-gray-900 mb-3">أو أدخل رابط مخصص</h3>
            <div className="flex gap-3">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="أدخل رابط الفيديو هنا..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button
                onClick={() => setSelectedVideo(customUrl)}
                disabled={!customUrl.trim()}
                className="bg-accent text-white px-6 py-3 rounded-lg bold-14 hover:bg-opacity-90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                اختبار
              </button>
            </div>
          </div>
        </div>

        {/* Video Player */}
        {selectedVideo && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaPlay className="w-5 h-5 text-accent" />
              <h2 className="bold-24 text-gray-900">مشغل الفيديو</h2>
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
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="bold-18 text-blue-900 mb-3">تعليمات الاختبار</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• اختر أحد الفيديوهات المحددة مسبقاً أو أدخل رابط مخصص</li>
            <li>• المشغل يدعم روابط YouTube بجميع أشكالها</li>
            <li>• المشغل يدعم ملفات الفيديو المباشرة (MP4, WebM, etc.)</li>
            <li>• سيتم استدعاء دالة onEnded عند انتهاء الفيديو</li>
            <li>
              • للفيديوهات العادية: يمكن التحكم في التشغيل والصوت والشاشة
              الكاملة
            </li>
            <li>• لفيديوهات YouTube: يتم استخدام مشغل YouTube المدمج</li>
          </ul>
        </div>

        {/* Debug Info */}
        {selectedVideo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
            <h3 className="bold-18 text-gray-900 mb-3">معلومات التشخيص</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>الرابط:</strong> {selectedVideo}
              </p>
              <p>
                <strong>نوع الفيديو:</strong>{" "}
                {selectedVideo.includes("youtube.com") ||
                selectedVideo.includes("youtu.be")
                  ? "YouTube"
                  : "ملف فيديو مباشر"}
              </p>
              <p>
                <strong>معرف YouTube:</strong>{" "}
                {(() => {
                  const regExp =
                    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                  const match = selectedVideo.match(regExp);
                  return match && match[2].length === 11
                    ? match[2]
                    : "غير متاح";
                })()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestVideoPlayer;
