/*
 * Shared exam helpers: question types, empty questions, request bodies, client-side checks
 * (the same rules the server applies, so teachers see problems before saving), CSV import.
 */
import {
  FiCheckCircle, FiCheckSquare, FiToggleRight, FiType, FiHash, FiAlignRight,
} from "react-icons/fi";

export const QUESTION_TYPES = [
  { id: "SINGLE_CHOICE", label: "اختيار من متعدد", short: "اختيار", icon: FiCheckCircle, hint: "إجابة واحدة صحيحة" },
  { id: "MULTIPLE_CHOICE", label: "اختيارات متعددة", short: "متعدد", icon: FiCheckSquare, hint: "أكثر من إجابة صحيحة" },
  { id: "TRUE_FALSE", label: "صح أو خطأ", short: "صح/خطأ", icon: FiToggleRight, hint: "" },
  { id: "SHORT_ANSWER", label: "إجابة قصيرة", short: "قصيرة", icon: FiType, hint: "يُصحح تلقائياً، اكتب كل الصيغ المقبولة" },
  { id: "NUMERIC", label: "إجابة رقمية", short: "رقمية", icon: FiHash, hint: "رقم مع هامش خطأ مسموح" },
  { id: "ESSAY", label: "سؤال مقالي", short: "مقالي", icon: FiAlignRight, hint: "يصححه المدرس" },
];

export const typeOf = (id) => QUESTION_TYPES.find((t) => t.id === id) || QUESTION_TYPES[0];
export const isChoice = (type) => type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE";

export const RESULTS_POLICIES = [
  { value: "AFTER_PASS_OR_LAST", label: "بعد النجاح أو آخر محاولة", hint: "الأفضل: لا يرى الطالب الإجابات وهو ما زال يحاول" },
  { value: "IMMEDIATE", label: "فوراً بعد كل محاولة", hint: "مناسب للتدريب" },
  { value: "AFTER_CLOSE", label: "بعد موعد إغلاق الامتحان", hint: "مناسب للامتحانات المجدولة لكل الطلاب" },
  { value: "SCORE_ONLY", label: "الدرجة فقط", hint: "لا تظهر الإجابات الصحيحة أبداً" },
];

let seq = 0;
/** Local key for list rendering (questions and options get server ids only after saving). */
export const key = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;

const option = (answerText = "", correct = false, id) => ({ key: key(), id, answerText, correct });

export function blankQuestion(type = "SINGLE_CHOICE") {
  const q = { key: key(), id: undefined, questionType: type, questionText: "", points: 1, explanation: "",
    imageId: null, numericTolerance: "", answers: [] };
  return withTypeDefaults(q, type);
}

/** Changing the type keeps what still makes sense (the text, points, matching options). */
export function withTypeDefaults(q, type) {
  const next = { ...q, questionType: type };
  if (type === "TRUE_FALSE") {
    const wasTrue = q.questionType === "TRUE_FALSE" ? q.answers[0]?.correct !== false : true;
    next.answers = [option("صح", wasTrue, q.questionType === "TRUE_FALSE" ? q.answers[0]?.id : undefined),
      option("خطأ", !wasTrue, q.questionType === "TRUE_FALSE" ? q.answers[1]?.id : undefined)];
  } else if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
    const keep = isChoice(q.questionType) && q.questionType !== "TRUE_FALSE" ? q.answers : [];
    next.answers = keep.length >= 2 ? keep.map((a) => ({ ...a })) : [option(), option(), option(), option()];
    if (type === "SINGLE_CHOICE") {
      let seen = false;
      next.answers = next.answers.map((a) => {
        const correct = a.correct && !seen;
        if (correct) seen = true;
        return { ...a, correct };
      });
    }
  } else if (type === "SHORT_ANSWER") {
    next.answers = q.questionType === "SHORT_ANSWER" && q.answers.length ? q.answers : [option("", true)];
  } else if (type === "NUMERIC") {
    next.answers = q.questionType === "NUMERIC" && q.answers.length ? q.answers.slice(0, 1) : [option("", true)];
  } else {
    next.answers = [];
  }
  return next;
}

