"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiAlertTriangle, FiCheckCircle, FiLock, FiLogOut, FiRotateCcw, FiUnlock, FiXCircle } from "react-icons/fi";
import { securityAPI } from "@/app/services/securityAPI";
import { apiMessage } from "@/app/services/commerceAPI";
import {
  Badge, Button, Card, DataTable, Dialog, Field, IconButton, PageHeader, PagedTable, StatCard, Tabs,
  fmtDateTime, inputClass, usePaged,
} from "@/app/components/ui";

const GROUPS = {
  access: "الدروس والفيديو",
  money: "المالية",
  exams: "الامتحانات",
  ai: "المساعد الذكي",
  login: "تسجيل الدخول",
};

const ACTIONS = {
  VIEW_AS_START: "بدء عرض كمستخدم",
  VIEW_AS_STOP: "إنهاء العرض",
  SETTINGS_UPDATE: "تغيير الإعدادات",
  ACCOUNT_LOCKED: "قفل حساب (محاولات خاطئة)",
  USER_UNLOCK: "فك قفل حساب",
  FORCE_SIGN_OUT: "تسجيل خروج مستخدم",
  SIGN_OUT_EVERYONE: "تسجيل خروج الجميع",
  CREATE_STAFF: "إضافة عضو إدارة",
  SET_STAFF_ENABLED: "إيقاف/تفعيل عضو إدارة",
  UPDATE_STAFF_PERMISSIONS: "تعديل صلاحيات",
  UPDATE_USER_PASSWORD: "تغيير كلمة مرور مستخدم",
  DELETE_USER: "حذف مستخدم",
  ADJUST_WALLET: "تعديل محفظة",
};

const STATUS = {
  ok: { icon: FiCheckCircle, cls: "text-emerald-600", badge: <Badge tone="success">سليم</Badge> },
  warn: { icon: FiAlertTriangle, cls: "text-amber-600", badge: <Badge tone="warning">تنبيه</Badge> },
  bad: { icon: FiXCircle, cls: "text-red-600", badge: <Badge tone="danger">خطر</Badge> },
};

const onError = (fallback) => (e) => toast.error(apiMessage(e, fallback));

/** Super admins: business settings (no restart needed) and the security page. */
export default function SettingsSecurityPage() {
  const [tab, setTab] = useState("settings");
  return (
    <div className="py-6" dir="rtl">
      <PageHeader
        title="الإعدادات والأمان"
        subtitle="قواعد المنصة تُطبق فوراً دون إعادة تشغيل، وكل تغيير يُسجل. المفاتيح السرية تبقى على السيرفر ولا تظهر هنا."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "settings", label: "الإعدادات" },
          { id: "security", label: "حالة الأمان" },
          { id: "accounts", label: "الحسابات والجلسات" },
          { id: "events", label: "أحداث الأمان" },
        ]}
      />
      {tab === "settings" && <SettingsTab />}
      {tab === "security" && <SecurityTab />}
      {tab === "accounts" && <AccountsTab />}
      {tab === "events" && <EventsTab />}
    </div>
  );
}

// ------------------------------------------------------------------ settings

