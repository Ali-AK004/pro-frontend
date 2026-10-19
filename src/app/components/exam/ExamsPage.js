"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit2, FiBarChart2 } from "react-icons/fi";
import { Badge, Button, IconButton, PageHeader, PagedTable, SearchBox, Select, Toolbar, usePaged, useDebounced } from "../ui";
import { examApi, apiError } from "./examApi";
import { ExamStatusBadge } from "./ExamBits";
import ExamBuilder from "./ExamBuilder";
import ExamCenter from "./ExamCenter";
import { fmtScore } from "./examModel";

/**
 * Exams screen for admins (every teacher) and teachers/assistants (one teacher).
 * loadLessons(): Promise<[{ id, name, courseId, courseName, instructorId }]>
 * loadInstructors(): Promise<[{ id, fullname }]> (admins only, for the filter)
 */
export default function ExamsPage({ scope = "instructor", instructorId, loadLessons, loadInstructors }) {
  const admin = scope === "admin";
  const [lessons, setLessons] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacher, setTeacher] = useState("");
  const [centerId, setCenterId] = useState(null);
  const [centerKey, setCenterKey] = useState(0);
  const [builder, setBuilder] = useState(null); // { examId } or { examId: null } for a new exam
  const query = useDebounced(q.trim());

  useEffect(() => {
    loadLessons?.()
      .then((rows) => setLessons(Array.isArray(rows) ? rows : []))
      .catch((e) => toast.error(apiError(e, "تعذر تحميل الدروس")));
    if (admin) loadInstructors?.().then((rows) => setInstructors(Array.isArray(rows) ? rows : [])).catch(() => setInstructors([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, instructorId]);

  const list = usePaged(
    (page, size) => {
      const params = { q: query || undefined, courseId: courseId || undefined, page, size };
      if (admin) return examApi.listAll({ ...params, instructorId: teacher || undefined });
      if (!instructorId) return Promise.resolve({ data: { content: [] } });
      return examApi.listForInstructor(instructorId, params);
    },
    [admin, instructorId, query, courseId, teacher],
    { onError: (e) => toast.error(apiError(e, "تعذر تحميل الامتحانات")) }
  );

  // Courses from the lessons list (no extra request); admins see the chosen teacher's courses
  const courses = useMemo(() => {
    const map = new Map();
    lessons
      .filter((l) => !teacher || l.instructorId === teacher)
      .forEach((l) => l.courseId && !map.has(l.courseId) && map.set(l.courseId, l.courseName || "—"));
    return [...map].map(([value, label]) => ({ value, label }));
  }, [lessons, teacher]);

  const builderLessons = useMemo(
    () => (admin && teacher ? lessons.filter((l) => l.instructorId === teacher) : lessons),
    [admin, teacher, lessons]
  );

  const columns = [
    {
      key: "title", label: "الامتحان",
      render: (e) => (
        <div className="min-w-0 max-w-72">
          <p className="font-medium text-slate-900 truncate">{e.title}</p>
          <p className="text-[11px] text-slate-400 truncate">{e.lessonName}</p>
        </div>
      ),
    },
    { key: "courseName", label: "الكورس", render: (e) => <span className="text-slate-600">{e.courseName || "—"}</span> },
    ...(admin ? [{ key: "instructorName", label: "المدرس", render: (e) => e.instructorName || "—" }] : []),
    { key: "questionCount", label: "الأسئلة", render: (e) => Number(e.questionCount || 0).toLocaleString("ar-EG") },
    { key: "status", label: "الحالة", render: (e) => <ExamStatusBadge exam={e} /> },
    { key: "submissionCount", label: "المحاولات", render: (e) => Number(e.submissionCount || 0).toLocaleString("ar-EG") },
    {
      key: "pending", label: "تحتاج تصحيح",
      render: (e) => (e.pendingReviewCount ? <Badge tone="warning">{e.pendingReviewCount.toLocaleString("ar-EG")}</Badge> : <span className="text-slate-300">—</span>),
    },
    { key: "averageScore", label: "المتوسط", render: (e) => (e.averageScore != null ? fmtScore(e.averageScore) : "—") },
    {
      key: "actions", label: "",
      render: (e) => (
        <div className="flex gap-1 justify-end" onClick={(ev) => ev.stopPropagation()}>
          <IconButton label="النتائج والتحليل" icon={FiBarChart2} onClick={() => setCenterId(e.id)} />
          <IconButton label="تعديل" icon={FiEdit2} onClick={() => setBuilder({ examId: e.id })} />
        </div>
      ),
    },
  ];

  const closeBuilder = () => {
    setBuilder(null);
    list.reload();
    setCenterKey((k) => k + 1);
  };

  return (
    <div dir="rtl">
      {centerId ? (
        <ExamCenter
          key={`${centerId}:${centerKey}`}
          examId={centerId}
          lessons={lessons}
          onBack={() => { setCenterId(null); list.reload(); }}
          onEdit={(id) => setBuilder({ examId: id })}
          onChanged={() => list.reload()}
          onOpenExam={(id) => setCenterId(id)}
        />
      ) : (
        <>
          <PageHeader
            title="الامتحانات"
            subtitle="أنشئ الامتحانات وتابع نتائج الطلاب وصحح الأسئلة المقالية"
            actions={<Button onClick={() => setBuilder({ examId: null })}><FiPlus /> امتحان جديد</Button>}
          />
          <Toolbar>
            <SearchBox value={q} onChange={setQ} placeholder="ابحث بعنوان الامتحان أو الدرس" />
            {admin ? (
              <Select value={teacher} onChange={(v) => { setTeacher(v); setCourseId(""); }} allLabel="كل المدرسين"
                options={instructors.map((i) => ({ value: i.id, label: i.fullname || i.username || i.email }))} />
            ) : null}
            <Select value={courseId} onChange={setCourseId} allLabel="كل الكورسات" options={courses} />
          </Toolbar>
          <PagedTable
            list={list}
            columns={columns}
            onRowClick={(e) => setCenterId(e.id)}
            empty="لا توجد امتحانات"
            emptyHint="أنشئ أول امتحان واربطه بدرس، ويظهر للطلاب بعد النشر"
          />
        </>
      )}

      {builder ? (
        <ExamBuilder
          key={builder.examId || "new"}
          examId={builder.examId}
          lessons={builderLessons}
          onClose={closeBuilder}
          onSaved={() => list.reload()}
        />
      ) : null}
    </div>
  );
}