/** Server exam (staff view) -> editor state. */
export function fromServer(exam) {
  return {
    id: exam.id,
    lessonId: exam.lessonId || "",
    title: exam.title || "",
    instructions: exam.instructions || "",
    status: exam.status || "PUBLISHED",
    passingScore: exam.passingScore ?? 50,
    timeLimitMinutes: exam.timeLimitMinutes ?? 30,
    maxAttempts: exam.maxAttempts ?? 1,
    shuffleQuestions: exam.shuffleQuestions ?? true,
    resultsPolicy: exam.resultsPolicy || "AFTER_PASS_OR_LAST",
    availableFrom: toLocalInput(exam.availableFrom),
    availableUntil: toLocalInput(exam.availableUntil),
    questionPoolSize: exam.questionPoolSize || "",
    partialCredit: !!exam.partialCredit,
    negativeMarkingPercent: exam.negativeMarkingPercent ? Number(exam.negativeMarkingPercent) : 0,
    oneQuestionPerPage: !!exam.oneQuestionPerPage,
    allowBackNavigation: exam.allowBackNavigation !== false,
    submissionCount: exam.submissionCount || 0,
    questions: (exam.questions || []).map((q) => ({
      key: key(),
      id: q.id,
      questionType: q.questionType,
      questionText: q.questionText || "",
      points: Number(q.points) || 1,
      explanation: q.explanation || "",
      imageId: q.imageId || null,
      numericTolerance: q.numericTolerance != null ? String(Number(q.numericTolerance)) : "",
      answers: (q.answers || []).map((a) => option(a.answerText, a.correct ?? a.isCorrect, a.id)),
    })),
  };
}

export function blankExam(lessonId = "") {
  return {
    id: undefined, lessonId, title: "", instructions: "", status: "DRAFT", passingScore: 50, timeLimitMinutes: 30,
    maxAttempts: 1, shuffleQuestions: true, resultsPolicy: "AFTER_PASS_OR_LAST", availableFrom: "", availableUntil: "",
    questionPoolSize: "", partialCredit: false, negativeMarkingPercent: 0, oneQuestionPerPage: false,
    allowBackNavigation: true, submissionCount: 0, questions: [blankQuestion()],
  };
}

/** Editor state -> request body for POST/PUT /api/exams. */
export function toRequest(exam, status) {
  const hasSchedule = Boolean(exam.availableFrom || exam.availableUntil);
  return {
    title: exam.title.trim(),
    instructions: exam.instructions?.trim() || "",
    passingScore: Number(exam.passingScore),
    timeLimitMinutes: Number(exam.timeLimitMinutes),
    maxAttempts: Number(exam.maxAttempts),
    shuffleQuestions: !!exam.shuffleQuestions,
    status: status || exam.status,
    resultsPolicy: exam.resultsPolicy,
    clearSchedule: true, // the dates below are the whole schedule
    availableFrom: hasSchedule && exam.availableFrom ? fromLocalInput(exam.availableFrom) : undefined,
    availableUntil: hasSchedule && exam.availableUntil ? fromLocalInput(exam.availableUntil) : undefined,
    questionPoolSize: exam.questionPoolSize ? Number(exam.questionPoolSize) : 0,
    partialCredit: !!exam.partialCredit,
    negativeMarkingPercent: Number(exam.negativeMarkingPercent) || 0,
    oneQuestionPerPage: !!exam.oneQuestionPerPage,
    allowBackNavigation: !!exam.allowBackNavigation,
    questions: exam.questions.map(questionToRequest),
  };
}

export function questionToRequest(q) {
  return {
    id: q.id,
    questionType: q.questionType,
    questionText: q.questionText.trim(),
    points: Number(q.points),
    explanation: q.explanation?.trim() || undefined,
    imageId: q.imageId || undefined,
    numericTolerance: q.questionType === "NUMERIC" && q.numericTolerance !== "" ? Number(q.numericTolerance) : undefined,
    answers: q.questionType === "ESSAY" ? [] : q.answers
      .filter((a) => a.answerText.trim() !== "")
      .map((a) => ({ id: a.id, answerText: a.answerText.trim(), correct: !isChoice(q.questionType) || !!a.correct })),
  };
}

