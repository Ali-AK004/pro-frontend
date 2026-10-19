"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiImage, FiCheck, FiX, FiMinus, FiClock } from "react-icons/fi";
import { Badge, cx, inputClass } from "../ui";

/** The shared input look without its full width and height, for inputs that set their own size. */
export const bareInput = inputClass.replace("w-full h-9 ", "");
import { useExamImage } from "./examApi";
import { typeOf } from "./examModel";

/**
 * Full-screen layer rendered on <body>. A fixed element inside a card with blur, transform or
 * overflow would be trapped in that card, so the editor and the running exam live here instead.
 */
export function FullScreen({ label, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // the page behind does not scroll
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col" dir="rtl" role="dialog" aria-modal="true" aria-label={label}>
      {children}
    </div>,
    document.body
  );
}

/** Question image loaded through the API (auth cookie + refresh). */
export function ExamImage({ id, className, alt = "" }) {
  const { url, failed } = useExamImage(id);
  if (!id) return null;
  if (failed) {
    return (
      <div className={cx("flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-3", className)}>
        <FiImage className="w-4 h-4" /> تعذر تحميل الصورة
      </div>
    );
  }
  if (!url) return <div className={cx("bg-slate-100 rounded-lg animate-pulse h-40", className)} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={cx("max-h-80 w-auto max-w-full rounded-lg border border-slate-200 bg-white", className)} />
  );
}

export function TypeBadge({ type }) {
  const t = typeOf(type);
  const Icon = t.icon;
  return (
    <Badge tone="gray">
      <Icon className="w-3 h-3" /> {t.short}
    </Badge>
  );
}

/** On/off switch with a label and an optional hint. */
export function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label className={cx("flex items-start justify-between gap-3 py-2", disabled ? "opacity-50" : "cursor-pointer")}>
      <span className="min-w-0">
        <span className="block text-sm text-slate-700">{label}</span>
        {hint ? <span className="block text-[11px] text-slate-400 mt-0.5">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed",
          checked ? "bg-brand-600" : "bg-slate-300"
        )}
      >
        {/* RTL: off sits at the start (right), on at the end (left) */}
        <span className={cx("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", checked ? "right-[18px]" : "right-0.5")} />
      </button>
    </label>
  );
}

/** Exam status for lists: draft, scheduled, open, closed. */
export function ExamStatusBadge({ exam }) {
  if (exam.status === "DRAFT") return <Badge tone="gray">مسودة</Badge>;
  const now = Date.now();
  if (exam.availableFrom && new Date(exam.availableFrom).getTime() > now) {
    return <Badge tone="warning"><FiClock className="w-3 h-3" /> مجدول</Badge>;
  }
  if (exam.availableUntil && new Date(exam.availableUntil).getTime() <= now) return <Badge tone="gray">مغلق</Badge>;
  return <Badge tone="success">منشور</Badge>;
}

const OUTCOMES = {
  CORRECT: { label: "صحيحة", tone: "success", icon: FiCheck },
  PARTIAL: { label: "صحيحة جزئياً", tone: "warning", icon: FiMinus },
  WRONG: { label: "خاطئة", tone: "danger", icon: FiX },
  BLANK: { label: "بدون إجابة", tone: "gray", icon: FiMinus },
  PENDING: { label: "في انتظار التصحيح", tone: "warning", icon: FiClock },
};

export function OutcomeBadge({ outcome }) {
  const o = OUTCOMES[outcome] || OUTCOMES.BLANK;
  const Icon = o.icon;
  return (
    <Badge tone={o.tone}>
      <Icon className="w-3 h-3" /> {o.label}
    </Badge>
  );
}

export function SubmissionStatusBadge({ row }) {
  if (row.status === "PENDING_REVIEW") return <Badge tone="warning">قيد التصحيح</Badge>;
  return row.passed ? <Badge tone="success">ناجح</Badge> : <Badge tone="danger">راسب</Badge>;
}

/** Text written by teachers or students: keeps line breaks, picks direction per paragraph. */
export function PlainText({ text, className }) {
  if (!text) return null;
  return (
    <div dir="auto" className={cx("whitespace-pre-wrap break-words leading-relaxed", className)}>
      {text}
    </div>
  );
}

/** Thin horizontal bar (0..100). */
export function Bar({ value, tone = "brand", className }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color = { brand: "bg-brand-600", success: "bg-emerald-500", warning: "bg-amber-500", danger: "bg-red-500", gray: "bg-slate-400" }[tone];
  return (
    <div className={cx("h-1.5 rounded-full bg-slate-100 overflow-hidden", className)}>
      <div className={cx("h-full rounded-full", color)} style={{ width: `${v}%` }} />
    </div>
  );
}
