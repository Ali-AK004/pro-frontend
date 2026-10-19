"use client";

import { useMemo, useState } from "react";
import { FiCheck, FiX, FiClock, FiMessageSquare, FiAlertTriangle, FiLock } from "react-icons/fi";
import { Badge, cx, fmtDateTime, inputClass, textareaClass } from "../ui";
import { ExamImage, OutcomeBadge, PlainText, TypeBadge } from "./ExamBits";
import { fmtDuration, fmtPoints, fmtScore } from "./examModel";

const INTEGRITY_LABELS = {
  TAB_HIDDEN: "ترك صفحة الامتحان",
  WINDOW_BLUR: "خرج من النافذة",
  PASTE: "لصق نص",
  COPY: "نسخ نص",
  FULLSCREEN_EXIT: "خرج من ملء الشاشة",
};

export const integrityText = (detail) =>
  (detail || "")
    .split(";")
    .filter(Boolean)
    .map((part) => {
      const [k, n] = part.split("=");
      return `${INTEGRITY_LABELS[k] || k}: ${Number(n).toLocaleString("ar-EG")}`;
    })
    .join(" · ");

/**
 * A submission question by question. Students: score summary, then answers and explanations when
 * the results policy allows. Staff (editable): points and comments per question.
 * grades: { [questionId]: { points, feedback } }, onGrade(questionId, patch).
 */
