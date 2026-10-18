"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiShield } from "react-icons/fi";
import { staffAPI } from "@/app/services/staffAPI";
import { apiMessage } from "@/app/services/commerceAPI";
import { PERMISSIONS } from "../permissions";
import { Badge, Button, Card, DataTable, Dialog, Field, PageHeader, fmtDateTime, inputClass } from "@/app/components/ui";

const EMPTY = { fullname: "", email: "", phoneNumber: "", password: "", superAdmin: false, permissions: [] };

/** Super admins: the admin team, what each member may do, and turning accounts off. */
export default function StaffPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await staffAPI.list();
      setRows(data);
    } catch (e) {
      toast.error(apiMessage(e, "تعذر تحميل فريق الإدارة"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="py-6" dir="rtl">
      <PageHeader
        title="فريق الإدارة"
        subtitle="من يدخل لوحة الإدارة وماذا يستطيع أن يفعل. المدير العام يملك كل الصلاحيات."
        actions={<Button onClick={() => setCreating(true)}><FiPlus /> إضافة عضو</Button>}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {Object.entries(PERMISSIONS).map(([k, p]) => (
          <div key={k} className="p-4 rounded-2xl bg-white border border-slate-200/80">
            <p className="font-semibold text-slate-800 text-sm">{p.label}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.description}</p>
          </div>
        ))}
      </div>

      <Card padded={false}>
        <DataTable
          loading={loading}
          rows={rows}
          empty="لا يوجد أعضاء"
          columns={[
            { key: "name", label: "العضو", render: (m) => (
              <div>
                <div className="font-medium text-slate-800">{m.fullname || "—"} {m.you ? <Badge tone="gray">أنت</Badge> : null}</div>
                <div className="text-xs text-slate-400" dir="ltr">{m.email}</div>
              </div>) },
            { key: "role", label: "الصلاحيات", render: (m) => m.superAdmin
                ? <Badge tone="brand"><FiShield className="ml-1" /> مدير عام</Badge>
                : <div className="flex flex-wrap gap-1">{m.permissions.map((p) => <Badge key={p} tone="gray">{PERMISSIONS[p]?.label || p}</Badge>)}</div> },
            { key: "enabled", label: "الحالة", render: (m) => (m.enabled ? <Badge tone="success">مفعّل</Badge> : <Badge tone="danger">موقوف</Badge>) },
            { key: "lastLoginAt", label: "آخر دخول", render: (m) => fmtDateTime(m.lastLoginAt) },
            { key: "actions", label: "", render: (m) => m.you ? null : (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(m)}>تعديل الصلاحيات</Button>
                <Button size="sm" variant={m.enabled ? "ghost" : "secondary"} onClick={() => setToggling(m)}>
                  {m.enabled ? "إيقاف" : "تفعيل"}
                </Button>
              </div>) },
          ]}
        />
      </Card>

      <CreateDialog open={creating} onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); }} />
      <EditDialog member={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />
      <ToggleDialog member={toggling} onClose={() => setToggling(null)} onDone={() => { setToggling(null); load(); }} />
    </div>
  );
}

