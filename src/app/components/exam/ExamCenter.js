"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  FiArrowRight, FiEdit2, FiDownload, FiRefreshCw, FiCopy, FiTrash2, FiUsers, FiAward, FiTrendingUp,
  FiClock, FiAlertTriangle, FiCheckSquare, FiZap, FiUserPlus,
} from "react-icons/fi";
import {
  Badge, Button, Card, ConfirmDialog, DataTable, Dialog, EmptyState, Field, IconButton, PagedTable, SearchBox,
  Select, StatCard, Tabs, Toolbar, cx, fmtDateTime, inputClass, textareaClass, usePaged, useDebounced,
} from "../ui";
import { examApi, apiError, downloadBlob } from "./examApi";
import { Bar, ExamStatusBadge, PlainText, SubmissionStatusBadge, TypeBadge } from "./ExamBits";
import ExamResultView from "./ExamResultView";
import { fmtDuration, fmtPoints, fmtScore } from "./examModel";

const FILTERS = [
  { value: "PENDING", label: "تحتاج تصحيح" },
  { value: "PASSED", label: "ناجح" },
  { value: "FAILED", label: "راسب" },
  { value: "FLAGGED", label: "تنبيهات سلوك" },
];

/**
 * One exam for its teacher: overview, every submission (with grading), question analysis and
 * per-student exceptions. lessons: [{ id, name, courseName }] for "copy to another lesson".
 */
export default function ExamCenter({ examId, lessons = [], onBack, onEdit, onChanged, onOpenExam }) {
  const [exam, setExam] = useState(null);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  const load = useCallback(async () => {
    try {
      const [m, a] = await Promise.all([examApi.manage(examId), examApi.analytics(examId)]);
      setExam(m.data);
      setStats(a.data);
    } catch (e) {
      toast.error(apiError(e, "تعذر تحميل الامتحان"));
    }
  }, [examId]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = () => {
    load();
    setListVersion((v) => v + 1);
    onChanged?.();
  };

  const exportCsv = async () => {
    setBusy("export");
    try {
      downloadBlob(await examApi.exportCsv(examId), "exam-results.csv");
    } catch (e) {
      toast.error(apiError(e, "تعذر تصدير النتائج"));
    } finally {
      setBusy("");
    }
  };

  const regrade = async () => {
    setBusy("regrade");
    try {
      const { data } = await examApi.regrade(examId);
      toast.success(
        data.changed
          ? `تغيّرت درجات ${data.changed.toLocaleString("ar-EG")} من ${data.submissions.toLocaleString("ar-EG")} محاولة` +
              (data.newlyPassed ? `، ونجح ${data.newlyPassed.toLocaleString("ar-EG")} طالب جديد` : "")
          : "لم تتغير أي درجة"
      );
      refreshAll();
    } catch (e) {
      toast.error(apiError(e, "تعذرت إعادة التصحيح"));
    } finally {
      setBusy("");
      setConfirm(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await examApi.remove(examId);
      toast.success("تم حذف الامتحان");
      onChanged?.();
      onBack?.();
    } catch (e) {
      toast.error(apiError(e, "تعذر حذف الامتحان"));
      setBusy("");
      setConfirm(null);
    }
  };

  if (!exam || !stats) {
    return (
      <div className="space-y-3">
        <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <IconButton label="رجوع" icon={FiArrowRight} onClick={onBack} />
        <div className="flex-1 min-w-48">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">{exam.title}</h1>
            <ExamStatusBadge exam={exam} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {[exam.courseName, exam.lessonName].filter(Boolean).join(" · ")}
            {" · "}{Number(exam.questionCount || 0).toLocaleString("ar-EG")} سؤال · {exam.timeLimitMinutes?.toLocaleString("ar-EG")} دقيقة
            {" · "}النجاح {fmtScore(exam.passingScore)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => onEdit?.(examId)}><FiEdit2 /> تعديل</Button>
          <Button variant="secondary" loading={busy === "export"} onClick={exportCsv} disabled={!stats.submissions}><FiDownload /> تصدير Excel</Button>
          <Button variant="secondary" onClick={() => setConfirm("regrade")} disabled={!stats.submissions}><FiRefreshCw /> إعادة التصحيح</Button>
          <Button variant="secondary" onClick={() => setCopyOpen(true)}><FiCopy /> نسخ</Button>
          <IconButton label="حذف الامتحان" icon={FiTrash2} tone="danger" onClick={() => setConfirm("delete")} />
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "نظرة عامة" },
          { id: "submissions", label: "المحاولات", count: stats.pendingReview || undefined },
          { id: "questions", label: "تحليل الأسئلة" },
          { id: "exceptions", label: "استثناءات الطلاب" },
        ]}
      />

      {tab === "overview" ? (
        <Overview stats={stats} exam={exam} onPending={() => setTab("submissions")} />
      ) : tab === "submissions" ? (
        <Submissions examId={examId} version={listVersion} onGraded={() => { load(); onChanged?.(); }} />
      ) : tab === "questions" ? (
        <QuestionAnalysis stats={stats} />
      ) : (
        <Exceptions examId={examId} />
      )}

      <ConfirmDialog
        open={confirm === "regrade"}
        title="إعادة تصحيح كل المحاولات"
        message="تُصحَّح كل المحاولات السابقة بمفتاح الإجابة وقواعد التصحيح الحالية (مفيد بعد تصحيح إجابة خاطئة في سؤال). الدرجات التي وضعتها يدوياً لا تتغير، ولن يُسحب النجاح من طالب نجح بالفعل."
        confirmLabel="إعادة التصحيح"
        busy={busy === "regrade"}
        onConfirm={regrade}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="حذف الامتحان"
        message={stats.submissions
          ? `سيُحذف الامتحان ومعه ${stats.submissions.toLocaleString("ar-EG")} محاولة ودرجات الطلاب نهائياً. لإخفائه فقط افتحه للتعديل واحفظه كمسودة.`
          : "سيُحذف الامتحان وأسئلته نهائياً."}
        confirmLabel="حذف نهائي"
        danger
        busy={busy === "delete"}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
      <CopyDialog open={copyOpen} examId={examId} lessons={lessons} currentLessonId={exam.lessonId}
        onClose={() => setCopyOpen(false)}
        onCopied={(copy) => { setCopyOpen(false); onChanged?.(); onOpenExam?.(copy.id); }} />
    </div>
  );
}

