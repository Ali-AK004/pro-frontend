"use client";
import React from "react";
import { useRouter } from "next/navigation";

const TestLessonPage = () => {
  const router = useRouter();

  const testLessonData = {
    lesson: {
      id: "HHwtwb732",
      courseId: "WO9N45ZV3",
      name: "anchor Tag | HTML",
      description: "Learn anchor Tag",
      photoUrl: "https://images.unsplash.com/photo-1542626991-cbc4e32524cc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGNvdXJzZXxlbnwwfHwwfHx8MA%3D%3D",
      price: 20.00,
      instructorId: null,
      instructorName: null,
      accessExpiryDate: null,
      expired: false
    },
    exam: {
      id: "m76KfM8b4",
      lessonId: "HHwtwb732",
      title: "hekho hekho",
      passingScore: 10.00,
      score: null,
      passed: false,
      questions: [
        {
          id: "jCBkU8P1o",
          questionText: "how r u",
          questionType: "SINGLE_CHOICE",
          points: 10.00,
          answers: [
            {
              id: "Tgm83Dg1S",
              answerText: "good",
              correct: true
            },
            {
              id: "vZwZV7AGS",
              answerText: "bad",
              correct: false
            },
            {
              id: "oawGXUfHG",
              answerText: "worse",
              correct: false
            },
            {
              id: "jX7Z4HkTt",
              answerText: "bitch",
              correct: false
            }
          ]
        }
      ],
      questionResults: null,
      maxPoints: null,
      errorMessage: null
    },
    assignment: {
      id: "M4oT3TIeq",
      lessonId: "HHwtwb732",
      title: "meooooooW!!",
      description: "fk u",
      dueDate: "2025-07-16T09:30:00.000+00:00",
      maxPoints: 100.00,
      assignmentId: null,
      studentId: null,
      submissionText: null,
      submissionDate: null,
      grade: null,
      feedback: null,
      isOverdue: null,
      timeRemaining: null,
      submissionCount: null,
      averageGrade: null,
      gradedCount: null,
      submissions: null
    },
    hasAccess: true,
    videoUrl: null,
    accessError: "Complete and pass the exam to unlock video content",
    progressStatus: "PURCHASED",
    canAccessVideo: false,
    canAccessExam: true,
    canAccessAssignment: false
  };

  const handleTestAPI = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/students/lessons/HHwtwb732`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        alert('API call successful! Check console for data.');
      } else {
        console.error('API Error:', response.status, response.statusText);
        alert(`API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert(`Network Error: ${error.message}`);
    }
  };

  const navigateToLessonPage = () => {
    // Navigate to the actual lesson page
    router.push('/instructors/instructor1/courses/course1/lessons/HHwtwb732');
  };

  return (
    <div className="min-h-screen bg-main p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="bold-32 text-gray-900 mb-8">اختبار صفحة الدرس</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="bold-24 text-gray-900 mb-4">بيانات الدرس التجريبية</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(testLessonData, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleTestAPI}
            className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors"
          >
            اختبار API
          </button>
          
          <button
            onClick={navigateToLessonPage}
            className="bg-secondary text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors"
          >
            الذهاب إلى صفحة الدرس
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="bold-18 text-blue-900 mb-3">معلومات مهمة</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• تم إنشاء صفحة عرض الدرس بنجاح</li>
            <li>• الصفحة تدعم عرض الامتحان والفيديو والواجب</li>
            <li>• يتم التحكم في الوصول بناءً على حالة التقدم</li>
            <li>• API endpoint: http://localhost:8080/api/students/lessons/{`{lessonId}`}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestLessonPage;
