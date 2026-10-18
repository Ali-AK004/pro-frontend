import React, { useState, useEffect, useMemo } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { toast } from "react-toastify";
import { FiCode, FiCopy, FiDownload, FiX, FiCheckCircle, FiClock } from "react-icons/fi";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedTable, StatCard,
  usePaged, useDebounced, fmtNumber, fmtDate,
} from "../../components/ui";
import { fetchAllPages } from "../../utils/pageList";

const STATUS_OPTIONS = [
  { value: "false", label: "متاحة" },
  { value: "true", label: "مستخدمة" },
];

const InstructorAccessCodeManagement = () => {
  const { user } = useUserData();
  const instructorId = user?.instructorId || user?.id;

  const [search, setSearch] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const q = useDebounced(search.trim());

  const [lessons, setLessons] = useState([]);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);

  const filters = {
    lessonId: lessonFilter || undefined,
    used: statusFilter || undefined,
    q: q || undefined,
  };

  const list = usePaged(
    (page, size) =>
      instructorId
        ? instructorAPI.accessCodes.list(instructorId, { ...filters, page, size })
        : Promise.resolve({ data: { content: [], totalElements: 0 } }),
    [instructorId, lessonFilter, statusFilter, q],
    { size: 20, onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل أكواد الوصول")) }
  );

  useEffect(() => {
    if (!instructorId) return;
    instructorAPI.accessCodes
      .stats(instructorId)
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
    fetchAllPages((p) => instructorAPI.lessons.list(instructorId, p))
      .then(setLessons)
      .catch((e) => toast.error(handleAPIError(e, "فشل في تحميل الدروس")));
  }, [instructorId]);

  const lessonOptions = useMemo(
    () => lessons.map((l) => ({ value: l.id, label: l.courseName ? `${l.name} — ${l.courseName}` : l.name })),
    [lessons]
  );

  const copy = (text, msg) =>
    navigator.clipboard.writeText(text).then(
      () => toast.success(msg),
      () => toast.error("تعذّر النسخ")
    );

  // Export the available (unused) codes that match the current filters, across all pages
  const exportUnused = async (mode) => {
    try {
      setExporting(true);
      const rows = await fetchAllPages((p) => instructorAPI.accessCodes.list(instructorId, p), {
        ...filters,
        used: "false",
      });
      if (!rows.length) return toast.info("لا توجد أكواد متاحة");
      if (mode === "copy") return copy(rows.map((r) => r.code).join("\n"), `تم نسخ ${fmtNumber(rows.length)} كود`);
      const csv = ["code,lesson,expiry"]
        .concat(rows.map((r) => [r.code, `"${(r.lessonName || "").replace(/"/g, '""')}"`, r.expiryDate || ""].join(",")))
        .join("\n");
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "access-codes.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(handleAPIError(e, "فشل في جلب الأكواد"));
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: "code",
      label: "الكود",
      render: (r) => <code className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-800">{r.code}</code>,
    },
    {
      key: "lessonName",
      label: "الدرس",
      render: (r) => <span className="block max-w-[240px] truncate" title={r.lessonName}>{r.lessonName || "—"}</span>,
    },
    {
      key: "used",
      label: "الحالة",
      render: (r) => (r.used ? <Badge tone="gray">مستخدم</Badge> : <Badge tone="success">متاح</Badge>),
    },
    { key: "usedAt", label: "تاريخ الاستخدام", render: (r) => (r.usedAt ? fmtDate(r.usedAt) : "—") },
    { key: "expiryDate", label: "الانتهاء", render: (r) => (r.expiryDate ? fmtDate(r.expiryDate) : "بدون") },
    {
      key: "actions",
      label: "",
      className: "w-px",
      render: (r) => <IconButton label="نسخ" icon={FiCopy} onClick={() => copy(r.code, "تم نسخ الكود")} />,
    },
  ];

  const filtered = search || lessonFilter || statusFilter;

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="أكواد الوصول"
        subtitle="أكواد دروسك، ابحث بالكود أو اختر درساً أو حالة"
        actions={
          <>
            <Button variant="secondary" onClick={() => exportUnused("copy")} loading={exporting}>
              <FiCopy /> نسخ المتاحة
            </Button>
            <Button variant="secondary" onClick={() => exportUnused("csv")} loading={exporting}>
              <FiDownload /> تصدير المتاحة
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
        emptyHint={filtered ? "جرّب تغيير الفلاتر" : "تُنشأ الأكواد من إدارة المنصة"}
      />
    </div>
  );
};

export default InstructorAccessCodeManagement;
