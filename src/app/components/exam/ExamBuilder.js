"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FiX, FiDatabase, FiUpload, FiEye, FiAlertTriangle, FiBookmark, FiRotateCcw,
} from "react-icons/fi";
import {
  Badge, Button, Card, ConfirmDialog, Field, IconButton, Tabs, cx, inputClass, textareaClass,
} from "../ui";
import { bankApi, examApi, apiError } from "./examApi";
import { FullScreen, Toggle, bareInput } from "./ExamBits";
import QuestionEditor from "./QuestionEditor";
import QuestionView from "./QuestionView";
import BankPicker from "./BankPicker";
import CsvImportDialog from "./CsvImportDialog";
import {
  QUESTION_TYPES, RESULTS_POLICIES, blankExam, blankQuestion, fromServer, key, toBankItem, toRequest,
  totalPoints, typeOf, validate, fmtPoints,
} from "./examModel";

const draftKey = (examId) => `exam-draft:${examId || "new"}`;

const bankAddedMessage = (added, sent) => {
  const n = (v) => v.toLocaleString("ar-EG");
  if (!added) return "كل الأسئلة موجودة في البنك بالفعل";
  if (added < sent) return `تمت إضافة ${n(added)} سؤال، و${n(sent - added)} موجود بالفعل`;
  return added > 1 ? `تم حفظ ${n(added)} سؤال في البنك` : "تم حفظ السؤال في البنك";
};

/**
 * Full-screen exam editor: questions (all six types, images, explanations, bank, CSV), settings
 * (schedule, attempts, pools, scoring, display, results policy) and a student preview.
 * lessons: [{ id, name, courseName }] for a new exam. onSaved(serverExam) after each save.
 */
