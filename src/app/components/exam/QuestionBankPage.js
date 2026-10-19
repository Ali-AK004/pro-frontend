"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit2, FiTrash2, FiUpload } from "react-icons/fi";
import {
  Badge, Button, ConfirmDialog, Dialog, Field, IconButton, PageHeader, PagedTable, SearchBox, Select, Toolbar,
  cx, fmtDate, inputClass, usePaged, useDebounced,
} from "../ui";
import { bankApi, apiError } from "./examApi";
import { TypeBadge } from "./ExamBits";
import QuestionEditor from "./QuestionEditor";
import CsvImportDialog from "./CsvImportDialog";
import { DIFFICULTIES, difficultyLabel } from "./BankPicker";
import { QUESTION_TYPES, blankQuestion, fmtPoints, fromBank, questionProblem, toBankItem } from "./examModel";

/**
 * Reusable questions of one teacher (shared with their assistants). Admins pick whose bank;
 * without a pick they see their own. loadInstructors(): Promise<[{ id, fullname }]> (admins only).
 */
export default function QuestionBankPage({ scope = "instructor", loadInstructors }) {
  const admin = scope === "admin";
  const [instructors, setInstructors] = useState([]);
  const [ownerId, setOwnerId] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");
  const [editing, setEditing] = useState(null); // { item?, question, tags, difficulty }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const query = useDebounced(q.trim());
  const tagQuery = useDebounced(tag.trim());

  useEffect(() => {
    if (admin) loadInstructors?.().then((rows) => setInstructors(Array.isArray(rows) ? rows : [])).catch(() => setInstructors([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const owner = ownerId || undefined;
  const list = usePaged(
    (page, size) => bankApi.list({ ownerId: owner, q: query || undefined, type: type || undefined,
      difficulty: difficulty || undefined, tag: tagQuery || undefined, page, size }),
    [owner, query, type, difficulty, tagQuery],
    { onError: (e) => toast.error(apiError(e, "تعذر تحميل بنك الأسئلة")) }
  );

  const openNew = () => {
    setError(null);
    setEditing({ question: blankQuestion("SINGLE_CHOICE"), tags: "", difficulty: "" });
  };
  const openEdit = (item) => {
    setError(null);
    setEditing({ item, question: fromBank(item), tags: item.tags || "", difficulty: item.difficulty || "" });
  };

  const save = async () => {
    const problem = questionProblem(editing.question);
    if (problem) {
      setError(problem);
      return;
    }
    const body = toBankItem(editing.question, { tags: editing.tags.trim() || undefined, difficulty: editing.difficulty || undefined });
    setSaving(true);
    try {
      if (editing.item) {
        await bankApi.update(editing.item.id, body);
        toast.success("تم حفظ السؤال");
      } else {
        const { data } = await bankApi.create([body], owner);
        if (Array.isArray(data) && !data.length) toast.info("هذا السؤال موجود في البنك بالفعل");
        else toast.success("تم حفظ السؤال");
      }
      setEditing(null);
      list.reload();
    } catch (e) {
      setError(apiError(e, "تعذر حفظ السؤال"));
    } finally {
      setSaving(false);
    }
  };

  const importCsv = async (questions) => {
    try {
      const { data } = await bankApi.create(questions.map((x) => toBankItem(x)), owner);
      const n = Array.isArray(data) ? data.length : questions.length;
      const skipped = questions.length - n;
      if (!n) toast.info("كل الأسئلة موجودة في البنك بالفعل");
      else toast.success(`تمت إضافة ${n.toLocaleString("ar-EG")} سؤال إلى البنك` + (skipped > 0 ? `، وتم تخطي ${skipped.toLocaleString("ar-EG")} مكرر` : ""));
      list.reload();
    } catch (e) {
      toast.error(apiError(e, "تعذر الاستيراد"));
    }
  };

  const remove = async () => {
    try {
      await bankApi.remove(removing.id);
      toast.success("تم حذف السؤال من البنك");
      list.reload();
    } catch (e) {
      toast.error(apiError(e, "تعذر الحذف"));
    } finally {
      setRemoving(null);
    }
  };

  const columns = [
    {
      key: "questionText", label: "السؤال",
      render: (item) => (
        <div className="min-w-0 max-w-[28rem] whitespace-normal">
          <p dir="auto" className="text-slate-800 line-clamp-2">{item.questionText}</p>
          {item.tags ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.tags.split(",").slice(0, 5).map((t) => (
                <button key={t} type="button" onClick={(e) => { e.stopPropagation(); setTag(t); }}
                  className="cursor-pointer"><Badge tone="brand">{t}</Badge></button>
              ))}
            </div>
          ) : null}
        </div>
      ),
    },
    { key: "type", label: "النوع", render: (item) => <TypeBadge type={item.questionType} /> },
    { key: "difficulty", label: "المستوى", render: (item) => (item.difficulty ? difficultyLabel(item.difficulty) : "—") },
    { key: "points", label: "الدرجة", render: (item) => fmtPoints(item.points) },
    { key: "timesUsed", label: "استُخدم", render: (item) => `${Number(item.timesUsed || 0).toLocaleString("ar-EG")} مرة` },
    { key: "updatedAt", label: "آخر تعديل", render: (item) => <span className="text-xs text-slate-500">{fmtDate(item.updatedAt)}</span> },
    {
      key: "actions", label: "",
      render: (item) => (
        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <IconButton label="تعديل" icon={FiEdit2} onClick={() => openEdit(item)} />
          <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => setRemoving(item)} />
        </div>
      ),
    },
  ];

  return (
    <div dir="rtl">
      <PageHeader
        title="بنك الأسئلة"
        subtitle="أسئلة جاهزة تضيفها لأي امتحان بضغطة. التعديل هنا لا يغيّر الامتحانات التي استخدمتها."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCsvOpen(true)}><FiUpload /> استيراد</Button>
            <Button onClick={openNew}><FiPlus /> سؤال جديد</Button>
          </>
        }
      />
      <Toolbar>
        {admin ? (
          <Select value={ownerId} onChange={setOwnerId} allLabel="بنكي"
            options={instructors.map((i) => ({ value: i.id, label: `بنك ${i.fullname || i.username || i.email}` }))} />
        ) : null}
        <SearchBox value={q} onChange={setQ} placeholder="ابحث في نص السؤال" />
        <Select value={type} onChange={setType} allLabel="كل الأنواع" options={QUESTION_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
        <Select value={difficulty} onChange={setDifficulty} allLabel="كل المستويات" options={DIFFICULTIES} />
        <input className={inputClass} placeholder="وسم (مثال: الوحدة 1)" value={tag} onChange={(e) => setTag(e.target.value)} />
      </Toolbar>
      <PagedTable list={list} columns={columns} onRowClick={openEdit} empty="البنك فارغ"
        emptyHint="أضف أسئلة هنا، أو احفظها من محرر الامتحان بزر الإشارة المرجعية" />

      <Dialog
        open={Boolean(editing)}
        wide
        closeOnBackdrop={false}
        title={editing?.item ? "تعديل سؤال" : "سؤال جديد"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button loading={saving} onClick={save}>حفظ</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-3">
            <QuestionEditor value={editing.question} error={error}
              onChange={(question) => { setEditing((s) => ({ ...s, question })); setError(null); }} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="الوسوم" hint="مفصولة بفاصلة، مثل: الجبر، الوحدة 2">
                <input dir="auto" className={inputClass} maxLength={300} value={editing.tags}
                  onChange={(e) => setEditing((s) => ({ ...s, tags: e.target.value }))} />
              </Field>
              <Field label="المستوى">
                <select className={cx(inputClass, "cursor-pointer")} value={editing.difficulty}
                  onChange={(e) => setEditing((s) => ({ ...s, difficulty: e.target.value }))}>
                  <option value="">بدون</option>
                  {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </Field>
            </div>
          </div>
        ) : null}
      </Dialog>

      <CsvImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} onAdd={importCsv} />
      <ConfirmDialog open={Boolean(removing)} title="حذف من البنك"
        message="يُحذف السؤال من البنك فقط، والامتحانات التي استخدمته لا تتأثر." confirmLabel="حذف" danger
        onConfirm={remove} onClose={() => setRemoving(null)} />
    </div>
  );
}
