"use client";
import React, { useState } from "react";
import CustomVideoPlayer from "./components/CustomVideoPlayer";
import { FaYoutube, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const TestYouTubeIntegration = () => {
  const [testResults, setTestResults] = useState({});
  const [currentTest, setCurrentTest] = useState(null);

  const testCases = [
    {
      id: "youtube-watch",
      name: "YouTube Watch URL",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      expectedId: "dQw4w9WgXcQ",
      description: "رابط YouTube عادي مع watch?v="
    },
    {
      id: "youtube-short",
      name: "YouTube Short URL", 
      url: "https://youtu.be/dQw4w9WgXcQ",
      expectedId: "dQw4w9WgXcQ",
      description: "رابط YouTube مختصر"
    },
    {
      id: "youtube-embed",
      name: "YouTube Embed URL",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      expectedId: "dQw4w9WgXcQ", 
      description: "رابط YouTube embed"
    },
    {
      id: "youtube-params",
      name: "YouTube URL with Parameters",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=PLrAXtmRdnEQy",
      expectedId: "dQw4w9WgXcQ",
      description: "رابط YouTube مع معاملات إضافية"
    },
    {
      id: "regular-video",
      name: "Regular MP4 Video",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      expectedId: null,
      description: "ملف فيديو MP4 عادي"
    }
  ];

  // Extract YouTube ID function (same as in CustomVideoPlayer)
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const runTest = (testCase) => {
    const extractedId = extractYouTubeId(testCase.url);
    const isYouTube = !!extractedId;
    const passed = testCase.expectedId ? extractedId === testCase.expectedId : !extractedId;
    
    const result = {
      passed,
      extractedId,
      isYouTube,
      expectedId: testCase.expectedId,
      url: testCase.url
    };

    setTestResults(prev => ({
      ...prev,
      [testCase.id]: result
    }));

    return result;
  };

  const runAllTests = () => {
    testCases.forEach(testCase => {
      runTest(testCase);
    });
  };

  const getTestIcon = (testId) => {
    const result = testResults[testId];
    if (!result) return null;
    
    return result.passed ? (
      <FaCheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <FaExclamationTriangle className="w-5 h-5 text-red-500" />
    );
  };

  const getTestColor = (testId) => {
    const result = testResults[testId];
    if (!result) return "border-gray-200";
    
    return result.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50";
  };

  return (
    <div className="min-h-screen bg-main p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="bold-32 text-gray-900 mb-8 text-center">اختبار تكامل YouTube</h1>
        
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="bold-24 text-gray-900">اختبارات استخراج معرف YouTube</h2>
            <button
              onClick={runAllTests}
              className="bg-accent text-white px-6 py-2 rounded-lg bold-14 hover:bg-opacity-90 transition-colors"
            >
              تشغيل جميع الاختبارات
            </button>
          </div>

          {/* Test Cases */}
          <div className="grid grid-cols-1 gap-4">
            {testCases.map((testCase) => (
              <div
                key={testCase.id}
                className={`border-2 rounded-lg p-4 transition-all ${getTestColor(testCase.id)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTestIcon(testCase.id)}
                    <h3 className="bold-16 text-gray-900">{testCase.name}</h3>
                  </div>
                  <button
                    onClick={() => runTest(testCase)}
                    className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    اختبار
                  </button>
                </div>
                
                <p className="regular-14 text-gray-600 mb-3">{testCase.description}</p>
                
                <div className="bg-gray-100 rounded p-3 mb-3">
                  <code className="text-sm text-gray-700 break-all">{testCase.url}</code>
                </div>

                {testResults[testCase.id] && (
                  <div className="bg-white rounded p-3 border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>متوقع:</strong> {testCase.expectedId || "ليس YouTube"}
                      </div>
                      <div>
                        <strong>مستخرج:</strong> {testResults[testCase.id].extractedId || "لا يوجد"}
                      </div>
                      <div>
                        <strong>نوع:</strong> {testResults[testCase.id].isYouTube ? "YouTube" : "فيديو عادي"}
                      </div>
                      <div>
                        <strong>النتيجة:</strong> 
                        <span className={testResults[testCase.id].passed ? "text-green-600" : "text-red-600"}>
                          {testResults[testCase.id].passed ? " نجح" : " فشل"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Video Player Test */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="bold-24 text-gray-900 mb-4">اختبار المشغل</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {testCases.slice(0, 3).map((testCase) => (
              <button
                key={testCase.id}
                onClick={() => setCurrentTest(testCase)}
                className={`p-4 rounded-lg border-2 transition-all text-right ${
                  currentTest?.id === testCase.id
                    ? "border-accent bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FaYoutube className="w-5 h-5 text-red-500" />
                  <span className="bold-16 text-gray-900">{testCase.name}</span>
                </div>
                <p className="regular-14 text-gray-600">{testCase.description}</p>
              </button>
            ))}
          </div>

          {currentTest && (
            <div>
              <h3 className="bold-18 text-gray-900 mb-4">
                اختبار: {currentTest.name}
              </h3>
              
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                <CustomVideoPlayer
                  videoUrl={currentTest.url}
                  onEnded={() => alert(`انتهى الفيديو: ${currentTest.name}`)}
                  className="w-full h-full"
                />
              </div>
              
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600 mb-2">الرابط المختبر:</p>
                <code className="text-sm text-gray-700 break-all">{currentTest.url}</code>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="bold-18 text-blue-900 mb-3">كيفية الاختبار</h3>
          <ol className="space-y-2 text-blue-800">
            <li>1. اضغط على "تشغيل جميع الاختبارات" للتحقق من استخراج معرفات YouTube</li>
            <li>2. اختر أحد الفيديوهات لاختبار المشغل</li>
            <li>3. تأكد من ظهور الفيديو وإمكانية تشغيله</li>
            <li>4. افتح Developer Console لرؤية رسائل التشخيص</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestYouTubeIntegration;
