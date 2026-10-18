"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { studentAPI, handleAPIError } from "@/app/services/studentAPI";

/** Lets a student send a read-only progress link to a parent (WhatsApp or copy). */
export default function ParentReportShare() {
  const [link, setLink] = useState(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const { data } = await studentAPI.parentReport.createLink();
      setLink(data);
    } catch (e) {
      toast.error(handleAPIError(e, "تعذر إنشاء الرابط"));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("انسخ الرابط يدوياً");
    }
  };

  const whatsapp = link
    ? `https://wa.me/?text=${encodeURIComponent(`تقرير متابعة دراستي على أكاديميتنا: ${link.url}`)}`
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8" dir="rtl">
      <h2 className="bold-18 text-gray-900 mb-2">تقرير ولي الأمر</h2>
      <p className="regular-14 text-gray-600 mb-4">
        ابعت لولي أمرك رابط يتابع منه الدروس والدرجات بدون تسجيل دخول. الرابط صالح لمدة 30 يوم.
      </p>
      {!link ? (
        <button
          onClick={create}
          disabled={busy}
          className="bg-brand-600 text-white px-5 py-2 rounded-lg bold-14 disabled:opacity-50 cursor-pointer"
        >
          إنشاء رابط التقرير
        </button>
      ) : (
        <div className="flex flex-wrap gap-3 items-center">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg bold-14"
          >
            إرسال على واتساب
          </a>
          <button onClick={copy} className="bg-gray-200 px-5 py-2 rounded-lg bold-14 cursor-pointer">
            نسخ الرابط
          </button>
          <span className="regular-12 text-gray-500">
            ينتهي في {new Date(link.expiresAt).toLocaleDateString("ar-EG")}
          </span>
        </div>
      )}
    </div>
  );
}