// ------------------------------------------------------------------ overview

function Overview({ stats, exam, onPending }) {
  const histogram = stats.histogram || [];
  const peak = Math.max(1, ...histogram);
  const passBin = Math.min(9, Math.floor((Number(exam.passingScore) || 0) / 10));
  if (!stats.submissions) {
    return (
      <Card>
        <EmptyState title="لا توجد محاولات بعد" hint={exam.status === "DRAFT" ? "الامتحان مسودة: انشره ليظهر للطلاب" : "ستظهر الإحصائيات بعد أول تسليم"} />
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {stats.pendingReview ? (
        <button type="button" onClick={onPending}
          className="w-full flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 text-right cursor-pointer hover:bg-amber-100/60">
          <FiCheckSquare className="w-4 h-4" />
          <span className="flex-1">{stats.pendingReview.toLocaleString("ar-EG")} محاولة تنتظر تصحيح الأسئلة المقالية</span>
          <span className="text-xs font-medium">ابدأ التصحيح ←</span>
        </button>
      ) : null}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FiUsers} label="المحاولات" value={stats.submissions.toLocaleString("ar-EG")} hint={`${stats.students.toLocaleString("ar-EG")} طالب`} />
        <StatCard icon={FiAward} tone="success" label="نسبة النجاح" value={fmtScore(stats.passRate)} hint={`${stats.passed.toLocaleString("ar-EG")} طالب ناجح`} />
        <StatCard icon={FiTrendingUp} label="متوسط الدرجات" value={fmtScore(stats.averageScore)}
          hint={stats.pendingReview ? `للمصححة فقط · الوسيط ${fmtScore(stats.medianScore)}` : `الوسيط ${fmtScore(stats.medianScore)}`} />
        <StatCard icon={FiClock} label="متوسط وقت الحل" value={fmtDuration(stats.averageTimeSeconds)} hint={`من ${exam.timeLimitMinutes?.toLocaleString("ar-EG")} دقيقة`} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="توزيع الدرجات" actions={stats.pendingReview ? <span className="text-[11px] text-slate-400">بدون المحاولات قيد التصحيح</span> : null}>
          <div className="flex items-end gap-1.5 h-44" role="img" aria-label="توزيع الدرجات" dir="ltr">
            {histogram.map((n, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[10px] text-slate-500">{n ? n.toLocaleString("ar-EG") : ""}</span>
                <div className={cx("w-full rounded-t", i >= passBin ? "bg-brand-600" : "bg-slate-300")}
                  style={{ height: `${(n / peak) * 100}%`, minHeight: n ? 3 : 0 }} title={`${i * 10}–${i * 10 + 10}%: ${n}`} />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-1 border-t border-slate-200 pt-1" dir="ltr">
            {histogram.map((_, i) => <span key={i} className="flex-1 text-center text-[10px] text-slate-400">{i * 10}</span>)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-600 align-middle ml-1" /> فوق درجة النجاح
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-300 align-middle mr-3 ml-1" /> تحتها
          </p>
        </Card>
        <Card title="ملخص">
          <dl className="space-y-2 text-sm">
            <Row label="أعلى درجة" value={fmtScore(stats.highestScore)} />
            <Row label="أقل درجة" value={fmtScore(stats.lowestScore)} />
            <Row label="تحتاج تصحيح" value={stats.pendingReview.toLocaleString("ar-EG")} tone={stats.pendingReview ? "text-amber-700" : ""} />
            <Row label="سُلّمت تلقائياً عند انتهاء الوقت" value={stats.autoSubmitted.toLocaleString("ar-EG")} />
            <Row label="بها تنبيهات سلوك متكررة" value={stats.flagged.toLocaleString("ar-EG")} tone={stats.flagged ? "text-amber-700" : ""} />
          </dl>
        </Card>
      </div>
      <HardestQuestions stats={stats} />
    </div>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={cx("font-semibold text-slate-900", tone)}>{value}</dd>
    </div>
  );
}

function HardestQuestions({ stats }) {
  const hardest = (stats.questions || [])
    .filter((q) => q.answered > 0 && q.correctRate != null && !q.archived)
    .sort((a, b) => Number(a.correctRate) - Number(b.correctRate))
    .slice(0, 5);
  if (!hardest.length) return null;
  return (
    <Card title="أصعب الأسئلة" padded={false}>
      <ul className="divide-y divide-slate-100">
        {hardest.map((q) => (
          <li key={q.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-xs font-bold text-slate-500 w-8">س{q.number.toLocaleString("ar-EG")}</span>
            <span dir="auto" className="flex-1 min-w-0 text-sm text-slate-700 truncate">{q.text}</span>
            <span className="w-28"><Bar value={q.correctRate} tone={Number(q.correctRate) < 40 ? "danger" : "warning"} /></span>
            <span className="w-12 text-xs text-slate-600 text-left">{fmtScore(q.correctRate)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ------------------------------------------------------------------ submissions

function Submissions({ examId, version, onGraded }) {
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const query = useDebounced(q.trim());
  const list = usePaged(
    (page, size) => examApi.submissions(examId, { filter: filter || undefined, q: query || undefined, page, size }),
    [examId, filter, query, version],
    { onError: (e) => toast.error(apiError(e, "تعذر تحميل المحاولات")) }
  );
  const ids = list.rows.map((r) => r.submissionId);
  const index = open ? ids.indexOf(open) : -1;

  const columns = [
    {
      key: "student", label: "الطالب",
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate max-w-56">{r.studentName}</p>
          <p className="text-[11px] text-slate-400 truncate max-w-56" dir="ltr">{r.studentEmail}</p>
        </div>
      ),
    },
    { key: "attempt", label: "المحاولة", render: (r) => r.attemptNumber.toLocaleString("ar-EG") },
    { key: "score", label: "الدرجة", render: (r) => <span className="font-semibold">{fmtScore(r.score)}</span> },
    { key: "status", label: "الحالة", render: (r) => <SubmissionStatusBadge row={r} /> },
    { key: "time", label: "الوقت", render: (r) => fmtDuration(r.timeSpentSeconds) },
    {
      key: "flags", label: "ملاحظات",
      render: (r) => (
        <div className="flex gap-1">
          {r.integrityEvents >= 3 ? <Badge tone="warning"><FiAlertTriangle className="w-3 h-3" /> {r.integrityEvents.toLocaleString("ar-EG")}</Badge>
            : r.integrityEvents ? <Badge>{r.integrityEvents.toLocaleString("ar-EG")} تنبيه</Badge> : null}
          {r.autoSubmitted ? <Badge><FiZap className="w-3 h-3" /> تلقائي</Badge> : null}
        </div>
      ),
    },
    { key: "submittedAt", label: "التسليم", render: (r) => <span className="text-xs text-slate-500">{fmtDateTime(r.submittedAt)}</span> },
  ];

  return (
    <>
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="ابحث باسم الطالب أو البريد" />
        <Select value={filter} onChange={setFilter} allLabel="كل المحاولات" options={FILTERS} />
      </Toolbar>
      <PagedTable list={list} columns={columns} rowKey="submissionId" onRowClick={(r) => setOpen(r.submissionId)}
        empty={filter === "PENDING" ? "لا توجد محاولات تنتظر التصحيح" : "لا توجد محاولات"} />
      <GradeDialog
        submissionId={open}
        onClose={() => setOpen(null)}
        onPrev={index > 0 ? () => setOpen(ids[index - 1]) : undefined}
        onNext={index >= 0 && index < ids.length - 1 ? () => setOpen(ids[index + 1]) : undefined}
        onGraded={() => { list.reload(); onGraded?.(); }}
      />
    </>
  );
}

function GradeDialog({ submissionId, onClose, onPrev, onNext, onGraded }) {
  const [review, setReview] = useState(null);
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!submissionId) return undefined;
    let alive = true;
    setReview(null);
    setGrades({});
    examApi.submission(submissionId)
      .then(({ data }) => {
        if (!alive) return;
        setReview(data);
        setFeedback(data.feedback || "");
      })
      .catch((e) => toast.error(apiError(e, "تعذر تحميل المحاولة")));
    return () => {
      alive = false;
    };
  }, [submissionId]);

  const dirty = Object.keys(grades).length > 0 || (review && feedback !== (review.feedback || ""));
  const pendingLeft = review ? review.questions.filter((q) => q.needsGrading && (grades[q.id]?.points ?? "") === "").length : 0;

  const save = async (andNext) => {
    const questions = {};
    for (const [id, g] of Object.entries(grades)) {
      const q = review.questions.find((x) => x.id === id);
      const raw = g.points;
      const entry = {};
      if (raw !== undefined && raw !== "") {
        const n = Number(String(raw).replace(",", "."));
        if (!Number.isFinite(n) || n < 0 || n > Number(q.points)) {
          toast.error(`السؤال ${q.number}: الدرجة يجب أن تكون بين 0 و ${fmtPoints(q.points)}`);
          return;
        }
        entry.points = n;
      }
      if (g.feedback !== undefined) entry.feedback = g.feedback;
      if (Object.keys(entry).length) questions[id] = entry;
    }
    setSaving(true);
    try {
      const { data } = await examApi.grade(submissionId, { questions, feedback });
      setReview(data);
      setGrades({});
      setFeedback(data.feedback || "");
      toast.success(data.status === "PENDING_REVIEW" ? "تم الحفظ، وما زالت أسئلة تحتاج تصحيح" : `تم التصحيح: ${fmtScore(data.score)}`);
      onGraded?.();
      if (andNext && onNext) onNext();
    } catch (e) {
      toast.error(apiError(e, "تعذر حفظ التصحيح"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(submissionId)}
      wide
      closeOnBackdrop={false}
      title={review ? `محاولة ${review.studentName}` : "المحاولة"}
      onClose={onClose}
      footer={
        review ? (
          <div className="flex flex-wrap items-center gap-2 w-full">
            <Button loading={saving} disabled={!dirty} onClick={() => save(false)}>حفظ التصحيح</Button>
            {onNext ? <Button variant="secondary" loading={saving} disabled={!dirty} onClick={() => save(true)}>حفظ والتالي</Button> : null}
            {pendingLeft ? <span className="text-xs text-amber-700">متبقي {pendingLeft.toLocaleString("ar-EG")} سؤال بدون درجة</span> : null}
            <span className="mr-auto flex gap-1">
              <Button variant="ghost" size="sm" disabled={!onPrev} onClick={onPrev}>السابق</Button>
              <Button variant="ghost" size="sm" disabled={!onNext} onClick={onNext}>التالي</Button>
            </span>
          </div>
        ) : null
      }
    >
      {!review ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          <ExamResultView review={review} staff editable compact grades={grades}
            onGrade={(id, patch) => setGrades((g) => ({ ...g, [id]: { ...g[id], ...patch } }))} />
          <Field label="ملاحظة عامة للطالب (اختياري)">
            <textarea dir="auto" className={textareaClass} maxLength={3000} value={feedback} onChange={(e) => setFeedback(e.target.value)}
              placeholder="تظهر للطالب مع نتيجته" />
          </Field>
        </div>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------ question analysis

function discriminationHint(d) {
  if (d == null) return null;
  const v = Number(d);
  if (v < 0) return { tone: "danger", label: "عكسي: راجع الإجابة الصحيحة" };
  if (v < 0.1) return { tone: "warning", label: "لا يميّز" };
  if (v < 0.3) return { tone: "gray", label: "مقبول" };
  return { tone: "success", label: "يميّز جيداً" };
}

function QuestionAnalysis({ stats }) {
  const [sort, setSort] = useState("number");
  const rows = useMemo(() => {
    const list = [...(stats.questions || [])];
    if (sort === "hardest") list.sort((a, b) => Number(a.correctRate ?? 101) - Number(b.correctRate ?? 101));
    if (sort === "weak") list.sort((a, b) => Number(a.discrimination ?? 2) - Number(b.discrimination ?? 2));
    return list;
  }, [stats, sort]);
  if (!rows.length || !stats.submissions) {
    return <Card><EmptyState title="لا توجد بيانات بعد" hint="يظهر التحليل بعد تسليم الطلاب" /></Card>;
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-52">
          <Select value={sort} onChange={setSort} allLabel="بالترتيب"
            options={[{ value: "hardest", label: "الأصعب أولاً" }, { value: "weak", label: "الأضعف تمييزاً أولاً" }]} />
        </div>
        <p className="text-[11px] text-slate-500 flex-1 min-w-60">
          <b>معامل التمييز</b> يقارن أعلى 27% من الطلاب بأقل 27%: السؤال الجيد يجيبه المتفوقون أكثر. القيمة العكسية غالباً تعني خطأ في مفتاح الإجابة.
          يظهر بعد 10 محاولات مصححة على الأقل.
        </p>
      </div>
      {rows.map((q) => {
        const hint = discriminationHint(q.discrimination);
        const totalPicks = (q.options || []).reduce((s, o) => s + Number(o.picks || 0), 0);
        return (
          <article key={q.id} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
            <header className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500">س{q.number.toLocaleString("ar-EG")}</span>
              <TypeBadge type={q.type} />
              {q.archived ? <Badge>محذوف من الامتحان</Badge> : null}
              <span className="text-[11px] text-slate-400">{fmtPoints(q.points)} درجة · أجاب {q.answered.toLocaleString("ar-EG")} · ترك {q.blank.toLocaleString("ar-EG")}</span>
              {hint ? <span className="mr-auto"><Badge tone={hint.tone}>{hint.label} ({Number(q.discrimination).toLocaleString("ar-EG", { maximumFractionDigits: 2 })})</Badge></span> : null}
            </header>
            <PlainText text={q.text} className="text-sm text-slate-800 mb-3 line-clamp-3" />
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-xs">
              <div>
                <p className="text-slate-500 mb-1">أجابوا إجابة صحيحة كاملة: <b className="text-slate-800">{fmtScore(q.correctRate)}</b></p>
                <Bar value={q.correctRate} tone={q.correctRate == null ? "gray" : Number(q.correctRate) < 40 ? "danger" : Number(q.correctRate) < 70 ? "warning" : "success"} />
              </div>
              <div>
                <p className="text-slate-500 mb-1">متوسط الدرجة في السؤال: <b className="text-slate-800">{fmtScore(q.averageEarnedRate)}</b></p>
                <Bar value={q.averageEarnedRate} />
              </div>
            </div>
            {q.options?.length ? (
              <ul className="mt-3 space-y-1.5">
                {q.options.map((o) => {
                  const pct = totalPicks ? (Number(o.picks) / totalPicks) * 100 : 0;
                  return (
                    <li key={o.id} className="grid grid-cols-[minmax(0,1fr)_100px_44px] items-center gap-2 text-xs">
                      <span dir="auto" className={cx("truncate", o.correct ? "text-emerald-700 font-medium" : "text-slate-600")}>
                        {o.correct ? "✓ " : ""}{o.text}
                      </span>
                      <Bar value={pct} tone={o.correct ? "success" : "gray"} />
                      <span className="text-slate-500 text-left">{Number(o.picks).toLocaleString("ar-EG")}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ exceptions

const emptyForm = { studentId: "", email: "", extraAttempts: 1, extraMinutes: 0, note: "" };

function Exceptions({ examId }) {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(() => {
    examApi.overrides(examId).then(({ data }) => setRows(Array.isArray(data) ? data : data?.content || []))
      .catch((e) => { setRows([]); toast.error(apiError(e, "تعذر تحميل الاستثناءات")); });
  }, [examId]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.studentId && !form.email.trim()) return toast.error("اكتب بريد الطالب");
    setSaving(true);
    try {
      await examApi.saveOverride(examId, {
        studentId: form.studentId || undefined,
        email: form.studentId ? undefined : form.email.trim(),
        extraAttempts: Number(form.extraAttempts) || 0,
        extraMinutes: Number(form.extraMinutes) || 0,
        note: form.note.trim() || undefined,
      });
      toast.success("تم حفظ الاستثناء");
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(apiError(err, "تعذر حفظ الاستثناء"));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const remove = async () => {
    try {
      await examApi.deleteOverride(examId, removing.studentId);
      toast.success("تم حذف الاستثناء");
      load();
    } catch (err) {
      toast.error(apiError(err, "تعذر الحذف"));
    } finally {
      setRemoving(null);
    }
  };

  const columns = [
    {
      key: "student", label: "الطالب",
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.studentName}</p>
          <p className="text-[11px] text-slate-400" dir="ltr">{r.studentEmail}</p>
        </div>
      ),
    },
    { key: "extraAttempts", label: "محاولات إضافية", render: (r) => `+${r.extraAttempts.toLocaleString("ar-EG")}` },
    { key: "extraMinutes", label: "وقت إضافي", render: (r) => (r.extraMinutes ? `+${r.extraMinutes.toLocaleString("ar-EG")} دقيقة` : "—") },
    { key: "attemptsUsed", label: "استخدم", render: (r) => `${r.attemptsUsed.toLocaleString("ar-EG")} محاولة` },
    { key: "note", label: "السبب", render: (r) => <span className="text-xs text-slate-500 whitespace-normal">{r.note || "—"}</span> },
    {
      key: "actions", label: "",
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <IconButton label="تعديل" icon={FiEdit2} onClick={() => setForm({ studentId: r.studentId, email: r.studentEmail, extraAttempts: r.extraAttempts, extraMinutes: r.extraMinutes, note: r.note || "" })} />
          <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => setRemoving(r)} />
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
      <Card title={form.studentId ? "تعديل استثناء" : "استثناء جديد"}>
        <form onSubmit={save} className="space-y-3">
          <p className="text-xs text-slate-500">محاولات أو وقت إضافي لطالب بعينه، مثلاً لظرف طارئ أو احتياجات خاصة. يُطبق على المحاولات الجديدة.</p>
          <Field label="بريد الطالب">
            <input type="email" dir="ltr" className={inputClass} value={form.email} disabled={Boolean(form.studentId)}
              placeholder="student@example.com" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="محاولات إضافية">
              <input type="number" min="0" max="10" className={inputClass} value={form.extraAttempts}
                onChange={(e) => setForm({ ...form, extraAttempts: e.target.value })} />
            </Field>
            <Field label="دقائق إضافية">
              <input type="number" min="0" max="600" className={inputClass} value={form.extraMinutes}
                onChange={(e) => setForm({ ...form, extraMinutes: e.target.value })} />
            </Field>
          </div>
          <Field label="السبب (اختياري)">
            <input className={inputClass} maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" loading={saving}><FiUserPlus /> حفظ</Button>
            {form.studentId ? <Button variant="secondary" onClick={() => setForm(emptyForm)}>إلغاء</Button> : null}
          </div>
        </form>
      </Card>
      <Card padded={false}>
        <DataTable columns={columns} rows={rows || []} loading={rows == null} rowKey="studentId"
          empty="لا توجد استثناءات" emptyHint="كل الطلاب على نفس القواعد" />
      </Card>
      <ConfirmDialog open={Boolean(removing)} title="حذف الاستثناء"
        message={removing ? `يعود ${removing.studentName} إلى عدد المحاولات والوقت العاديين.` : ""}
        confirmLabel="حذف" danger onConfirm={remove} onClose={() => setRemoving(null)} />
    </div>
  );
}

// ------------------------------------------------------------------ copy

function CopyDialog({ open, examId, lessons, currentLessonId, onClose, onCopied }) {
  const [lessonId, setLessonId] = useState("");
  const [busy, setBusy] = useState(false);
  const options = lessons.filter((l) => l.id !== currentLessonId);
  const copy = async () => {
    setBusy(true);
    try {
      const { data } = await examApi.copy(examId, lessonId);
      toast.success("تم نسخ الامتحان كمسودة");
      setLessonId("");
      onCopied?.(data);
    } catch (e) {
      toast.error(apiError(e, "تعذر النسخ"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} title="نسخ الامتحان إلى درس آخر" onClose={onClose}
      footer={<><Button loading={busy} disabled={!lessonId} onClick={copy}>نسخ</Button><Button variant="secondary" onClick={onClose}>إلغاء</Button></>}>
      <div className="space-y-2">
        <p className="text-xs text-slate-500">تُنسخ الأسئلة والإعدادات بدون محاولات الطلاب، وتبقى النسخة مسودة حتى تنشرها. الدرس يجب ألا يكون له امتحان.</p>
        <select className={cx(inputClass, "cursor-pointer")} value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
          <option value="">اختر الدرس</option>
          {options.map((l) => <option key={l.id} value={l.id}>{l.courseName ? `${l.courseName} — ${l.name}` : l.name}</option>)}
        </select>
      </div>
    </Dialog>
  );
}