/** Same checks as the server. Returns { exam: string|null, questions: { [key]: string } }. */
export function validate(exam, { requireLesson = false } = {}) {
  const questions = {};
  let examError = null;
  if (requireLesson && !exam.lessonId) examError = "اختر الدرس";
  else if (!exam.title.trim()) examError = "اكتب عنوان الامتحان";
  else if (!(Number(exam.passingScore) >= 0 && Number(exam.passingScore) <= 100)) examError = "درجة النجاح من 0 إلى 100";
  else if (!(Number(exam.timeLimitMinutes) >= 1 && Number(exam.timeLimitMinutes) <= 600)) examError = "مدة الامتحان من 1 إلى 600 دقيقة";
  else if (!(Number(exam.maxAttempts) >= 1 && Number(exam.maxAttempts) <= 20)) examError = "عدد المحاولات من 1 إلى 20";
  else if (exam.availableFrom && exam.availableUntil && new Date(exam.availableFrom) >= new Date(exam.availableUntil)) {
    examError = "موعد النهاية يجب أن يكون بعد موعد البداية";
  } else if (exam.questions.length === 0) examError = "أضف سؤالاً واحداً على الأقل";
  else if (exam.questionPoolSize && Number(exam.questionPoolSize) > exam.questions.length) {
    examError = `عدد أسئلة كل محاولة أكبر من عدد الأسئلة (${exam.questions.length})`;
  }

  const seen = new Map();
  exam.questions.forEach((q, i) => {
    const problem = questionProblem(q);
    if (problem) {
      questions[q.key] = problem;
      return;
    }
    const dupKey = `${q.questionText.trim().toLowerCase()}|${q.imageId || ""}`;
    if (seen.has(dupKey)) questions[q.key] = `مكرر مع السؤال ${seen.get(dupKey) + 1}`;
    else seen.set(dupKey, i);
  });
  if (!examError && Object.keys(questions).length) examError = "صحح الأسئلة المحددة باللون الأحمر";
  return { exam: examError, questions };
}

export function questionProblem(q) {
  if (!q.questionText.trim()) return "اكتب نص السؤال";
  if (!(Number(q.points) > 0)) return "الدرجة يجب أن تكون أكبر من صفر";
  const filled = q.answers.filter((a) => a.answerText.trim() !== "");
  const correct = filled.filter((a) => a.correct).length;
  const texts = filled.map((a) => a.answerText.trim());
  if (isChoice(q.questionType) && new Set(texts).size !== texts.length) return "يوجد اختياران متطابقان";
  switch (q.questionType) {
    case "SINGLE_CHOICE":
      if (filled.length < 2) return "أضف اختيارين على الأقل";
      if (correct !== 1) return "حدد إجابة صحيحة واحدة";
      return null;
    case "MULTIPLE_CHOICE":
      if (filled.length < 2) return "أضف اختيارين على الأقل";
      if (correct < 1) return "حدد الإجابات الصحيحة";
      return null;
    case "TRUE_FALSE":
      return correct === 1 ? null : "حدد الإجابة الصحيحة";
    case "SHORT_ANSWER":
      return filled.length ? null : "اكتب الإجابة المقبولة";
    case "NUMERIC":
      if (filled.length !== 1 || parseNumber(filled[0].answerText) === null) return "اكتب الإجابة الصحيحة رقماً";
      if (q.numericTolerance !== "" && !(Number(q.numericTolerance) >= 0)) return "هامش الخطأ رقم موجب";
      return null;
    default:
      return null;
  }
}

/** "١٢٫٥" and "12,5" are numbers too (same as the server). */
export function parseNumber(text) {
  if (text == null) return null;
  const s = String(text)
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫,]/g, ".")
    .replace(/−/g, "-")
    .replace(/[\s٬]/g, "");
  if (!/^[-+]?\d*\.?\d+([eE][-+]?\d{1,3})?$/.test(s)) return null;
  return Number(s);
}

export const totalPoints = (questions) => questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

// ---------------------------------------------------------------- dates

function toLocalInput(value) {
  if (!value) return "";
  return String(value).slice(0, 16); // server sends Cairo local time without zone
}

function fromLocalInput(value) {
  return value.length === 16 ? `${value}:00` : value;
}

// ---------------------------------------------------------------- CSV import

export const CSV_TEMPLATE =
  "﻿النوع,السؤال,الدرجة,الإجابة الصحيحة,اختيار 1,اختيار 2,اختيار 3,اختيار 4,اختيار 5,اختيار 6,الشرح\r\n" +
  "اختيار,عاصمة مصر؟,1,1,القاهرة,الإسكندرية,أسوان,الأقصر,,,القاهرة هي العاصمة منذ أكثر من ألف عام\r\n" +
  "متعدد,اختر الأعداد الأولية,2,1;2,2,3,4,9,,,\r\n" +
  "صح وخطأ,الماء يغلي عند 100 درجة عند سطح البحر,1,صح,,,,,,,\r\n" +
  "قصيرة,ما هو رمز الماء الكيميائي؟,1,H2O;h2o,,,,,,,\r\n" +
  "رقمية,عجلة الجاذبية الأرضية بالمتر/ث²,2,9.8,0.1,,,,,,خانة اختيار 1 هي هامش الخطأ\r\n" +
  "مقالي,اشرح الفرق بين السرعة والعجلة,4,,,,,,,,نقاط التصحيح: التعريف + الوحدة + مثال\r\n";

