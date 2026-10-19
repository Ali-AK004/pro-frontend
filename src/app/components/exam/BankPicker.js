"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Badge, Button, Dialog, EmptyState, Pager, SearchBox, Select, cx, usePaged, useDebounced } from "../ui";
import { bankApi, apiError } from "./examApi";
import { TypeBadge } from "./ExamBits";
import { QUESTION_TYPES, fromBank } from "./examModel";

export const DIFFICULTIES = [
  { value: "EASY", label: "سهل" },
  { value: "MEDIUM", label: "متوسط" },
  { value: "HARD", label: "صعب" },
];
export const difficultyLabel = (d) => DIFFICULTIES.find((x) => x.value === d)?.label;

/** Pick questions from the bank; onAdd(editorQuestions) gets copies (the bank stays unchanged). */
export default function BankPicker({ open, ownerId, onClose, onAdd }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selected, setSelected] = useState({});
  const query = useDebounced(q.trim());
  const list = usePaged(
    (page, size) => (open ? bankApi.list({ ownerId, q: query || undefined, type: type || undefined,
      difficulty: difficulty || undefined, page, size }) : Promise.resolve({ data: { content: [] } })),
    [open, ownerId, query, type, difficulty],
    { size: 10, onError: (e) => toast.error(apiError(e, "تعذر تحميل بنك الأسئلة")) }
  );
  const count = Object.keys(selected).length;
  const toggle = (item) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      return next;
    });
  const add = () => {
    const items = Object.values(selected);
    onAdd(items.map(fromBank));
    bankApi.used(items.map((i) => i.id)).catch(() => {});
    setSelected({});
  };

  return (
    <Dialog
      open={open}
      wide
      title="إضافة أسئلة من البنك"
      onClose={onClose}
      footer={
        <>
          <Button disabled={!count} onClick={add}>إضافة {count ? count.toLocaleString("ar-EG") : ""} سؤال</Button>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2 mb-3 [&>*]:w-full sm:[&>*]:w-auto">
        <SearchBox value={q} onChange={setQ} placeholder="ابحث في نص السؤال أو الوسوم" className="sm:flex-1" />
        <Select value={type} onChange={setType} allLabel="كل الأنواع" options={QUESTION_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
        <Select value={difficulty} onChange={setDifficulty} allLabel="كل المستويات" options={DIFFICULTIES} />
      </div>
      {list.loading && !list.rows.length ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}</div>
      ) : !list.rows.length ? (
        <EmptyState title="لا توجد أسئلة" hint="احفظ الأسئلة في البنك من محرر الامتحان أو من صفحة بنك الأسئلة" />
      ) : (
        <ul className={cx("space-y-1.5", list.loading && "opacity-60")}>
          {list.rows.map((item) => {
            const on = Boolean(selected[item.id]);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  className={cx(
                    "w-full text-right flex items-start gap-3 rounded-lg border p-2.5 transition-colors cursor-pointer",
                    on ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className={cx("mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px]",
                    on ? "bg-brand-600 border-brand-600 text-white" : "border-slate-300")}>{on ? "✓" : ""}</span>
                  <span className="flex-1 min-w-0">
                    <span dir="auto" className="block text-sm text-slate-800 line-clamp-2">{item.questionText}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <TypeBadge type={item.questionType} />
                      {item.difficulty ? <Badge>{difficultyLabel(item.difficulty)}</Badge> : null}
                      {item.tags ? item.tags.split(",").slice(0, 4).map((t) => <Badge key={t} tone="brand">{t}</Badge>) : null}
                      {item.timesUsed ? <span className="text-[11px] text-slate-400">استخدم {item.timesUsed.toLocaleString("ar-EG")} مرة</span> : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Pager page={list.page} size={list.size} total={list.total} onPage={list.setPage} />
    </Dialog>
  );
}