function SettingsTab() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const apply = (list) => {
    setRows(list);
    setDraft(Object.fromEntries(list.map((s) => [s.key, s.value])));
  };

  useEffect(() => {
    securityAPI.settings().then(({ data }) => apply(data)).catch(onError("تعذر تحميل الإعدادات")).finally(() => setLoading(false));
  }, []);

  const changed = useMemo(() => rows.filter((s) => String(draft[s.key]) !== String(s.value)), [rows, draft]);

  const errorOf = (s) => {
    const v = draft[s.key];
    if (s.type === "BOOL") return null;
    if (v === "" || v === undefined || isNaN(Number(v))) return "أدخل رقماً";
    if (s.type === "INT" && !Number.isInteger(Number(v))) return "رقم صحيح فقط";
    if (Number(v) < Number(s.min) || Number(v) > Number(s.max)) return `من ${s.min} إلى ${s.max}`;
    return null;
  };
  const invalid = rows.some((s) => errorOf(s));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await securityAPI.saveSettings(Object.fromEntries(changed.map((s) => [s.key, draft[s.key]])));
      apply(data);
      toast.success("تم حفظ الإعدادات وتطبيقها");
    } catch (e) {
      onError("تعذر حفظ الإعدادات")(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card><p className="text-sm text-slate-500">جارٍ التحميل...</p></Card>;

  const groups = Object.keys(GROUPS).map((g) => [g, rows.filter((s) => s.group === g)]).filter(([, list]) => list.length);

  return (
    <div className="space-y-4 pb-20">
      <div className="grid lg:grid-cols-2 gap-4">
        {groups.map(([g, list]) => (
          <Card key={g} title={GROUPS[g]}>
            <div className="space-y-4">
              {list.map((s) => (
                <SettingRow key={s.key} s={s} value={draft[s.key]} error={errorOf(s)}
                  onChange={(v) => setDraft((d) => ({ ...d, [s.key]: v }))} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {changed.length ? (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 bg-white border border-slate-200 shadow-lg rounded-xl px-4 py-3">
          <p className="text-sm text-slate-600">{changed.length} تغيير غير محفوظ</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => apply(rows)}>تراجع</Button>
            <Button loading={saving} disabled={invalid} onClick={save}>حفظ وتطبيق</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SettingRow({ s, value, error, onChange }) {
  const isDefault = String(value) === String(s.defaultValue);
  const reset = isDefault ? null : (
    <IconButton label={`الرجوع للقيمة الافتراضية (${s.type === "BOOL" ? (s.defaultValue === "true" ? "مفعّل" : "متوقف") : s.defaultValue})`}
      icon={FiRotateCcw} onClick={() => onChange(s.defaultValue)} />
  );

  if (s.type === "BOOL") {
    const on = value === "true";
    return (
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{s.label}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.hint}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {reset}
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={s.label}
            onClick={() => onChange(on ? "false" : "true")}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${on ? "bg-brand-600" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "right-0.5" : "right-[18px]"}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Field label={s.label} hint={error ? null : `${s.hint} · المسموح ${s.min}–${s.max}`} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={s.type === "INT" ? 1 : 0.01}
          min={s.min}
          max={s.max}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} max-w-32`}
          dir="ltr"
        />
        {s.unit ? <span className="text-sm text-slate-500">{s.unit}</span> : null}
        {reset}
      </div>
    </Field>
  );
}

// ------------------------------------------------------------------ security posture

function SecurityTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    securityAPI.overview().then(({ data }) => setData(data)).catch(onError("تعذر تحميل حالة الأمان"));
  }, []);

  if (!data) return <Card><p className="text-sm text-slate-500">جارٍ التحميل...</p></Card>;

  const count = (st) => data.checks.filter((c) => c.status === st).length;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-3">
        <StatCard label="فحوص سليمة" value={count("ok")} icon={FiCheckCircle} tone="success" />
        <StatCard label="تنبيهات" value={count("warn")} icon={FiAlertTriangle} tone="warning" />
        <StatCard label="مشاكل خطيرة" value={count("bad")} icon={FiXCircle} tone="danger" />
        <StatCard label="حسابات مقفولة الآن" value={data.lockedAccounts} icon={FiLock} tone="brand" />
      </div>

      <Card title="إعدادات السيرفر" padded={false}>
        <ul className="divide-y divide-slate-100">
          {data.checks.map((c) => {
            const st = STATUS[c.status] || STATUS.warn;
            const Icon = st.icon;
            return (
              <li key={c.key} className="flex items-start gap-3 px-4 py-3">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${st.cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{c.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 break-words">{c.detail}</p>
                </div>
                {st.badge}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="آخر دخول لأعضاء الإدارة" padded={false}>
        <DataTable
          rows={data.staff}
          empty="لا يوجد أعضاء"
          columns={[
            { key: "name", label: "العضو", render: (m) => (
              <div>
                <div className="font-medium text-slate-800">{m.fullname || "—"}</div>
                <div className="text-xs text-slate-400" dir="ltr">{m.email}</div>
              </div>) },
            { key: "role", label: "النوع", render: (m) => (m.superAdmin ? <Badge tone="brand">مدير عام</Badge> : <Badge tone="gray">مشرف</Badge>) },
            { key: "enabled", label: "الحالة", render: (m) => (m.enabled ? <Badge tone="success">مفعّل</Badge> : <Badge tone="danger">موقوف</Badge>) },
            { key: "lastLoginAt", label: "آخر دخول", render: (m) => fmtDateTime(m.lastLoginAt) },
            { key: "lastLoginIp", label: "من عنوان", render: (m) => <span dir="ltr" className="text-xs text-slate-500">{m.lastLoginIp || "—"}</span> },
          ]}
        />
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ accounts and sessions

function AccountsTab() {
  const [busy, setBusy] = useState(null);
  const [everyone, setEveryone] = useState(false);
  const locked = usePaged((p, s) => securityAPI.lockedUsers(p, s), [], { onError: onError("تعذر تحميل الحسابات المقفولة") });

  const run = async (key, fn, ok) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      locked.reload();
    } catch (e) {
      onError("تعذر تنفيذ العملية")(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">حسابات مقفولة بسبب محاولات دخول خاطئة</h3>
        <p className="text-xs text-slate-500 mb-3">تُفتح تلقائياً بعد انتهاء مدة القفل، أو افتحها الآن بعد التأكد من هوية صاحب الحساب.</p>
        <PagedTable
          list={locked}
          empty="لا توجد حسابات مقفولة"
          columns={[
            { key: "name", label: "المستخدم", render: (u) => (
              <div>
                <div className="font-medium text-slate-800">{u.fullname || "—"}</div>
                <div className="text-xs text-slate-400" dir="ltr">{u.email}</div>
              </div>) },
            { key: "lockedUntil", label: "مقفول حتى", render: (u) => fmtDateTime(u.lockedUntil) },
            { key: "actions", label: "", render: (u) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" loading={busy === `u-${u.id}`}
                  onClick={() => run(`u-${u.id}`, () => securityAPI.unlock(u.id), "تم فتح الحساب")}>
                  <FiUnlock /> فتح
                </Button>
                <Button size="sm" variant="ghost" loading={busy === `s-${u.id}`}
                  onClick={() => run(`s-${u.id}`, () => securityAPI.signOutUser(u.id), "تم تسجيل خروجه من كل الأجهزة")}>
                  <FiLogOut /> خروج من كل الأجهزة
                </Button>
              </div>) },
          ]}
        />
        <p className="text-xs text-slate-400 mt-2">لتسجيل خروج أي مستخدم آخر من كل أجهزته استخدم زر الخروج في صفحة المستخدمين.</p>
      </div>

      <Card title="الطوارئ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">تسجيل خروج جميع المستخدمين</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              عند الاشتباه في تسريب كلمة مرور أو جلسة: كل الحسابات (طلاب ومدرسين وإدارة) تحتاج لتسجيل الدخول من جديد. أنت تبقى مسجلاً.
            </p>
          </div>
          <Button variant="danger" onClick={() => setEveryone(true)} className="shrink-0"><FiLogOut /> تسجيل خروج الجميع</Button>
        </div>
      </Card>

      <SignOutEveryoneDialog open={everyone} onClose={() => setEveryone(false)} />
    </div>
  );
}

const PHRASE = "SIGN OUT EVERYONE";

function SignOutEveryoneDialog({ open, onClose }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const go = async () => {
    setBusy(true);
    try {
      const { data } = await securityAPI.signOutEveryone(text);
      toast.success(`تم تسجيل خروج ${data.signedOut} حساب`);
      onClose();
    } catch (e) {
      onError("تعذر تنفيذ العملية")(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      title="تسجيل خروج الجميع"
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="danger" loading={busy} disabled={text.trim() !== PHRASE} onClick={go}>تأكيد</Button>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed mb-3">
        سيُطلب من كل مستخدم تسجيل الدخول من جديد، ويُسجل الإجراء باسمك. لا يمكن التراجع عنه.
      </p>
      <Field label={<>اكتب <span dir="ltr" className="font-mono font-semibold">{PHRASE}</span> للتأكيد</>}>
        <input className={inputClass} dir="ltr" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      </Field>
    </Dialog>
  );
}

// ------------------------------------------------------------------ events

function EventsTab() {
  const events = usePaged((p, s) => securityAPI.events(p, s), [], { onError: onError("تعذر تحميل الأحداث") });
  return (
    <PagedTable
      list={events}
      empty="لا توجد أحداث بعد"
      columns={[
        { key: "timestamp", label: "الوقت", render: (e) => <span className="whitespace-nowrap">{fmtDateTime(e.timestamp)}</span> },
        { key: "action", label: "الحدث", render: (e) => (
          <Badge tone={e.action === "ACCOUNT_LOCKED" || e.action === "SIGN_OUT_EVERYONE" || e.action === "DELETE_USER" ? "danger" : "gray"}>
            {ACTIONS[e.action] || e.action}
          </Badge>) },
        { key: "actor", label: "بواسطة", render: (e) => e.actor || <span className="text-slate-400">النظام</span> },
        { key: "target", label: "على", render: (e) => e.target || "—" },
        { key: "details", label: "التفاصيل", render: (e) => <span className="text-xs text-slate-500 break-words" dir="auto">{e.details || "—"}</span> },
        { key: "ipAddress", label: "العنوان", render: (e) => <span dir="ltr" className="text-xs text-slate-400">{e.ipAddress || "—"}</span> },
      ]}
    />
  );
}