const TYPE_WORDS = {
  SINGLE_CHOICE: ["اختيار", "اختيار من متعدد", "single", "mcq"],
  MULTIPLE_CHOICE: ["متعدد", "اختيارات متعددة", "multiple"],
  TRUE_FALSE: ["صح وخطأ", "صح/خطأ", "صح او خطأ", "صح أو خطأ", "true/false", "tf"],
  SHORT_ANSWER: ["قصيرة", "إجابة قصيرة", "short"],
  NUMERIC: ["رقمية", "رقم", "numeric", "number"],
  ESSAY: ["مقالي", "مقال", "essay"],
};

function typeFromWord(word) {
  const w = (word || "").trim().toLowerCase();
  return Object.keys(TYPE_WORDS).find((t) => TYPE_WORDS[t].some((x) => x.toLowerCase() === w)) || null;
}

/** RFC-4180 style rows (quotes, commas and new lines inside quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === "," || c === "\t" || c === "؛") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/** CSV rows (template above) -> questions plus a list of row errors. */
export function questionsFromCsv(text) {
  const rows = parseCsv(text);
  const questions = [];
  const errors = [];
  rows.forEach((r, index) => {
    const line = index + 1;
    const type = typeFromWord(r[0]);
    if (!type) {
      if (index !== 0) errors.push(`السطر ${line}: نوع غير معروف "${r[0] || ""}"`);
      return; // the header row
    }
    const text = (r[1] || "").trim();
    const points = parseNumber(r[2]) || 1;
    const key3 = (r[3] || "").trim();
    const choices = r.slice(4, 10).map((x) => (x || "").trim());
    const explanation = (r[10] || "").trim();
    let q = blankQuestion(type);
    q = { ...q, questionText: text, points, explanation };
    if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
      const filled = choices.filter(Boolean);
      const correctIdx = key3.split(/[;،,\s]+/).map((n) => parseNumber(n)).filter((n) => n != null).map((n) => n - 1);
      q.answers = filled.map((t, i) => option(t, correctIdx.includes(i)));
    } else if (type === "TRUE_FALSE") {
      const isTrue = ["صح", "صحيح", "true", "1", "t"].includes(key3.toLowerCase());
      q.answers = [option("صح", isTrue), option("خطأ", !isTrue)];
    } else if (type === "SHORT_ANSWER") {
      q.answers = key3.split(/[;؛]/).map((t) => t.trim()).filter(Boolean).map((t) => option(t, true));
    } else if (type === "NUMERIC") {
      q.answers = [option(key3, true)];
      q.numericTolerance = choices[0] || "";
    }
    const problem = questionProblem(q);
    if (problem) errors.push(`السطر ${line}: ${problem}`);
    else questions.push(q);
  });
  return { questions, errors };
}

/** Bank item (server) -> editor question. */
export function fromBank(item) {
  return {
    key: key(),
    id: undefined,
    bankId: item.id,
    questionType: item.questionType,
    questionText: item.questionText,
    points: Number(item.points) || 1,
    explanation: item.explanation || "",
    imageId: item.imageId || null,
    numericTolerance: item.numericTolerance != null ? String(Number(item.numericTolerance)) : "",
    answers: (item.answers || []).map((a) => option(a.answerText, a.correct)),
  };
}

/** Editor question -> bank item request. */
export function toBankItem(q, extra = {}) {
  const r = questionToRequest(q);
  return {
    questionType: r.questionType,
    questionText: r.questionText,
    points: r.points,
    explanation: r.explanation,
    imageId: r.imageId,
    numericTolerance: r.numericTolerance,
    answers: r.answers.map((a) => ({ answerText: a.answerText, correct: a.correct })),
    ...extra,
  };
}

/** Countdown clock: 19:05 or 1:02:09. */
export const fmtClock = (seconds) => {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
};

/** A length of time in words: ٤٥ ث، ١٢ د ٥ ث، ١ س ٢٠ د. */
export const fmtDuration = (seconds) => {
  if (seconds == null) return "—";
  const s = Math.max(0, Math.round(seconds));
  const n = (v) => v.toLocaleString("ar-EG");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return m ? `${n(h)} س ${n(m)} د` : `${n(h)} س`;
  if (m) return sec ? `${n(m)} د ${n(sec)} ث` : `${n(m)} د`;
  return `${n(sec)} ث`;
};

export const fmtScore = (v) => (v == null ? "—" : `${Number(v).toLocaleString("ar-EG", { maximumFractionDigits: 1 })}%`);
export const fmtPoints = (v) => (v == null ? "—" : Number(v).toLocaleString("ar-EG", { maximumFractionDigits: 2 }));
