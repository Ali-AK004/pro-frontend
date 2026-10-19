"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FiArrowUp, FiArrowDown, FiCopy, FiTrash2, FiImage, FiX, FiPlus, FiBookmark, FiInfo,
} from "react-icons/fi";
import { Button, IconButton, cx, inputClass, textareaClass } from "../ui";
import { examApi, apiError } from "./examApi";
import { ExamImage, bareInput } from "./ExamBits";
import { QUESTION_TYPES, isChoice, key, withTypeDefaults } from "./examModel";

const MAX_OPTIONS = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Editor for one question of any type. `value` is the editor question, `onChange(next)` replaces it.
 * Toolbar actions are optional (the question bank uses the editor without move/duplicate).
 */
export default function QuestionEditor({
  value: q, number, error, onChange, onMoveUp, onMoveDown, onDuplicate, onRemove, onSaveToBank, locked,
}) {
  const [showExplanation, setShowExplanation] = useState(Boolean(q.explanation));
  const set = (patch) => onChange({ ...q, ...patch });
  const setAnswer = (k, patch) => set({ answers: q.answers.map((a) => (a.key === k ? { ...a, ...patch } : a)) });
  const markCorrect = (k) => {
    if (q.questionType === "MULTIPLE_CHOICE") setAnswer(k, { correct: !q.answers.find((a) => a.key === k)?.correct });
    else set({ answers: q.answers.map((a) => ({ ...a, correct: a.key === k })) });
  };
  const addAnswer = (correct = false) =>
    q.answers.length < MAX_OPTIONS && set({ answers: [...q.answers, { key: key(), answerText: "", correct }] });
  const removeAnswer = (k) => set({ answers: q.answers.filter((a) => a.key !== k) });

  return (
    <article
      className={cx(
        "bg-white rounded-xl border transition-colors",
        error ? "border-red-300 ring-4 ring-red-50" : "border-slate-200 focus-within:border-brand-600/40"
      )}
    >
      <header className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-100">
        {number != null ? (
          <span className="w-7 h-7 shrink-0 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
            {Number(number).toLocaleString("ar-EG")}
          </span>
        ) : null}
        <select
          aria-label="نوع السؤال"
          className={cx(bareInput, "w-auto h-8 text-xs pl-7 cursor-pointer")}
          value={q.questionType}
          disabled={locked}
          onChange={(e) => onChange(withTypeDefaults(q, e.target.value))}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          الدرجة
          <input
            type="number"
            min="0.25"
            step="0.25"
            className={cx(bareInput, "w-20 h-8 text-xs")}
            value={q.points}
            onChange={(e) => set({ points: e.target.value })}
          />
        </label>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          {onMoveUp ? <IconButton label="تحريك لأعلى" icon={FiArrowUp} onClick={onMoveUp} /> : null}
          {onMoveDown ? <IconButton label="تحريك لأسفل" icon={FiArrowDown} onClick={onMoveDown} /> : null}
          {onDuplicate ? <IconButton label="تكرار السؤال" icon={FiCopy} onClick={onDuplicate} /> : null}
          {onSaveToBank ? <IconButton label="حفظ في بنك الأسئلة" icon={FiBookmark} onClick={onSaveToBank} /> : null}
          {onRemove ? <IconButton label="حذف السؤال" icon={FiTrash2} tone="danger" onClick={onRemove} /> : null}
        </div>
      </header>

      <div className="p-3 space-y-3">
        <textarea
          dir="auto"
          aria-label="نص السؤال"
          className={cx(textareaClass, "min-h-16 text-[15px]")}
          placeholder="اكتب السؤال هنا..."
          value={q.questionText}
          maxLength={4000}
          onChange={(e) => set({ questionText: e.target.value })}
        />

        <ImageField imageId={q.imageId} onChange={(imageId) => set({ imageId })} />

        <AnswersEditor q={q} set={set} setAnswer={setAnswer} markCorrect={markCorrect} addAnswer={addAnswer}
          removeAnswer={removeAnswer} locked={locked} />

        {showExplanation ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-600">
                {q.questionType === "ESSAY" ? "دليل التصحيح (يراه الطالب بعد التصحيح)" : "شرح الإجابة (يظهر للطالب حسب إعداد عرض النتائج)"}
              </span>
              {!q.explanation ? (
                <button type="button" className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setShowExplanation(false)}>
                  إخفاء
                </button>
              ) : null}
            </div>
            <textarea
              dir="auto"
              className={cx(textareaClass, "min-h-14")}
              value={q.explanation}
              maxLength={4000}
              onChange={(e) => set({ explanation: e.target.value })}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setShowExplanation(true)}
            className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline cursor-pointer">
            <FiPlus className="w-3.5 h-3.5" /> {q.questionType === "ESSAY" ? "إضافة دليل تصحيح" : "إضافة شرح للإجابة"}
          </button>
        )}

        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </article>
  );
}

