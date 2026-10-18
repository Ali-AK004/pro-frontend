"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { apiConfig } from "@/config/api";

/** Read-only progress report for a parent, opened from a signed link (no login). */
export default function ParentReportPage() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${apiConfig.baseURL}/public/parent-report/${encodeURIComponent(token)}`)
      .then((res) => setReport(res.data))
      .catch((e) => setError(e.response?.data?.message || "تعذر تحميل التقرير"));
  }, [token]);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <p className="bold-18 text-red-600">{error}</p>
      </main>
    );
  }
  if (!report) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <p className="regular-16 text-gray-500">جاري تحميل التقرير...</p>
      </main>
    );
  }

  const fmt = (d) => (d ? new Date(d).toLocaleDateString("ar-EG") : "—");

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <meta name="robots" content="noindex, nofollow" />
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="bg-white rounded-xl shadow-sm p-6">
          <p className="regular-14 text-gray-500">تقرير متابعة الطالب</p>
          <h1 className="bold-28 text-gray-900">{report.studentName}</h1>
          <p className="regular-14 text-gray-500 mt-1">آخر دخول: {fmt(report.lastLogin)}</p>
        </header>

        <section className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="bold-24">{report.lessonsCount}</p>
            <p className="regular-12 text-gray-500">درس مشترك</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="bold-24">{report.completedCount}</p>
            <p className="regular-12 text-gray-500">درس مكتمل</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="bold-24">{report.averageExamScore != null ? `${report.averageExamScore}%` : "—"}</p>
            <p className="regular-12 text-gray-500">متوسط الامتحانات</p>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
          <table className="w-full text-right regular-14">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="py-2">الدرس</th>
                <th className="py-2">الحالة</th>
                <th className="py-2">الامتحان</th>
                <th className="py-2">الواجب</th>
                <th className="py-2">المشاهدات</th>
                <th className="py-2">ينتهي</th>
              </tr>
            </thead>
            <tbody>
              {report.lessons.map((l, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">
                    <p className="bold-14">{l.lessonName}</p>
                    <p className="regular-12 text-gray-500">{l.courseName}</p>
                  </td>
                  <td className="py-2">{l.progress}</td>
                  <td className={`py-2 ${l.examPassed === false ? "text-red-600" : l.examPassed ? "text-emerald-600" : ""}`}>
                    {l.examScore != null ? `${l.examScore}% (${l.examAttempts} محاولة)` : "—"}
                  </td>
                  <td className="py-2">
                    {l.assignmentGrade != null ? `${l.assignmentGrade} / ${l.assignmentMax ?? "—"}` : "—"}
                  </td>
                  <td className="py-2">{l.videoViews}</td>
                  <td className={`py-2 ${l.expired ? "text-red-600" : ""}`}>{l.expired ? "منتهي" : fmt(l.accessExpiry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.lessons.length === 0 ? (
            <p className="regular-14 text-gray-500 text-center py-6">لا توجد دروس بعد</p>
          ) : null}
        </section>

        <p className="regular-12 text-gray-400 text-center">صلاحية هذا الرابط حتى {fmt(report.linkExpiresAt)}</p>
      </div>
    </main>
  );
}