export default function ExamBuilder({ examId, lessons = [], defaultLessonId = "", bankOwnerId, onClose, onSaved }) {
  const [exam, setExam] = useState(null);
  const [tab, setTab] = useState("questions");
  const [errors, setErrors] = useState({ exam: null, questions: {} });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [restore, setRestore] = useState(null);
  const [currentId, setCurrentId] = useState(examId || null);
  const listEnd = useRef(null);

  // Load (or start a new exam), then offer an unsaved local copy if there is one
  useEffect(() => {
    let alive = true;
    const offerRestore = (base) => {
      try {
        const raw = localStorage.getItem(draftKey(examId));
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved?.exam && saved.savedAt) setRestore({ ...saved, base });
      } catch {
        // storage unavailable: nothing to restore
      }
    };
    if (examId) {
      examApi.manage(examId)
        .then(({ data }) => {
          if (!alive) return;
          const loaded = fromServer(data);
          setExam(loaded);
          offerRestore(loaded);
        })
        .catch((e) => {
          toast.error(apiError(e, "تعذر تحميل الامتحان"));
          onClose?.();
        });
    } else {
      const fresh = blankExam(defaultLessonId || "");
      setExam(fresh);
      offerRestore(fresh);
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Local backup while editing, so a crash or closed tab does not lose work
  useEffect(() => {
    if (!dirty || !exam) return undefined;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(examId), JSON.stringify({ savedAt: Date.now(), exam }));
      } catch {
        // full or blocked storage: skip the backup
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [exam, dirty, examId]);

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined;
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const update = useCallback((patch) => {
    setExam((e) => ({ ...e, ...(typeof patch === "function" ? patch(e) : patch) }));
    setDirty(true);
  }, []);

  const setQuestions = useCallback((fn) => update((e) => ({ questions: fn(e.questions) })), [update]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey(examId));
    } catch {
      // ignore
    }
  };

  const addQuestions = (qs) => {
    // A new exam starts with one empty question: replace it instead of keeping a blank one
    setQuestions((list) => (list.length === 1 && !list[0].questionText.trim() && !list[0].id ? qs : [...list, ...qs]));
    setTimeout(() => listEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  };

  const save = async (status) => {
    const result = validate(exam, { requireLesson: !currentId });
    setErrors(result);
    if (result.exam) {
      toast.error(result.exam);
      if (Object.keys(result.questions).length || exam.questions.length === 0) {
        setTab("questions");
        const first = exam.questions.find((q) => result.questions[q.key]);
        if (first) setTimeout(() => document.getElementById(`q-${first.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      } else if (exam.title.trim()) {
        setTab("settings"); // lesson, scores, dates or pool size
      }
      return;
    }
    setSaving(true);
    try {
      const body = toRequest(exam, status);
      const { data } = currentId ? await examApi.update(currentId, body) : await examApi.create(exam.lessonId, body);
      const next = fromServer({ ...data, lessonId: data.lessonId || exam.lessonId });
      setExam(next);
      setCurrentId(data.id);
      setDirty(false);
      clearDraft();
      toast.success(status === "PUBLISHED" ? "تم نشر الامتحان" : status === "DRAFT" ? "تم الحفظ كمسودة" : "تم حفظ التغييرات");
      onSaved?.(data);
    } catch (e) {
      const message = apiError(e, "فشل حفظ الامتحان");
      toast.error(message);
      const n = /السؤال (\d+)/.exec(message);
      if (n) {
        const q = exam.questions[Number(n[1]) - 1];
        if (q) {
          setErrors((er) => ({ ...er, questions: { ...er.questions, [q.key]: message } }));
          setTab("questions");
          setTimeout(() => document.getElementById(`q-${q.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => (dirty ? setConfirmClose(true) : onClose?.());

  const saveToBank = async (questions) => {
    try {
      const { data } = await bankApi.create(questions.map((q) => toBankItem(q)), ownerId);
      toast.success(bankAddedMessage(Array.isArray(data) ? data.length : questions.length, questions.length));
    } catch (e) {
      toast.error(apiError(e, "تعذر الحفظ في البنك"));
    }
  };

  // Whose question bank: given, or the teacher of the exam's lesson (admins editing a teacher's exam)
  const ownerId = bankOwnerId || lessons.find((l) => l.id === exam?.lessonId)?.instructorId || undefined;

  const lessonOptions = useMemo(
    () => lessons.map((l) => ({ value: l.id, label: l.courseName ? `${l.courseName} — ${l.name}` : l.name })),
    [lessons]
  );

  if (!exam) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  const published = exam.status === "PUBLISHED";
  const questionCount = exam.questions.length;
  const errorCount = Object.keys(errors.questions).length;

  return (
    <Shell>
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2">
          <IconButton label="إغلاق" icon={FiX} onClick={requestClose} />
          <input
            aria-label="عنوان الامتحان"
            className="flex-1 min-w-40 h-9 px-2 rounded-lg text-base font-semibold text-slate-900 border border-transparent hover:border-slate-200 focus:border-brand-600 focus:outline-none"
            placeholder="عنوان الامتحان"
            value={exam.title}
            maxLength={500}
            onChange={(e) => update({ title: e.target.value })}
          />
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {published ? <Badge tone="success">منشور</Badge> : <Badge>مسودة</Badge>}
            <span>{questionCount.toLocaleString("ar-EG")} سؤال · {fmtPoints(totalPoints(exam.questions))} درجة</span>
            {dirty ? <span className="text-amber-600">· غير محفوظ</span> : null}
          </div>
          <div className="flex items-center gap-2 mr-auto">
            {published ? (
              <>
                <Button variant="secondary" loading={saving} onClick={() => save("DRAFT")}>إخفاء (مسودة)</Button>
                <Button loading={saving} onClick={() => save("PUBLISHED")}>حفظ التغييرات</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" loading={saving} onClick={() => save("DRAFT")}>حفظ كمسودة</Button>
                <Button loading={saving} onClick={() => save("PUBLISHED")}>نشر الامتحان</Button>
              </>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 -mb-4">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "questions", label: "الأسئلة", count: errorCount || undefined },
              { id: "settings", label: "الإعدادات" },
              { id: "preview", label: "معاينة كطالب" },
            ]}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 space-y-3">
          {restore ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <FiRotateCcw className="w-4 h-4" />
              <span className="flex-1">توجد نسخة لم تُحفظ من {new Date(restore.savedAt).toLocaleString("ar-EG")}.</span>
              <Button size="sm" onClick={() => { setExam({ ...restore.exam, id: restore.base.id }); setDirty(true); setRestore(null); }}>استرجاعها</Button>
              <Button size="sm" variant="secondary" onClick={() => { clearDraft(); setRestore(null); }}>تجاهل</Button>
            </div>
          ) : null}
          {exam.submissionCount > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <FiAlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-px" />
              <span>
                لهذا الامتحان {exam.submissionCount.toLocaleString("ar-EG")} محاولة. الأسئلة التي تحذفها تبقى في أوراق الطلاب السابقة،
                وتغيير الإجابة الصحيحة لا يغيّر الدرجات السابقة إلا عند الضغط على &quot;إعادة التصحيح&quot; في صفحة النتائج.
              </span>
            </div>
          ) : null}
          {errors.exam && tab !== "questions" ? <p className="text-sm text-red-600">{errors.exam}</p> : null}

          {tab === "questions" ? (
            <QuestionsTab
              exam={exam}
              errors={errors}
              setQuestions={setQuestions}
              addQuestions={addQuestions}
              onBank={() => setBankOpen(true)}
              onCsv={() => setCsvOpen(true)}
              onSaveToBank={saveToBank}
              listEnd={listEnd}
            />
          ) : tab === "settings" ? (
            <SettingsTab exam={exam} update={update} isNew={!currentId} lessonOptions={lessonOptions} />
          ) : (
            <PreviewTab exam={exam} />
          )}
        </div>
      </main>

      <BankPicker open={bankOpen} ownerId={ownerId} onClose={() => setBankOpen(false)}
        onAdd={(qs) => { addQuestions(qs); setBankOpen(false); toast.success(`تمت إضافة ${qs.length.toLocaleString("ar-EG")} سؤال`); }} />
      <CsvImportDialog open={csvOpen} onClose={() => setCsvOpen(false)}
        onAdd={(qs) => { addQuestions(qs); toast.success(`تم استيراد ${qs.length.toLocaleString("ar-EG")} سؤال`); }} />
      <ConfirmDialog
        open={confirmClose}
        title="إغلاق بدون حفظ؟"
        message="لديك تغييرات لم تُحفظ. ستبقى نسخة منها على هذا الجهاز ويمكنك استرجاعها عند فتح الامتحان مرة أخرى."
        confirmLabel="إغلاق"
        danger
        onConfirm={() => { setConfirmClose(false); onClose?.(); }}
        onClose={() => setConfirmClose(false)}
      />
    </Shell>
  );
}

function Shell({ children }) {
  return <FullScreen label="محرر الامتحان">{children}</FullScreen>;
}

// ------------------------------------------------------------------ questions

function QuestionsTab({ exam, errors, setQuestions, addQuestions, onBank, onCsv, onSaveToBank, listEnd }) {
  const move = (i, d) =>
    setQuestions((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const duplicate = (i) =>
    setQuestions((list) => {
      const q = list[i];
      const copy = { ...q, key: key(), id: undefined, questionText: `${q.questionText} (نسخة)`,
        answers: q.answers.map((a) => ({ ...a, key: key(), id: undefined })) };
      return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
    });
  const remove = (i) => setQuestions((list) => list.filter((_, j) => j !== i));
  const change = (i, next) => setQuestions((list) => list.map((q, j) => (j === i ? next : q)));

  return (
    <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)] items-start">
      {/* Navigator */}
      <nav className="hidden lg:block sticky top-0 bg-white rounded-xl border border-slate-200 p-2 max-h-[calc(100vh-180px)] overflow-y-auto" aria-label="الأسئلة">
        <p className="px-1.5 pb-1.5 text-[11px] text-slate-400">انتقل إلى سؤال</p>
        <div className="grid grid-cols-5 gap-1">
          {exam.questions.map((q, i) => {
            const Icon = typeOf(q.questionType).icon;
            return (
              <button
                key={q.key}
                type="button"
                title={`${i + 1}. ${typeOf(q.questionType).label}`}
                onClick={() => document.getElementById(`q-${q.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className={cx(
                  "relative h-8 rounded-md text-xs font-medium border transition-colors cursor-pointer",
                  errors.questions[q.key] ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                )}
              >
                {(i + 1).toLocaleString("ar-EG")}
                <Icon className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 opacity-50" />
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-3 min-w-0">
        {errors.exam ? <p className="text-sm text-red-600">{errors.exam}</p> : null}
        {exam.questions.map((q, i) => (
          <div id={`q-${q.key}`} key={q.key}>
            <QuestionEditor
              value={q}
              number={i + 1}
              error={errors.questions[q.key]}
              onChange={(next) => change(i, next)}
              onMoveUp={i > 0 ? () => move(i, -1) : undefined}
              onMoveDown={i < exam.questions.length - 1 ? () => move(i, 1) : undefined}
              onDuplicate={() => duplicate(i)}
              onRemove={exam.questions.length > 1 ? () => remove(i) : undefined}
              onSaveToBank={() => onSaveToBank([q])}
            />
          </div>
        ))}
        <div ref={listEnd} />

        {/* Add bar */}
        <Card>
          <p className="text-xs text-slate-500 mb-2">إضافة سؤال</p>
          <div className="flex flex-wrap gap-1.5">
            {QUESTION_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <Button key={t.id} variant="secondary" size="sm" onClick={() => addQuestions([blankQuestion(t.id)])}>
                  <Icon /> {t.label}
                </Button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={onBank}><FiDatabase /> من بنك الأسئلة</Button>
            <Button variant="ghost" size="sm" onClick={onCsv}><FiUpload /> استيراد من Excel / CSV</Button>
            <Button variant="ghost" size="sm" onClick={() => onSaveToBank(exam.questions.filter((q) => q.questionText.trim()))}>
              <FiBookmark /> حفظ كل الأسئلة في البنك
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ settings

function SettingsTab({ exam, update, isNew, lessonOptions }) {
  const num = (k) => (e) => update({ [k]: e.target.value });
  return (
    <div className="grid gap-3 lg:grid-cols-2 items-start">
      <Card title="الأساسيات">
        <div className="space-y-3">
          {isNew ? (
            <Field label="الدرس">
              <select className={cx(inputClass, "cursor-pointer")} value={exam.lessonId} onChange={(e) => update({ lessonId: e.target.value })}>
                <option value="">اختر الدرس</option>
                {lessonOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          ) : null}
          <Field label="تعليمات للطالب (تظهر قبل البدء)">
            <textarea dir="auto" className={textareaClass} maxLength={5000} value={exam.instructions}
              placeholder="مثال: الامتحان 20 سؤالاً، اقرأ كل سؤال جيداً، الآلة الحاسبة مسموحة."
              onChange={(e) => update({ instructions: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="درجة النجاح %">
              <input type="number" min="0" max="100" className={inputClass} value={exam.passingScore} onChange={num("passingScore")} />
            </Field>
            <Field label="المدة (دقيقة)">
              <input type="number" min="1" max="600" className={inputClass} value={exam.timeLimitMinutes} onChange={num("timeLimitMinutes")} />
            </Field>
            <Field label="عدد المحاولات">
              <input type="number" min="1" max="20" className={inputClass} value={exam.maxAttempts} onChange={num("maxAttempts")} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="المواعيد">
        <div className="space-y-3">
          <p className="text-xs text-slate-500">اتركها فارغة ليكون الامتحان متاحاً دائماً. عند تحديد موعد النهاية، تنتهي كل محاولة عنده حتى لو بدأت متأخرة.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="يبدأ في">
              <input type="datetime-local" className={inputClass} value={exam.availableFrom} onChange={(e) => update({ availableFrom: e.target.value })} />
            </Field>
            <Field label="ينتهي في">
              <input type="datetime-local" className={inputClass} value={exam.availableUntil} onChange={(e) => update({ availableUntil: e.target.value })} />
            </Field>
          </div>
          {exam.availableFrom || exam.availableUntil ? (
            <Button variant="ghost" size="sm" onClick={() => update({ availableFrom: "", availableUntil: "" })}>إزالة المواعيد</Button>
          ) : null}
        </div>
      </Card>

      <Card title="الأسئلة والترتيب">
        <Toggle label="ترتيب عشوائي للأسئلة والاختيارات" hint="كل طالب يرى ترتيباً مختلفاً، فيصعب الغش من زميله"
          checked={exam.shuffleQuestions} onChange={(v) => update({ shuffleQuestions: v })} />
        <div className="py-2">
          <Field label="عدد الأسئلة في كل محاولة (اختياري)"
            hint={`يُسحب عشوائياً من ${exam.questions.length.toLocaleString("ar-EG")} سؤال، فتختلف الأسئلة بين الطلاب والمحاولات. اتركه فارغاً لكل الأسئلة. اجعل الأسئلة متقاربة الدرجة حتى تكون المحاولات عادلة.`}>
            <input type="number" min="1" max={exam.questions.length} className={cx(bareInput, "w-32 h-9")} placeholder="الكل"
              value={exam.questionPoolSize} onChange={num("questionPoolSize")} />
          </Field>
        </div>
      </Card>

      <Card title="طريقة العرض">
        <Toggle label="سؤال واحد في كل صفحة" hint="مناسب للهاتف ويقلل التشتت"
          checked={exam.oneQuestionPerPage} onChange={(v) => update({ oneQuestionPerPage: v, allowBackNavigation: v ? exam.allowBackNavigation : true })} />
        <Toggle label="السماح بالرجوع للأسئلة السابقة" hint="عند الإيقاف يجيب الطالب بالترتيب ولا يعود لسؤال تجاوزه"
          disabled={!exam.oneQuestionPerPage}
          checked={exam.allowBackNavigation} onChange={(v) => update({ allowBackNavigation: v })} />
      </Card>

      <Card title="التصحيح">
        <Toggle label="درجات جزئية لأسئلة الاختيارات المتعددة" hint="كل إجابة صحيحة تأخذ جزءاً من الدرجة، والإجابة الخاطئة تلغي جزءاً"
          checked={exam.partialCredit} onChange={(v) => update({ partialCredit: v })} />
        <div className="py-2">
          <Field label="خصم للإجابة الخاطئة (% من درجة السؤال)" hint="0 = بدون خصم. السؤال المتروك لا يُخصم منه. مجموع الامتحان لا يقل عن صفر.">
            <input type="number" min="0" max="100" step="5" className={cx(bareInput, "w-32 h-9")} value={exam.negativeMarkingPercent}
              onChange={num("negativeMarkingPercent")} />
          </Field>
        </div>
      </Card>

      <Card title="متى يرى الطالب الإجابات الصحيحة؟">
        <div className="space-y-1.5" role="radiogroup">
          {RESULTS_POLICIES.map((p) => (
            <label key={p.value}
              className={cx("flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors",
                exam.resultsPolicy === p.value ? "border-brand-600 bg-brand-50/60" : "border-slate-200 hover:bg-slate-50")}>
              <input type="radio" name="resultsPolicy" className="mt-1 accent-brand-600" checked={exam.resultsPolicy === p.value}
                onChange={() => update({ resultsPolicy: p.value })} />
              <span>
                <span className="block text-sm text-slate-800">{p.label}</span>
                <span className="block text-[11px] text-slate-500">{p.hint}</span>
              </span>
            </label>
          ))}
          {exam.resultsPolicy === "AFTER_CLOSE" && !exam.availableUntil ? (
            <p className="text-[11px] text-amber-700">بدون موعد نهاية، تظهر الإجابات بعد النجاح أو آخر محاولة.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ preview

function PreviewTab({ exam }) {
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const questions = exam.questions.filter((q) => q.questionText.trim());
  // The student view: options carry ids but no answer key
  const asStudent = questions.map((q) => ({
    id: q.key,
    questionType: q.questionType,
    questionText: q.questionText,
    points: q.points,
    imageId: q.imageId,
    answers: q.questionType === "SINGLE_CHOICE" || q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE"
      ? q.answers.filter((a) => a.answerText.trim()).map((a) => ({ id: a.key, answerText: a.answerText }))
      : [],
  }));
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <FiEye className="w-4 h-4" /> هكذا يرى الطالب الامتحان. الإجابات هنا للتجربة فقط ولا تُحفظ.
      </div>
      {exam.instructions ? (
        <Card title="التعليمات"><p dir="auto" className="whitespace-pre-wrap text-sm text-slate-700">{exam.instructions}</p></Card>
      ) : null}
      {asStudent.length === 0 ? (
        <Card><p className="text-sm text-slate-500">أضف أسئلة لتظهر هنا.</p></Card>
      ) : (
        asStudent.map((q, i) => (
          <QuestionView key={q.id} q={q} number={i + 1} total={asStudent.length} value={answers[q.id]}
            onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
            flagged={flags[q.id]} onToggleFlag={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))} />
        ))
      )}
    </div>
  );
}