function PermissionPicker({ value, onChange }) {
  const toggle = (k) =>
    onChange({ ...value, permissions: value.permissions.includes(k) ? value.permissions.filter((p) => p !== k) : [...value.permissions, k] });
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50/50">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-brand-600" checked={value.superAdmin}
          onChange={(e) => onChange({ ...value, superAdmin: e.target.checked })} />
        <span>
          <span className="block font-medium text-slate-800">مدير عام</span>
          <span className="block text-xs text-slate-500">كل الصلاحيات، بالإضافة لإدارة الفريق وحذف الحسابات وأدوات النظام. امنحه لعدد قليل جدًا.</span>
        </span>
      </label>
      {!value.superAdmin ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {Object.entries(PERMISSIONS).map(([k, p]) => (
            <label key={k} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50/50">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-brand-600" checked={value.permissions.includes(k)} onChange={() => toggle(k)} />
              <span>
                <span className="block font-medium text-slate-800 text-sm">{p.label}</span>
                <span className="block text-xs text-slate-500">{p.description}</span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const randomPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(16));
  let p = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return p.slice(0, 13) + "-" + (bytes[0] % 90 + 10);
};

function CreateDialog({ open, onClose, onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setForm(EMPTY); }, [open]);
  const valid = form.fullname.trim() && form.email.trim() && form.password.length >= 12 && (form.superAdmin || form.permissions.length);

  const submit = async () => {
    setBusy(true);
    try {
      await staffAPI.create({ ...form, permissions: form.superAdmin ? [] : form.permissions });
      toast.success("تمت إضافة العضو. أرسل له البريد وكلمة المرور بطريقة آمنة.");
      onDone();
    } catch (e) {
      toast.error(apiMessage(e, "تعذرت الإضافة"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title="إضافة عضو لفريق الإدارة" onClose={onClose} wide
      footer={<><Button onClick={submit} loading={busy} disabled={!valid}>إضافة</Button><Button variant="secondary" onClick={onClose}>إلغاء</Button></>}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="الاسم"><input className={inputClass} value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} /></Field>
          <Field label="البريد الإلكتروني"><input className={inputClass} dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="الهاتف (اختياري)"><input className={inputClass} dir="ltr" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></Field>
          <Field label="كلمة المرور" hint="12 حرفًا على الأقل، حروف وأرقام">
            <div className="flex gap-2">
              <input className={inputClass} dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <Button variant="secondary" onClick={() => setForm({ ...form, password: randomPassword() })}>توليد</Button>
            </div>
          </Field>
        </div>
        <PermissionPicker value={form} onChange={setForm} />
      </div>
    </Dialog>
  );
}

function EditDialog({ member, onClose, onDone }) {
  const [form, setForm] = useState({ superAdmin: false, permissions: [] });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (member) setForm({ superAdmin: member.superAdmin, permissions: member.superAdmin ? [] : member.permissions });
  }, [member]);

  const submit = async () => {
    setBusy(true);
    try {
      await staffAPI.update(member.id, form.superAdmin, form.superAdmin ? [] : form.permissions);
      toast.success("تم حفظ الصلاحيات. تُطبّق فورًا.");
      onDone();
    } catch (e) {
      toast.error(apiMessage(e, "تعذر الحفظ"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!member} title={`صلاحيات ${member?.fullname || ""}`} onClose={onClose} wide
      footer={<><Button onClick={submit} loading={busy} disabled={!form.superAdmin && !form.permissions.length}>حفظ</Button><Button variant="secondary" onClick={onClose}>إلغاء</Button></>}>
      <PermissionPicker value={form} onChange={setForm} />
    </Dialog>
  );
}

function ToggleDialog({ member, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const disabling = member?.enabled;
  const submit = async () => {
    setBusy(true);
    try {
      await staffAPI.setEnabled(member.id, !disabling);
      toast.success(disabling ? "تم إيقاف الحساب وتسجيل خروجه من كل الأجهزة" : "تم تفعيل الحساب");
      onDone();
    } catch (e) {
      toast.error(apiMessage(e, "تعذر التنفيذ"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!member} title={disabling ? "إيقاف الحساب" : "تفعيل الحساب"} onClose={onClose}
      footer={<><Button variant={disabling ? "danger" : "primary"} onClick={submit} loading={busy}>{disabling ? "إيقاف" : "تفعيل"}</Button><Button variant="secondary" onClick={onClose}>إلغاء</Button></>}>
      <p className="text-sm text-slate-600">
        {disabling
          ? <>سيتم إيقاف حساب <b>{member?.fullname}</b> وتسجيل خروجه فورًا من كل الأجهزة. يمكنك إعادة تفعيله لاحقًا.</>
          : <>سيتمكن <b>{member?.fullname}</b> من الدخول مرة أخرى بنفس صلاحياته.</>}
      </p>
    </Dialog>
  );
}