export default function ExamResultView({ review, staff = false, editable = false, grades = {}, onGrade, compact = false }) {
  const [filter, setFilter] = useState("ALL");
  const questions = useMemo(() => review?.questions || [], [review]);
  const counts = useMemo(() => {
    const c = { ALL: questions.length, WRONG: 0, CORRECT: 0, BLANK: 0, PENDING: 0 };
    questions.forEach((q) => {
      if (q.outcome === "PARTIAL" || q.outcome === "WRONG") c.WRONG++;
      else if (c[q.outcome] != null) c[q.outcome]++;
    });
    return c;
  }, [questions]);
  if (!review) return null;
  const shown = questions.filter((q) =>
    filter === "ALL" ? true : filter === "WRONG" ? q.outcome === "WRONG" || q.outcome === "PARTIAL" : q.outcome === filter
  );
  const pending = review.status === "PENDING_REVIEW";

  return (
    <div className="space-y-3">
      <Summary review={review} staff={staff} compact={compact} />

      {review.feedback && !editable ? (
        <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-sm text-slate-700">
          <FiMessageSquare className="w-4 h-4 mt-0.5 text-brand-700 shrink-0" />
          <div>
            <p className="text-xs font-medium text-brand-700 mb-0.5">ملاحظة المدرس</p>
            <PlainText text={review.feedback} />
          </div>
        </div>
      ) : null}

      {!review.detailsVisible && !staff ? (
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <FiLock className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
          {pending
            ? "ستظهر تفاصيل الإجابات بعد انتهاء المدرس من التصحيح."
            : "تفاصيل الإجابات الصحيحة غير متاحة الآن حسب إعدادات هذا الامتحان (تظهر بعد النجاح أو آخر محاولة أو بعد موعد الإغلاق)."}
        </div>
      ) : null}

      {questions.length ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["ALL", "الكل"],
              ["WRONG", "الخاطئة"],
              ["CORRECT", "الصحيحة"],
              ["BLANK", "المتروكة"],
              ["PENDING", "تحتاج تصحيح"],
            ]
              .filter(([id]) => id === "ALL" || counts[id])
              .map(([id, label]) => (
                <button key={id} type="button" onClick={() => setFilter(id)}
                  className={cx("h-7 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                    filter === id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                  {label} ({counts[id].toLocaleString("ar-EG")})
                </button>
              ))}
          </div>
          <div className="space-y-2.5">
            {shown.map((q) => (
              <QuestionResult key={q.id} q={q} staff={staff} editable={editable} grade={grades[q.id]} onGrade={onGrade} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Summary({ review, staff, compact }) {
  const pending = review.status === "PENDING_REVIEW";
  const tone = pending ? "warning" : review.passed ? "success" : "danger";
  const ring = { success: "text-emerald-500", danger: "text-red-500", warning: "text-amber-500" }[tone];
  const pct = Math.max(0, Math.min(100, Number(review.score) || 0));
  const C = 2 * Math.PI * 34;
  return (
    <div className={cx("bg-white rounded-xl border border-slate-200", compact ? "p-3" : "p-4 sm:p-5")}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-20 h-20 shrink-0" aria-label={`الدرجة ${fmtScore(review.score)}`}>
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="34" className="stroke-slate-100" strokeWidth="8" fill="none" />
            <circle cx="40" cy="40" r="34" className={cx("stroke-current", ring)} strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C - (pct / 100) * C} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-slate-900">{fmtScore(review.score)}</span>
        </div>
        <div className="flex-1 min-w-40">
          <div className="flex flex-wrap items-center gap-2">
            {pending ? (
              <>
                {review.passed ? <Badge tone="success"><FiCheck className="w-3 h-3" /> ناجح</Badge> : null}
                <Badge tone="warning"><FiClock className="w-3 h-3" /> قيد التصحيح</Badge>
              </>
            ) : review.passed ? (
              <Badge tone="success"><FiCheck className="w-3 h-3" /> ناجح</Badge>
            ) : (
              <Badge tone="danger"><FiX className="w-3 h-3" /> لم يجتز</Badge>
            )}
            {review.autoSubmitted ? <Badge tone="gray">سُلّم تلقائياً عند انتهاء الوقت</Badge> : null}
            {staff && review.integrityEvents > 0 ? (
              <Badge tone={review.integrityEvents >= 3 ? "warning" : "gray"}>
                <FiAlertTriangle className="w-3 h-3" /> {review.integrityEvents.toLocaleString("ar-EG")} تنبيه
              </Badge>
            ) : null}
          </div>
          {staff ? (
            <p className="mt-1.5 text-sm font-semibold text-slate-900">
              {review.studentName} <span className="font-normal text-xs text-slate-400" dir="ltr">{review.studentEmail}</span>
            </p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            {pending
              ? review.passed
                ? "اجتزت الامتحان بدرجتك الحالية، والدرجة النهائية تكتمل بعد تصحيح المدرس للأسئلة المقالية."
                : "الدرجة الحالية بدون الأسئلة المقالية، وتكتمل بعد تصحيح المدرس."
              : review.passed
                ? "أحسنت! اجتزت الامتحان."
                : `درجة النجاح ${fmtScore(review.passingScore)}.`}
          </p>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-1 text-xs">
          <Stat label="الدرجة" value={`${fmtPoints(review.pointsEarned)} / ${fmtPoints(review.maxPoints)}`} />
          <Stat label="المحاولة" value={Number(review.attemptNumber || 1).toLocaleString("ar-EG")} />
          <Stat label="الوقت" value={fmtDuration(review.timeSpentSeconds)} />
          <Stat label="التسليم" value={fmtDateTime(review.submittedAt)} />
        </dl>
      </div>
      {staff && review.integrityDetail ? (
        <p className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          سلوك أثناء الامتحان: {integrityText(review.integrityDetail)}. هذه مؤشرات وليست دليلاً قاطعاً على الغش.
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800 whitespace-nowrap">{value}</dd>
    </div>
  );
}

function QuestionResult({ q, staff, editable, grade, onGrade }) {
  const choice = q.options && q.options.length > 0;
  const border = {
    CORRECT: "border-r-emerald-500", PARTIAL: "border-r-amber-500", WRONG: "border-r-red-500",
    BLANK: "border-r-slate-300", PENDING: "border-r-amber-500",
  }[q.outcome] || "border-r-slate-300";
  return (
    <article className={cx("bg-white rounded-xl border border-slate-200 border-r-4 p-3 sm:p-4", border)}>
      <header className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-bold text-slate-500">س{Number(q.number).toLocaleString("ar-EG")}</span>
        <TypeBadge type={q.type} />
        <OutcomeBadge outcome={q.outcome} />
        <span className="mr-auto text-xs text-slate-500">
          {fmtPoints(q.earned)} / {fmtPoints(q.points)}
          {q.manuallyGraded ? " · صححه المدرس" : ""}
        </span>
      </header>
      <PlainText text={q.text} className="text-sm text-slate-900 font-medium mb-2" />
      {q.imageId ? <ExamImage id={q.imageId} className="mb-2 max-h-56" /> : null}

      {choice ? (
        <ul className="space-y-1">
          {q.options.map((o) => {
            const right = o.correct === true;
            const wrongPick = o.selected && o.correct === false;
            return (
              <li key={o.id}
                className={cx("flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-sm border",
                  right ? "border-emerald-200 bg-emerald-50/70" : wrongPick ? "border-red-200 bg-red-50/70" : "border-transparent")}>
                <span className="mt-0.5 shrink-0 w-4 text-center">
                  {right ? <FiCheck className="w-4 h-4 text-emerald-600" /> : wrongPick ? <FiX className="w-4 h-4 text-red-600" /> : null}
                </span>
                <span dir="auto" className="flex-1 whitespace-pre-wrap break-words text-slate-700">{o.text}</span>
                {o.selected ? <span className="shrink-0 text-[11px] text-slate-500">{staff ? "اختيار الطالب" : "اختيارك"}</span> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-1.5 text-sm">
          <div className="rounded-lg bg-slate-50 px-2.5 py-2">
            <p className="text-[11px] text-slate-400 mb-0.5">{staff ? "إجابة الطالب" : "إجابتك"}</p>
            {q.answerText ? <PlainText text={q.answerText} className="text-slate-800" /> : <span className="text-slate-400">لم يُجب</span>}
          </div>
          {q.correctAnswer ? (
            <p className="text-xs text-emerald-700"><span className="text-slate-500">الإجابة الصحيحة: </span><span dir="auto">{q.correctAnswer}</span></p>
          ) : null}
        </div>
      )}

      {q.explanation ? (
        <div className="mt-2 rounded-lg bg-brand-50/50 px-2.5 py-2 text-xs text-slate-700">
          <span className="font-medium text-brand-700">{q.type === "ESSAY" ? "دليل التصحيح: " : "الشرح: "}</span>
          <PlainText text={q.explanation} className="inline" />
        </div>
      ) : null}
      {q.feedback && !editable ? (
        <p className="mt-2 text-xs text-slate-600"><span className="font-medium">ملاحظة المدرس: </span><span dir="auto">{q.feedback}</span></p>
      ) : null}

      {editable ? (
        <div className="mt-3 pt-3 border-t border-slate-100 grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
          <label className="block">
            <span className="block mb-1 text-[11px] font-medium text-slate-600">الدرجة (من {fmtPoints(q.points)})</span>
            <input type="number" min="0" max={q.points} step="0.25" className={cx(inputClass, q.needsGrading && "border-amber-300")}
              value={grade?.points ?? (q.needsGrading ? "" : q.earned ?? "")}
              placeholder={q.needsGrading ? "أدخل الدرجة" : ""}
              onChange={(e) => onGrade?.(q.id, { points: e.target.value })} />
          </label>
          <label className="block">
            <span className="block mb-1 text-[11px] font-medium text-slate-600">ملاحظة للطالب (اختياري)</span>
            <textarea dir="auto" className={cx(textareaClass, "min-h-9")} maxLength={3000}
              value={grade?.feedback ?? q.feedback ?? ""}
              onChange={(e) => onGrade?.(q.id, { feedback: e.target.value })} />
          </label>
        </div>
      ) : null}
    </article>
  );
}