function AnswersEditor({ q, set, setAnswer, markCorrect, addAnswer, removeAnswer, locked }) {
  if (q.questionType === "ESSAY") {
    return (
      <p className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">
        <FiInfo className="w-4 h-4 shrink-0 mt-px" />
        يكتب الطالب إجابته، وتظهر لك في قائمة &quot;قيد التصحيح&quot; لتضع الدرجة والملاحظات.
      </p>
    );
  }

  if (q.questionType === "TRUE_FALSE") {
    return (
      <div className="flex gap-2">
        {q.answers.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => markCorrect(a.key)}
            className={cx(
              "flex-1 h-10 rounded-lg border text-sm font-medium transition-colors cursor-pointer",
              a.correct ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {a.answerText} {a.correct ? "✓" : ""}
          </button>
        ))}
      </div>
    );
  }

  if (q.questionType === "SHORT_ANSWER") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">الإجابات المقبولة (أي واحدة منها تعتبر صحيحة). التصحيح يتجاهل الهمزات والتشكيل وحالة الحروف والمسافات الزائدة.</p>
        {q.answers.map((a, i) => (
          <div key={a.key} className="flex items-center gap-2">
            <input dir="auto" className={inputClass} placeholder={i === 0 ? "الإجابة الصحيحة" : "صيغة أخرى مقبولة"}
              value={a.answerText} maxLength={2000} onChange={(e) => setAnswer(a.key, { answerText: e.target.value, correct: true })} />
            {q.answers.length > 1 ? <IconButton label="حذف" icon={FiX} tone="danger" onClick={() => removeAnswer(a.key)} /> : null}
          </div>
        ))}
        {q.answers.length < MAX_OPTIONS ? (
          <Button variant="ghost" size="sm" onClick={() => addAnswer(true)}><FiPlus /> صيغة أخرى</Button>
        ) : null}
      </div>
    );
  }

  if (q.questionType === "NUMERIC") {
    const a = q.answers[0] || { key: "n", answerText: "" };
    return (
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block mb-1 text-xs font-medium text-slate-600">الإجابة الصحيحة</span>
          <input inputMode="decimal" className={inputClass} placeholder="مثال: 9.8" value={a.answerText}
            onChange={(e) => set({ answers: [{ ...a, answerText: e.target.value, correct: true }] })} />
        </label>
        <label className="block">
          <span className="block mb-1 text-xs font-medium text-slate-600">هامش الخطأ المسموح (±)</span>
          <input inputMode="decimal" className={inputClass} placeholder="0" value={q.numericTolerance}
            onChange={(e) => set({ numericTolerance: e.target.value })} />
        </label>
      </div>
    );
  }

  const multiple = q.questionType === "MULTIPLE_CHOICE";
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">{multiple ? "حدد كل الإجابات الصحيحة" : "حدد الإجابة الصحيحة"}</p>
      {q.answers.map((a, i) => (
        <div key={a.key} className="flex items-center gap-2">
          <button
            type="button"
            aria-label={a.correct ? "إجابة صحيحة" : "تحديد كإجابة صحيحة"}
            onClick={() => markCorrect(a.key)}
            className={cx(
              "shrink-0 w-6 h-6 border-2 flex items-center justify-center transition-colors cursor-pointer",
              multiple ? "rounded-md" : "rounded-full",
              a.correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"
            )}
          >
            {a.correct ? <span className="text-xs leading-none">✓</span> : null}
          </button>
          <input
            dir="auto"
            className={cx(inputClass, a.correct && "border-emerald-300 bg-emerald-50/40")}
            placeholder={`الاختيار ${i + 1}`}
            value={a.answerText}
            maxLength={2000}
            onChange={(e) => setAnswer(a.key, { answerText: e.target.value })}
          />
          {q.answers.length > 2 && !locked ? (
            <IconButton label="حذف الاختيار" icon={FiX} tone="danger" onClick={() => removeAnswer(a.key)} />
          ) : null}
        </div>
      ))}
      {q.answers.length < MAX_OPTIONS ? (
        <Button variant="ghost" size="sm" onClick={() => addAnswer(false)}><FiPlus /> اختيار آخر</Button>
      ) : null}
    </div>
  );
}

function ImageField({ imageId, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|bmp)$/i.test(file.type)) {
      toast.error("استخدم صورة PNG أو JPG");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("حجم الصورة أكبر من 5 ميجابايت");
      return;
    }
    setBusy(true);
    try {
      const { data } = await examApi.uploadImage(file);
      onChange(data.id);
    } catch (e) {
      toast.error(apiError(e, "فشل رفع الصورة"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/gif,image/bmp" className="hidden"
        onChange={(e) => pick(e.target.files?.[0])} />
      {imageId ? (
        <div className="relative inline-block">
          <ExamImage id={imageId} className="max-h-48" />
          <div className="absolute top-1.5 left-1.5 flex gap-1">
            <button type="button" onClick={() => input.current?.click()}
              className="px-2 h-7 rounded-md bg-white/95 border border-slate-200 text-xs text-slate-600 hover:bg-white cursor-pointer">
              تغيير
            </button>
            <button type="button" aria-label="إزالة الصورة" onClick={() => onChange(null)}
              className="w-7 h-7 rounded-md bg-white/95 border border-slate-200 text-slate-500 hover:text-red-600 flex items-center justify-center cursor-pointer">
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" loading={busy} onClick={() => input.current?.click()}>
          <FiImage /> إضافة صورة
        </Button>
      )}
    </div>
  );
}
