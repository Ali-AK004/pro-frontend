"use client";

import { useEffect, useState } from "react";
import { FaLayerGroup, FaCalendarAlt } from "react-icons/fa";
import { commerceAPI } from "../../../../../services/commerceAPI";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "");

/** Bundles on sale that include lessons of this course. Hidden when there are none. */
export default function BundlesSection({ courseId, refreshKey, onBuy }) {
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    if (!courseId) return;
    commerceAPI
      .bundlesForCourse(courseId)
      .then((res) => setBundles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBundles([]));
  }, [courseId, refreshKey]);

  if (!bundles.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FaLayerGroup className="w-5 h-5 text-accent" />
        الباقات
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bundles.map((b) => {
          const price = Number(b.price);
          const total = Number(b.lessonsTotal || 0);
          const saving = total > price ? Math.round(((total - price) / total) * 100) : 0;
          return (
            <div key={b.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <h3 className="bold-18 text-gray-900">{b.title}</h3>
                {saving > 0 ? (
                  <span className="shrink-0 bg-emerald-100 text-emerald-700 regular-12 px-2 py-1 rounded-full">
                    وفّر {saving}%
                  </span>
                ) : null}
              </div>
              {b.description ? <p className="regular-14 text-gray-600">{b.description}</p> : null}
              <ul className="regular-12 text-gray-600 list-disc pr-5 space-y-1">
                {b.lessons.slice(0, 6).map((l) => (
                  <li key={l.id}>
                    {l.name}
                    {l.courseId !== courseId && l.courseName ? <span className="text-gray-400"> ({l.courseName})</span> : null}
                  </li>
                ))}
                {b.lessons.length > 6 ? <li>و{b.lessons.length - 6} دروس أخرى</li> : null}
              </ul>
              <p className="regular-12 text-gray-500 flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3" />
                {b.accessUntil
                  ? `متاحة حتى ${fmtDate(b.accessUntil)}`
                  : b.accessDays
                  ? `متاحة لمدة ${b.accessDays} يوم من الشراء`
                  : "متاحة لمدة الوصول المعتادة"}
              </p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <div>
                  <span className="bold-18 text-accent">{price} جنيه</span>
                  {total > price ? (
                    <span className="regular-12 text-gray-400 line-through mr-2">{total} جنيه</span>
                  ) : null}
                </div>
                <button
                  onClick={() => onBuy(b)}
                  className="bg-accent text-white px-5 py-2 rounded-lg bold-14 hover:bg-opacity-90 cursor-pointer"
                >
                  اشترِ الباقة
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
