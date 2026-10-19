"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FiClock, FiCheckCircle, FiAlertTriangle, FiFlag, FiChevronRight, FiChevronLeft, FiWifiOff, FiLoader,
  FiPlayCircle, FiGrid, FiCalendar, FiAward, FiRepeat, FiHelpCircle,
} from "react-icons/fi";
import { Badge, Button, Card, ConfirmDialog, Dialog, cx, fmtDateTime } from "../ui";
import { examApi, apiError } from "./examApi";
import { FullScreen, PlainText } from "./ExamBits";
import QuestionView, { isAnswered } from "./QuestionView";
import ExamResultView from "./ExamResultView";
import { fmtClock, fmtDuration, fmtScore } from "./examModel";

const SAVE_DEBOUNCE_MS = 1500;
const SAVE_EVERY_MS = 15000;
const backupKey = (attemptId) => `exam-attempt:${attemptId}`;

const readBackup = (attemptId) => {
  try {
    const raw = localStorage.getItem(backupKey(attemptId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeBackup = (attemptId, data) => {
  try {
    localStorage.setItem(backupKey(attemptId), JSON.stringify({ ...data, t: Date.now() }));
  } catch {
    // storage full or blocked: the server copy is still there
  }
};
const dropBackup = (attemptId) => {
  try {
    localStorage.removeItem(backupKey(attemptId));
  } catch {
    // ignore
  }
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const retriable = (e) => !e?.response || e.response.status === 429 || e.response.status >= 500;

/**
 * The student's exam inside a lesson: overview (rules, attempts, last result), the timed attempt
 * (autosave, resume, flags, navigator) and the result. onFinished() after a submission so the
 * lesson can refresh (a pass opens the video).
 */
export default function ExamPlayer({ examId, canAccess = true, onFinished }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await examApi.me(examId);
      setMe(data);
    } catch (e) {
      toast.error(apiError(e, "تعذر تحميل الامتحان"));
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (canAccess) load();
    else setLoading(false);
  }, [canAccess, load]);

  const start = async () => {
    setConfirmStart(false);
    setStarting(true);
    try {
      let data;
      try {
        ({ data } = await examApi.start(examId));
      } catch (e) {
        // Two clicks at once: the second one is refused; starting again resumes the open attempt
        if (e?.response?.status !== 409 || /اجتزت|قيد التصحيح|تسليم/.test(apiError(e))) throw e;
        ({ data } = await examApi.start(examId));
      }
      setResult(null);
      setAttempt(data);
    } catch (e) {
      toast.error(apiError(e, "تعذر بدء الامتحان"));
      load();
    } finally {
      setStarting(false);
    }
  };

  const finished = (review) => {
    setAttempt(null);
    setResult(review);
    load();
    onFinished?.(review);
  };

  if (!canAccess) {
    return (
      <Card>
        <div className="py-8 text-center">
          <FiHelpCircle className="mx-auto w-8 h-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-600">اشترك في الدرس لتتمكن من دخول الامتحان.</p>
        </div>
      </Card>
    );
  }
  if (loading) return <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />;
  if (!me) {
    return (
      <Card>
        <div className="py-8 text-center">
          <p className="text-sm text-slate-600">تعذر تحميل الامتحان.</p>
          <Button className="mt-3" variant="secondary" onClick={() => { setLoading(true); load(); }}>إعادة المحاولة</Button>
        </div>
      </Card>
    );
  }
  if (attempt) return <Attempt start={attempt} me={me} onDone={finished} />;

  return (
    <div className="space-y-4" dir="rtl">
      {result ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">نتيجة المحاولة</h3>
          <ExamResultView review={result} />
        </div>
      ) : null}
      <Overview me={me} starting={starting} onStart={() => (me.openAttemptId ? start() : setConfirmStart(true))} hideLatest={Boolean(result)} />
      <ConfirmDialog
        open={confirmStart}
        title="بدء الامتحان"
        message={`مدة الامتحان ${me.timeLimitMinutes.toLocaleString("ar-EG")} دقيقة وتبدأ فور الضغط على "ابدأ". الوقت لا يتوقف إذا أغلقت الصفحة، وإجاباتك تُحفظ تلقائياً ويمكنك الرجوع لاستكمالها. عند انتهاء الوقت تُسلّم إجاباتك المحفوظة تلقائياً.`}
        confirmLabel="ابدأ"
        busy={starting}
        onConfirm={start}
        onClose={() => setConfirmStart(false)}
      />
    </div>
  );
}

// ------------------------------------------------------------------ overview

function Overview({ me, starting, onStart, hideLatest }) {
  const hasWindow = me.availableFrom || me.availableUntil;
  return (
    <>
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{me.title}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="brand"><FiClock className="w-3 h-3" /> {me.timeLimitMinutes.toLocaleString("ar-EG")} دقيقة</Badge>
                <Badge tone="brand"><FiHelpCircle className="w-3 h-3" /> {me.questionCount.toLocaleString("ar-EG")} سؤال</Badge>
                <Badge tone="brand"><FiAward className="w-3 h-3" /> النجاح من {fmtScore(me.passingScore)}</Badge>
                <Badge tone="gray"><FiRepeat className="w-3 h-3" /> المحاولات {me.attemptsUsed.toLocaleString("ar-EG")} من {me.maxAttempts.toLocaleString("ar-EG")}</Badge>
                {me.bestScore != null ? <Badge tone={me.passed ? "success" : "gray"}>أفضل درجة {fmtScore(me.bestScore)}</Badge> : null}
              </div>
            </div>
            {me.passed ? <Badge tone="success"><FiCheckCircle className="w-3 h-3" /> اجتزت الامتحان</Badge> : null}
          </div>

          {hasWindow ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
              {me.availableFrom ? <>من {fmtDateTime(me.availableFrom)} </> : null}
              {me.availableUntil ? <>حتى {fmtDateTime(me.availableUntil)}</> : null}
            </p>
          ) : null}

          {me.instructions ? (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-xs font-medium text-slate-500 mb-1">تعليمات المدرس</p>
              <PlainText text={me.instructions} />
            </div>
          ) : null}

          <ul className="text-xs text-slate-500 space-y-1 list-disc pr-4">
            <li>إجاباتك تُحفظ تلقائياً أثناء الحل، ولو انقطع الإنترنت تُحفظ على جهازك وتُرسل عند عودته.</li>
            <li>الوقت يُحسب على الخادم ولا يتوقف إذا خرجت من الصفحة. عند انتهائه تُسلّم الإجابات المحفوظة تلقائياً.</li>
            <li>الخروج من صفحة الامتحان أثناء الحل يُسجَّل ويظهر للمدرس.</li>
            {me.oneQuestionPerPage && !me.allowBackNavigation ? <li>الأسئلة بالترتيب: لا يمكن الرجوع لسؤال بعد تجاوزه.</li> : null}
          </ul>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {me.openAttemptId ? (
              <>
                <Button loading={starting} onClick={onStart}><FiPlayCircle /> استكمال المحاولة</Button>
                <span className="text-xs text-amber-700">
                  لديك محاولة مفتوحة، متبقي {fmtDuration(me.openAttemptRemainingSeconds)}
                </span>
              </>
            ) : me.canStart ? (
              <Button loading={starting} onClick={onStart}>
                <FiPlayCircle /> {me.attemptsUsed ? "محاولة جديدة" : "ابدأ الامتحان"}
              </Button>
            ) : (
              <p className="text-sm text-slate-600">{me.blockedReason}</p>
            )}
            {me.attemptsRemaining > 0 && !me.passed && me.attemptsUsed ? (
              <span className="text-xs text-slate-500">متبقي {me.attemptsRemaining.toLocaleString("ar-EG")} محاولة</span>
            ) : null}
          </div>
        </div>
      </Card>

      {me.attempts?.length ? (
        <Card title="محاولاتك" padded={false}>
          <ul className="divide-y divide-slate-100">
            {me.attempts.map((a) => (
              <li key={a.submissionId} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                <span className="text-slate-500 text-xs w-20">المحاولة {a.attemptNumber.toLocaleString("ar-EG")}</span>
                <span className="font-semibold text-slate-900 w-16">{fmtScore(a.score)}</span>
                {a.status === "PENDING_REVIEW" ? <Badge tone="warning">قيد التصحيح</Badge>
                  : a.passed ? <Badge tone="success">ناجح</Badge> : <Badge tone="danger">لم يجتز</Badge>}
                {a.autoSubmitted ? <Badge>تسليم تلقائي</Badge> : null}
                <span className="mr-auto text-xs text-slate-400">{fmtDateTime(a.submittedAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {me.latest && !hideLatest ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">آخر نتيجة</h3>
          <ExamResultView review={me.latest} />
        </div>
      ) : null}
    </>
  );
}

// ------------------------------------------------------------------ the attempt

function Attempt({ start, me, onDone }) {
  const attemptId = start.attemptId;
  const questions = useMemo(() => start.exam?.questions || [], [start]);
  const onePerPage = Boolean(start.exam?.oneQuestionPerPage ?? me.oneQuestionPerPage);
  const backAllowed = !onePerPage || (start.exam?.allowBackNavigation ?? me.allowBackNavigation) !== false;

  // Answers: server copy, or the local backup when it is newer (saved while offline)
  const initial = useMemo(() => {
    const server = { answers: start.savedAnswers || {}, flagged: start.flagged || [] };
    const local = readBackup(attemptId);
    const serverTime = start.lastSavedAt ? new Date(start.lastSavedAt).getTime() : 0;
    if (local && local.t > serverTime + 1000) return { answers: local.answers || {}, flagged: local.flagged || [], fromLocal: true };
    return server;
  }, [attemptId, start]);

  const [answers, setAnswers] = useState(initial.answers);
  const [flagged, setFlagged] = useState(() => new Set(initial.flagged));
  const [current, setCurrent] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [saveState, setSaveState] = useState(initial.fromLocal ? "pending" : "saved");
  const [lastSaved, setLastSaved] = useState(start.lastSavedAt ? new Date(start.lastSavedAt) : null);
  const [navOpen, setNavOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [timeUpFailed, setTimeUpFailed] = useState(false);
  const deadline = useRef(Date.now() + Math.max(0, Number(start.remainingSeconds) || 0) * 1000);
  const [remaining, setRemaining] = useState(Math.max(0, Number(start.remainingSeconds) || 0));

  // Save queue: one request at a time, always the newest answers
  const latest = useRef({ answers: initial.answers, flagged: initial.flagged });
  const version = useRef(initial.fromLocal ? 1 : 0);
  const savedVersion = useRef(0);
  const inFlight = useRef(false);
  const closed = useRef(false);
  const retryDelay = useRef(3000);
  const debounce = useRef(null);
  const lastEvent = useRef({});
  const done = useRef(false);
  const [serverClosed, setServerClosed] = useState(false);

  const save = useCallback(async () => {
    if (closed.current || inFlight.current || version.current === savedVersion.current) return;
    inFlight.current = true;
    const v = version.current;
    let failed = false;
    setSaveState("saving");
    try {
      const { data } = await examApi.save(attemptId, latest.current);
      savedVersion.current = v;
      retryDelay.current = 3000;
      setLastSaved(new Date(data?.savedAt || Date.now()));
      if (data?.remainingSeconds != null) deadline.current = Date.now() + data.remainingSeconds * 1000; // follow the server clock
      setSaveState(version.current === v ? "saved" : "pending");
    } catch (e) {
      failed = true;
      if (e?.response?.status === 409) {
        // Time is over or the attempt was submitted elsewhere (another tab, the automatic job)
        closed.current = true;
        setSaveState("saved");
        setServerClosed(true);
      } else {
        setSaveState(retriable(e) ? "offline" : "error");
        const delay = retryDelay.current;
        retryDelay.current = Math.min(30000, delay * 2);
        setTimeout(() => save(), delay);
      }
    } finally {
      inFlight.current = false;
      if (!failed && !closed.current && version.current !== savedVersion.current) {
        // changed while saving: send the newer answers
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => save(), 400);
      }
    }
  }, [attemptId]);

  const changed = useCallback((nextAnswers, nextFlagged) => {
    latest.current = { answers: nextAnswers, flagged: [...nextFlagged] };
    version.current++;
    writeBackup(attemptId, latest.current);
    setSaveState("pending");
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => save(), SAVE_DEBOUNCE_MS);
  }, [attemptId, save]);

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (isAnswered(value)) next[questionId] = value;
      else delete next[questionId];
      changed(next, latest.current.flagged);
      return next;
    });
  };

  const toggleFlag = (questionId) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      changed(latest.current.answers, next);
      return next;
    });
  };

  // Restored from the device: send it now
  useEffect(() => {
    if (initial.fromLocal) save();
  }, [initial.fromLocal, save]);

  // Periodic save, clock, leave-page handling, integrity signals
  useEffect(() => {
    const every = setInterval(() => save(), SAVE_EVERY_MS);
    const tick = setInterval(() => setRemaining(Math.max(0, Math.round((deadline.current - Date.now()) / 1000))), 500);
    const signal = (type) => {
      const now = Date.now();
      if (closed.current || now - (lastEvent.current[type] || 0) < 3000) return;
      lastEvent.current[type] = now;
      examApi.event(attemptId, type).catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        save();
        signal("TAB_HIDDEN");
      }
    };
    const onUnload = (e) => {
      if (closed.current) return;
      save();
      e.preventDefault();
      e.returnValue = "";
    };
    const onOnline = () => save();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("online", onOnline);
    window.__examSignal = signal;
    return () => {
      clearInterval(every);
      clearInterval(tick);
      clearTimeout(debounce.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("online", onOnline);
      delete window.__examSignal;
    };
  }, [attemptId, save]);

  const finish = useCallback((review) => {
    if (done.current) return;
    done.current = true;
    closed.current = true;
    dropBackup(attemptId);
    onDone(review);
  }, [attemptId, onDone]);

  const submit = useCallback(async (automatic = false) => {
    if (done.current || (closed.current && !automatic)) return;
    closed.current = true; // no autosave while submitting
    setSubmitting(true);
    clearTimeout(debounce.current);
    const body = latest.current;
    // When time runs out, a whole class submits together: spread the requests a little
    if (automatic) await wait(Math.random() * 3000);
    let lastError;
    for (let i = 0; i < (automatic ? 8 : 3); i++) {
      try {
        const { data } = await examApi.submit(attemptId, body);
        if (done.current) return;
        toast[data.passed ? "success" : data.status === "PENDING_REVIEW" ? "info" : "error"](
          data.status === "PENDING_REVIEW" ? "تم التسليم، والنتيجة النهائية بعد تصحيح المدرس"
            : data.passed ? `أحسنت! نجحت بدرجة ${fmtScore(data.score)}` : `لم تجتز الامتحان، درجتك ${fmtScore(data.score)}`
        );
        finish(data);
        return;
      } catch (e) {
        lastError = e;
        if (e?.response?.status === 409) {
          // Already submitted (by the automatic job or another tab): show the saved result
          finish(null);
          return;
        }
        if (!retriable(e)) break;
        await wait(1000 * (i + 1) + Math.random() * 1500);
      }
    }
    setSubmitting(false);
    if (automatic) {
      setTimeUpFailed(true);
    } else {
      closed.current = false; // still open: keep saving
      toast.error(apiError(lastError, "تعذر التسليم، تحقق من الإنترنت وحاول مرة أخرى. إجاباتك محفوظة."));
    }
  }, [attemptId, finish]);

  // The server closed the attempt: fetch the result through submit (answers a 409 with the result)
  useEffect(() => {
    if (!serverClosed) return;
    setTimeUp(true);
    submit(true);
  }, [serverClosed, submit]);

  // Time is up: submit what we have (the server accepts it within a short grace period)
  useEffect(() => {
    if (remaining > 0 || timeUp) return;
    setTimeUp(true);
    closed.current = true;
    submit(true);
  }, [remaining, timeUp, submit]);

  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const unanswered = questions.map((q, i) => ({ q, i })).filter(({ q }) => !isAnswered(answers[q.id]));
  const flaggedList = questions.map((q, i) => ({ q, i })).filter(({ q }) => flagged.has(q.id));

  const goTo = (i) => {
    if (!backAllowed && i < furthest) return;
    setCurrent(i);
    setFurthest((f) => Math.max(f, i));
    setNavOpen(false);
    if (!onePerPage) document.getElementById(`aq-${questions[i]?.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    else document.getElementById("exam-scroll")?.scrollTo({ top: 0 });
  };

  const onPaste = () => window.__examSignal?.("PASTE");

  return (
    <FullScreen label={me.title}>
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{me.title}</p>
            <p className="text-[11px] text-slate-500">
              أجبت {answeredCount.toLocaleString("ar-EG")} من {questions.length.toLocaleString("ar-EG")}
              {flagged.size ? ` · ${flagged.size.toLocaleString("ar-EG")} للمراجعة` : ""}
            </p>
          </div>
          <SaveIndicator state={saveState} lastSaved={lastSaved} />
          <Timer seconds={remaining} />
          <Button size="sm" onClick={() => setConfirmSubmit(true)} disabled={submitting || timeUp}>تسليم</Button>
        </div>
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} />
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <main id="exam-scroll" className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-3 pb-24 lg:pb-6">
            {onePerPage ? (
              questions[current] ? (
                <>
                  <QuestionView q={questions[current]} number={current + 1} total={questions.length}
                    value={answers[questions[current].id]} onChange={(v) => setAnswer(questions[current].id, v)}
                    flagged={flagged.has(questions[current].id)} onToggleFlag={() => toggleFlag(questions[current].id)}
                    disabled={timeUp} onPaste={onPaste} />
                  <div className="flex items-center justify-between gap-2">
                    {backAllowed ? (
                      <Button variant="secondary" disabled={current === 0} onClick={() => goTo(current - 1)}>
                        <FiChevronRight /> السابق
                      </Button>
                    ) : <span />}
                    {current < questions.length - 1 ? (
                      <Button onClick={() => goTo(current + 1)}>التالي <FiChevronLeft /></Button>
                    ) : (
                      <Button onClick={() => setConfirmSubmit(true)} disabled={timeUp}>مراجعة وتسليم</Button>
                    )}
                  </div>
                </>
              ) : null
            ) : (
              <>
                {questions.map((q, i) => (
                  <div key={q.id} id={`aq-${q.id}`} className="scroll-mt-3">
                    <QuestionView q={q} number={i + 1} total={questions.length} value={answers[q.id]}
                      onChange={(v) => setAnswer(q.id, v)} flagged={flagged.has(q.id)} onToggleFlag={() => toggleFlag(q.id)}
                      disabled={timeUp} onPaste={onPaste} />
                  </div>
                ))}
                <div className="flex justify-center pt-2">
                  <Button onClick={() => setConfirmSubmit(true)} disabled={timeUp}>مراجعة وتسليم</Button>
                </div>
              </>
            )}
          </div>
        </main>

        {/* Navigator (wide screens) */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-3">
          <Navigator questions={questions} answers={answers} flagged={flagged} current={onePerPage ? current : -1}
            locked={(i) => !backAllowed && i < furthest} onPick={goTo} />
        </aside>
      </div>

      {/* Navigator (phones) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setNavOpen(true)}><FiGrid /> الأسئلة</Button>
        <span className="text-xs text-slate-500">أجبت {answeredCount.toLocaleString("ar-EG")}/{questions.length.toLocaleString("ar-EG")}</span>
      </div>
      <Dialog open={navOpen} title="الأسئلة" onClose={() => setNavOpen(false)}>
        <Navigator questions={questions} answers={answers} flagged={flagged} current={onePerPage ? current : -1}
          locked={(i) => !backAllowed && i < furthest} onPick={goTo} />
      </Dialog>

      {/* Submit summary */}
      <Dialog
        open={confirmSubmit && !timeUp}
        title="تسليم الامتحان"
        onClose={() => setConfirmSubmit(false)}
        footer={
          <>
            <Button loading={submitting} onClick={() => { setConfirmSubmit(false); submit(false); }}>تسليم نهائي</Button>
            <Button variant="secondary" onClick={() => setConfirmSubmit(false)}>رجوع للأسئلة</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-slate-700">
            أجبت عن <b>{answeredCount.toLocaleString("ar-EG")}</b> من <b>{questions.length.toLocaleString("ar-EG")}</b> سؤال.
            بعد التسليم لا يمكن تعديل الإجابات.
          </p>
          {unanswered.length ? (
            <JumpList label="بدون إجابة" tone="danger" items={unanswered} onPick={(i) => { setConfirmSubmit(false); goTo(i); }}
              disabled={(i) => !backAllowed && i < furthest} />
          ) : null}
          {flaggedList.length ? (
            <JumpList label="معلّمة للمراجعة" tone="warning" items={flaggedList} onPick={(i) => { setConfirmSubmit(false); goTo(i); }}
              disabled={(i) => !backAllowed && i < furthest} />
          ) : null}
        </div>
      </Dialog>

      {/* Time is up */}
      {timeUp ? (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-sm w-full text-center">
            {timeUpFailed ? (
              <>
                <FiWifiOff className="mx-auto w-8 h-8 text-amber-500" />
                <p className="mt-2 text-sm font-semibold text-slate-900">انتهى الوقت</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  تعذر الاتصال بالخادم. إجاباتك المحفوظة ستُصحح تلقائياً خلال دقائق، وستجد نتيجتك في صفحة الامتحان.
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <Button size="sm" onClick={() => { setTimeUpFailed(false); submit(true); }}>إعادة المحاولة</Button>
                  <Button size="sm" variant="secondary" onClick={() => finish(null)}>العودة</Button>
                </div>
              </>
            ) : (
              <>
                <FiLoader className="mx-auto w-8 h-8 text-brand-600 animate-spin" />
                <p className="mt-2 text-sm font-semibold text-slate-900">انتهى الوقت</p>
                <p className="mt-1 text-xs text-slate-600">جاري تسليم إجاباتك...</p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </FullScreen>
  );
}

function Timer({ seconds }) {
  const danger = seconds <= 60;
  const warn = seconds <= 300;
  const announced = useRef({});
  useEffect(() => {
    if (seconds === 300 && !announced.current[300]) {
      announced.current[300] = true;
      toast.warn("باقي 5 دقائق");
    }
    if (seconds === 60 && !announced.current[60]) {
      announced.current[60] = true;
      toast.error("باقي دقيقة واحدة");
    }
  }, [seconds]);
  return (
    <div
      role="timer"
      aria-live={danger ? "assertive" : "off"}
      className={cx(
        "shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-sm font-bold tabular-nums",
        danger ? "bg-red-50 text-red-700 animate-pulse" : warn ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700"
      )}
      dir="ltr"
    >
      <FiClock className="w-4 h-4" /> {fmtClock(seconds)}
    </div>
  );
}

function SaveIndicator({ state, lastSaved }) {
  const map = {
    saved: { icon: FiCheckCircle, text: "تم الحفظ", cls: "text-emerald-600" },
    saving: { icon: FiLoader, text: "جاري الحفظ", cls: "text-slate-500", spin: true },
    pending: { icon: FiLoader, text: "سيُحفظ حالاً", cls: "text-slate-400" },
    offline: { icon: FiWifiOff, text: "غير متصل، محفوظ على جهازك", cls: "text-amber-600" },
    error: { icon: FiAlertTriangle, text: "تعذر الحفظ، نحاول مجدداً", cls: "text-red-600" },
  };
  const s = map[state] || map.saved;
  const Icon = s.icon;
  return (
    <span className={cx("hidden sm:inline-flex items-center gap-1 text-[11px]", s.cls)} title={lastSaved ? `آخر حفظ ${lastSaved.toLocaleTimeString("ar-EG")}` : undefined}>
      <Icon className={cx("w-3.5 h-3.5", s.spin && "animate-spin")} /> {s.text}
    </span>
  );
}

function Navigator({ questions, answers, flagged, current, onPick, locked }) {
  return (
    <div>
      <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const done = isAnswered(answers[q.id]);
          const flag = flagged.has(q.id);
          const isLocked = locked(i);
          return (
            <button
              key={q.id}
              type="button"
              disabled={isLocked}
              onClick={() => onPick(i)}
              aria-label={`السؤال ${i + 1}${done ? "، تمت الإجابة" : ""}${flag ? "، للمراجعة" : ""}`}
              className={cx(
                "relative h-9 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                done ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                current === i && "ring-2 ring-offset-1 ring-brand-600"
              )}
            >
              {(i + 1).toLocaleString("ar-EG")}
              {flag ? <FiFlag className="absolute -top-1 -left-1 w-3 h-3 text-amber-500 fill-amber-400" /> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-3 space-y-1 text-[11px] text-slate-500">
        <p className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-600" /> تمت الإجابة</p>
        <p className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-slate-300" /> بدون إجابة</p>
        <p className="flex items-center gap-1.5"><FiFlag className="w-3 h-3 text-amber-500" /> للمراجعة</p>
      </div>
    </div>
  );
}

function JumpList({ label, tone, items, onPick, disabled }) {
  return (
    <div>
      <p className={cx("text-xs font-medium mb-1", tone === "danger" ? "text-red-700" : "text-amber-700")}>
        {label} ({items.length.toLocaleString("ar-EG")})
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map(({ q, i }) => (
          <button key={q.id} type="button" disabled={disabled(i)} onClick={() => onPick(i)}
            className="h-7 min-w-7 px-1.5 rounded-md border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            {(i + 1).toLocaleString("ar-EG")}
          </button>
        ))}
      </div>
    </div>
  );
}
