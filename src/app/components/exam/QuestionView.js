"use client";

import { FiFlag } from "react-icons/fi";
import { cx, inputClass, textareaClass } from "../ui";
import { ExamImage, PlainText, bareInput } from "./ExamBits";
import { fmtPoints } from "./examModel";

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

/** Splits a stored multiple-choice answer ("id1,id2") into ids. */
export const pickedIds = (value) => (value ? String(value).split(",").map((s) => s.trim()).filter(Boolean) : []);

/** True when the student gave some answer. */
export const isAnswered = (value) => value != null && String(value).trim() !== "";

/**
 * One question as the student sees it. value: the stored answer string; onChange(next).
 * The answer key never reaches this component.
 */
export default function QuestionView({ q, number, total, value, onChange, flagged, onToggleFlag, disabled, onPaste }) {
  const type = q.questionType;
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5" aria-label={`السؤال ${number}`}>
      <header className="flex items-start gap-3 mb-3">
        <span className="shrink-0 min-w-9 h-9 px-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-bold flex items-center justify-center">
          {Number(number).toLocaleString("ar-EG")}
        </span>
        <div className="flex-1 min-w-0 pt-1.5 text-xs text-slate-400">
          {total ? <>سؤال {Number(number).toLocaleString("ar-EG")} من {Number(total).toLocaleString("ar-EG")} · </> : null}
          {fmtPoints(q.points)} {Number(q.points) === 1 ? "درجة" : "درجات"}
          {type === "MULTIPLE_CHOICE" ? " · اختر كل الإجابات الصحيحة" : ""}
        </div>
        {onToggleFlag ? (
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={!!flagged}
            className={cx(
              "shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
              flagged ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            <FiFlag className="w-3.5 h-3.5" /> {flagged ? "معلّم للمراجعة" : "مراجعة لاحقاً"}
          </button>
        ) : null}
      </header>

      <PlainText text={q.questionText} className="text-[15px] sm:text-base text-slate-900 font-medium mb-3" />
      {q.imageId ? <ExamImage id={q.imageId} className="mb-4" /> : null}

      {type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE" ? (
        <Options q={q} value={value} onChange={onChange} disabled={disabled} />
      ) : type === "NUMERIC" ? (
        <input
          inputMode="decimal"
          dir="ltr"
          aria-label="إجابتك"
          className={cx(bareInput, "w-full h-11 text-base max-w-xs text-left")}
          placeholder="اكتب رقماً"
          value={value || ""}
          disabled={disabled}
          maxLength={40}
          onPaste={onPaste}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : type === "SHORT_ANSWER" ? (
        <input
          dir="auto"
          aria-label="إجابتك"
          className={cx(inputClass, "h-11 text-base")}
          placeholder="اكتب إجابتك"
          value={value || ""}
          disabled={disabled}
          maxLength={500}
          onPaste={onPaste}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div>
          <textarea
            dir="auto"
            aria-label="إجابتك"
            className={cx(textareaClass, "min-h-40 text-base leading-relaxed")}
            placeholder="اكتب إجابتك هنا..."
            value={value || ""}
            disabled={disabled}
            maxLength={10000}
            onPaste={onPaste}
            onChange={(e) => onChange(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-slate-400 text-left">{(value || "").length.toLocaleString("ar-EG")} / ١٠٬٠٠٠</p>
        </div>
      )}
    </section>
  );
}

function Options({ q, value, onChange, disabled }) {
  const multiple = q.questionType === "MULTIPLE_CHOICE";
  const picked = pickedIds(value);
  const toggle = (id) => {
    if (disabled) return;
    if (!multiple) onChange(picked[0] === id ? "" : id);
    else onChange((picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]).join(","));
  };
  const tf = q.questionType === "TRUE_FALSE";
  return (
    <div className={cx(tf ? "grid grid-cols-2 gap-2 max-w-md" : "space-y-2")} role={multiple ? "group" : "radiogroup"}>
      {(q.answers || []).map((a, i) => {
        const on = picked.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            disabled={disabled}
            onClick={() => toggle(a.id)}
            className={cx(
              "w-full flex items-center gap-3 text-right rounded-xl border px-3 py-3 transition-colors cursor-pointer disabled:cursor-default",
              on ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/15" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            {!tf ? (
              <span
                className={cx(
                  "shrink-0 w-7 h-7 flex items-center justify-center text-xs font-bold border transition-colors",
                  multiple ? "rounded-md" : "rounded-full",
                  on ? "bg-brand-600 border-brand-600 text-white" : "border-slate-300 text-slate-500"
                )}
              >
                {on && multiple ? "✓" : LETTERS[i] || i + 1}
              </span>
            ) : null}
            <span dir="auto" className={cx("flex-1 text-[15px] text-slate-800 whitespace-pre-wrap break-words", tf && "text-center font-medium")}>
              {a.answerText}
            </span>
          </button>
        );
      })}
    </div>
  );
}
