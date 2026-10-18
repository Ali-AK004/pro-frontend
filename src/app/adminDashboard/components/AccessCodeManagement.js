import React, { useState, useEffect, useMemo } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import { FiPlus, FiCode, FiCopy, FiDownload, FiX, FiTrash2, FiMail, FiCheckCircle, FiClock } from "react-icons/fi";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedTable, StatCard,
  Dialog, ConfirmDialog, Field, inputClass, usePaged, useDebounced, fmtNumber, fmtDate,
} from "../../components/ui";
import { fetchAllPages } from "../../utils/pageList";

const STATUS_OPTIONS = [
  { value: "false", label: "متاحة" },
  { value: "true", label: "مستخدمة" },
];

const today = () => new Date().toISOString().split("T")[0];

const AccessCodeManagement = () => {
  // Filters: nothing picked = every code
  const [search, setSearch] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const q = useDebounced(search.trim());

  const [lessons, setLessons] = useState([]);
  const [stats, setStats] = useState(null);

  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({ lessonId: "", count: 10, expiryDate: "" });
  const [generating, setGenerating] = useState(false);

  const [codeToDelete, setCodeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteUsed, setShowDeleteUsed] = useState(false);

  const [emailFor, setEmailFor] = useState(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters = {
    lessonId: lessonFilter || undefined,
    used: statusFilter || undefined,
    q: q || undefined,
  };

  const list = usePaged(
    (page, size) => adminAPI.accessCodes.list({ ...filters, page, size }),
    [lessonFilter, statusFilter, q],
    { size: 20, onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل أكواد الوصول")) }
  );

  const loadStats = () =>
    adminAPI.accessCodes
      .stats()
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));

  useEffect(() => {
    loadStats();
    // One request per 100 lessons (instead of one per course)
    adminAPI.lessons
      .options()
      .then((r) => setLessons(r.data || []))
      .catch((e) => toast.error(handleAPIError(e, "فشل في تحميل الدروس")));
  }, []);

  const lessonOptions = useMemo(
    () => lessons.map((l) => ({ value: l.id, label: l.courseName ? `${l.name} — ${l.courseName}` : l.name })),
    [lessons]
  );

  const refresh = () => {
    list.reload();
    loadStats();
  };

  // ---------------------------------------------------------------- actions
  const copy = (text, msg) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(msg),
      () => toast.error("تعذّر النسخ")
    );
  };

  // Copy / download use every code matching the current filters, not just this page
  const allMatching = () => fetchAllPages((p) => adminAPI.accessCodes.list(p), filters);

  const handleCopyAll = async () => {
    try {
      setExporting(true);
      const rows = await allMatching();
      if (!rows.length) return toast.info("لا توجد أكواد");
      copy(rows.map((r) => r.code).join("\n"), `تم نسخ ${fmtNumber(rows.length)} كود`);
    } catch (e) {
      toast.error(handleAPIError(e, "فشل في جلب الأكواد"));
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async () => {
    try {
      setExporting(true);
      const rows = await allMatching();
      if (!rows.length) return toast.info("لا توجد أكواد");
      const csv = ["code,lesson,status,expiry"]
        .concat(
          rows.map((r) =>
            [r.code, `"${(r.lessonName || "").replace(/"/g, '""')}"`, r.used ? "used" : "available", r.expiryDate || ""].join(",")
          )
        )
        .join("\n");
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `access-codes-${today()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(handleAPIError(e, "فشل في تحميل الأكواد"));
    } finally {
      setExporting(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const count = Math.min(100, Math.max(1, Number(generateForm.count) || 0));
    try {
      setGenerating(true);
      await adminAPI.accessCodes.generate(generateForm.lessonId, count, generateForm.expiryDate || null);
      toast.success(`تم إنشاء ${fmtNumber(count)} كود`);
      setShowGenerate(false);
      setGenerateForm({ lessonId: "", count: 10, expiryDate: "" });
      refresh();
    } catch (err) {
      toast.error(handleAPIError(err, "فشل في إنشاء الأكواد"));
    } finally {
      setGenerating(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await adminAPI.accessCodes.delete(codeToDelete.id);
      toast.success("تم حذف الكود");
      setCodeToDelete(null);
      refresh();
    } catch (err) {
      toast.error(handleAPIError(err, "فشل في حذف الكود"));
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteUsed = async () => {
    try {
      setDeleting(true);
      await adminAPI.accessCodes.deleteUsed();
      toast.success("تم حذف كل الأكواد المستخدمة");
      setShowDeleteUsed(false);
      refresh();
    } catch (err) {
      toast.error(handleAPIError(err, "فشل في حذف الأكواد المستخدمة"));
    } finally {
      setDeleting(false);
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      await adminAPI.accessCodes.sendByEmail(emailFor.id, email.trim());
      toast.success("تم إرسال الكود");
      setEmailFor(null);
      setEmail("");
    } catch (err) {
      toast.error(handleAPIError(err, "فشل في إرسال الكود"));
    } finally {
      setSending(false);
    }
  };

  // ---------------------------------------------------------------- table
  const columns = [
    {
      key: "code",
      label: "الكود",
      render: (r) => <code className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-800">{r.code}</code>,
    },
    {
      key: "lessonName",
      label: "الدرس",
      render: (r) => <span className="block max-w-[220px] truncate" title={r.lessonName}>{r.lessonName || "—"}</span>,
    },
    { key: "creatorName", label: "المنشئ", render: (r) => r.creatorName || "—" },
    {
      key: "used",
      label: "الحالة",
      render: (r) => (r.used ? <Badge tone="gray">مستخدم</Badge> : <Badge tone="success">متاح</Badge>),
    },
    { key: "createdAt", label: "الإنشاء", render: (r) => fmtDate(r.createdAt) },
    { key: "expiryDate", label: "الانتهاء", render: (r) => (r.expiryDate ? fmtDate(r.expiryDate) : "بدون") },
    {
      key: "actions",
      label: "",
      className: "w-px",
      render: (r) => (
        <div className="flex items-center gap-0.5">
          <IconButton label="نسخ" icon={FiCopy} onClick={() => copy(r.code, "تم نسخ الكود")} />
          {!r.used && <IconButton label="إرسال بالبريد" icon={FiMail} onClick={() => setEmailFor(r)} />}
          <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => setCodeToDelete(r)} />
        </div>
      ),
    },
  ];

  const filtered = search || lessonFilter || statusFilter;

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="أكواد الوصول"
        subtitle="كل الأكواد على المنصة، ابحث بالكود أو اختر درساً أو حالة"
        actions={
          <>
            <Button variant="secondary" onClick={handleCopyAll} loading={exporting}>
              <FiCopy /> نسخ
            </Button>
            <Button variant="secondary" onClick={handleDownload} loading={exporting}>
              <FiDownload /> تصدير CSV
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteUsed(true)}>
              <FiTrash2 /> حذف المستخدمة
            </Button>
            <Button onClick={() => setShowGenerate(true)}>
              <FiPlus /> أكواد جديدة
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatCard label="كل الأكواد" value={stats ? fmtNumber(stats.total) : "—"} icon={FiCode} />
        <StatCard label="متاحة" value={stats ? fmtNumber(stats.unused) : "—"} icon={FiClock} tone="success" />
        <StatCard label="مستخدمة" value={stats ? fmtNumber(stats.used) : "—"} icon={FiCheckCircle} tone="gray" />
      </div>

      <Toolbar
        actions={
          filtered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setLessonFilter("");
                setStatusFilter("");
              }}
            >
              <FiX /> مسح الفلاتر
            </Button>
          ) : null
        }
      >
        <SearchBox value={search} onChange={(v) => setSearch(v.slice(0, 60))} placeholder="ابحث بالكود أو اسم الدرس" />
        <Select value={lessonFilter} onChange={setLessonFilter} allLabel="كل الدروس" options={lessonOptions} />
        <Select value={statusFilter} onChange={setStatusFilter} allLabel="كل الحالات" options={STATUS_OPTIONS} />
      </Toolbar>

      <PagedTable
        list={list}
        columns={columns}
        empty={filtered ? "لا توجد أكواد مطابقة" : "لا توجد أكواد بعد"}
        emptyHint={filtered ? "جرّب تغيير الفلاتر" : "أنشئ أول مجموعة أكواد لدرس"}
      />

      {/* Generate */}
      <Dialog
        open={showGenerate}
        title="إنشاء أكواد وصول"
        onClose={() => setShowGenerate(false)}
        footer={
          <>
            <Button type="submit" form="generate-codes" loading={generating}>إنشاء الأكواد</Button>
            <Button variant="secondary" onClick={() => setShowGenerate(false)}>إلغاء</Button>
          </>
        }
      >
        <form id="generate-codes" onSubmit={handleGenerate} className="space-y-3">
          <Field label="الدرس">
            <select
              required
              value={generateForm.lessonId}
              onChange={(e) => setGenerateForm({ ...generateForm, lessonId: e.target.value })}
              className={inputClass}
            >
              <option value="">اختر الدرس</option>
              {lessonOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="عدد الأكواد" hint="من 1 إلى 100">
              <input
                type="number"
                required
                min="1"
                max="100"
                value={generateForm.count}
                onChange={(e) => setGenerateForm({ ...generateForm, count: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="تاريخ الانتهاء" hint="اختياري">
              <input
                type="date"
                min={today()}
                value={generateForm.expiryDate}
                onChange={(e) => setGenerateForm({ ...generateForm, expiryDate: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
        </form>
      </Dialog>

      {/* Send by email */}
      <Dialog
        open={!!emailFor}
        title="إرسال الكود بالبريد"
        onClose={() => setEmailFor(null)}
        footer={
          <>
            <Button type="submit" form="send-code" loading={sending}><FiMail /> إرسال</Button>
            <Button variant="secondary" onClick={() => setEmailFor(null)}>إلغاء</Button>
          </>
        }
      >
        <form id="send-code" onSubmit={sendEmail} className="space-y-3">
          <p className="text-xs text-slate-500">
            الكود <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">{emailFor?.code}</code> لدرس {emailFor?.lessonName}
          </p>
          <Field label="بريد الطالب">
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="student@example.com"
            />
          </Field>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!codeToDelete}
        title="حذف الكود"
        message={`سيتم حذف الكود ${codeToDelete?.code || ""} نهائياً ولن يمكن استخدامه.`}
        confirmLabel="حذف"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setCodeToDelete(null)}
      />

      <ConfirmDialog
        open={showDeleteUsed}
        title="حذف الأكواد المستخدمة"
        message={`سيتم حذف ${stats ? fmtNumber(stats.used) + " " : ""}كود مستخدم نهائياً.`}
        confirmLabel="حذف المستخدمة"
        danger
        busy={deleting}
        onConfirm={confirmDeleteUsed}
        onClose={() => setShowDeleteUsed(false)}
      />
    </div>
  );
};

export default AccessCodeManagement;
