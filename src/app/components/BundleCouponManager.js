"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { commerceAPI, apiMessage } from "@/app/services/commerceAPI";

/**
 * Bundles (باقات) and discount coupons (أكواد الخصم) for the admin and instructor dashboards.
 * role: "ADMIN" | "INSTRUCTOR" | "ASSISTANT". Assistants manage bundles only (coupons are money).
 * Admins pick the instructor; `instructors` is the list to choose from.
 */
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-EG") : "—");
const input = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#088395] bg-white";
const label = "block bold-14 text-gray-800 mb-1";
const btn = "px-4 py-2 rounded-lg bold-14 cursor-pointer disabled:opacity-50";

const emptyBundle = {
  id: null,
  title: "",
  description: "",
  price: "",
  accessMode: "days",
  accessDays: 30,
  accessUntil: "",
  lessonIds: [],
  active: true,
  instructorId: "",
};

const emptyCoupon = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  appliesTo: "ALL",
  target: "",
  minAmount: "",
  maxUses: "",
  perUserLimit: 1,
  validFrom: "",
  validUntil: "",
  note: "",
  instructorId: "",
};

export default function BundleCouponManager({ role, instructors = [] }) {
  const isAdmin = role === "ADMIN";
  const canCoupons = role === "ADMIN" || role === "INSTRUCTOR";
  const [tab, setTab] = useState("bundles");
  const [bundles, setBundles] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadBundles = useCallback(async () => {
    try {
      const { data } = await commerceAPI.manage.bundles();
      setBundles(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(apiMessage(e, "تعذر تحميل الباقات"));
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    if (!canCoupons) return;
    try {
      const { data } = await commerceAPI.manage.coupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(apiMessage(e, "تعذر تحميل أكواد الخصم"));
    }
  }, [canCoupons]);

  useEffect(() => {
    loadBundles();
    loadCoupons();
  }, [loadBundles, loadCoupons]);

  return (
    <div className="py-6 space-y-6" dir="rtl">
      <div>
        <h1 className="bold-24 text-gray-900">الباقات وأكواد الخصم</h1>
        <p className="regular-14 text-gray-600">
          اجمع عدة دروس في باقة بسعر واحد (شهر، ترم، مراجعة نهائية) وأنشئ أكواد خصم للعروض.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          ["bundles", "الباقات"],
          ...(canCoupons ? [["coupons", "أكواد الخصم"]] : []),
        ].map(([id, text]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 bold-14 cursor-pointer border-b-2 -mb-px ${
              tab === id ? "border-[#088395] text-[#088395]" : "border-transparent text-gray-500"
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {tab === "bundles" ? (
        <BundlesTab
          isAdmin={isAdmin}
          instructors={instructors}
          bundles={bundles}
          reload={loadBundles}
          busy={busy}
          setBusy={setBusy}
        />
      ) : (
        <CouponsTab
          isAdmin={isAdmin}
          instructors={instructors}
          coupons={coupons}
          bundles={bundles}
          reload={loadCoupons}
          busy={busy}
          setBusy={setBusy}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- bundles

function BundlesTab({ isAdmin, instructors, bundles, reload, busy, setBusy }) {
  const [form, setForm] = useState(null); // null = list view
  const [lessons, setLessons] = useState([]);

  const ownerId = isAdmin ? form?.instructorId : "self";
  useEffect(() => {
    if (!form || (isAdmin && !form.instructorId)) {
      setLessons([]);
      return;
    }
    commerceAPI.manage
      .bundleLessons(isAdmin ? form.instructorId : undefined)
      .then((res) => setLessons(Array.isArray(res.data) ? res.data : []))
      .catch((e) => toast.error(apiMessage(e, "تعذر تحميل الدروس")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, form === null]);

  const byCourse = useMemo(() => {
    const groups = {};
    lessons.forEach((l) => {
      const key = l.courseName || "بدون كورس";
      (groups[key] = groups[key] || []).push(l);
    });
    return groups;
  }, [lessons]);

  const selectedTotal = lessons
    .filter((l) => form?.lessonIds.includes(l.id) && !l.free)
    .reduce((sum, l) => sum + Number(l.price || 0), 0);

  const edit = (b) =>
    setForm({
      id: b.id,
      title: b.title,
      description: b.description || "",
      price: b.price,
      accessMode: b.accessUntil ? "until" : "days",
      accessDays: b.accessDays || 30,
      accessUntil: b.accessUntil || "",
      lessonIds: b.lessons.map((l) => l.id),
      active: b.active,
      instructorId: b.instructorId,
    });

  const payloadOf = (f) => ({
    title: f.title.trim(),
    description: f.description.trim() || null,
    price: Number(f.price),
    accessDays: f.accessMode === "days" ? Number(f.accessDays) || null : null,
    accessUntil: f.accessMode === "until" ? f.accessUntil || null : null,
    lessonIds: f.lessonIds,
    active: f.active,
    instructorId: isAdmin ? f.instructorId : null,
  });

  const save = async (e) => {
    e.preventDefault();
    if (isAdmin && !form.instructorId) return toast.error("اختر المدرس");
    if (!form.lessonIds.length) return toast.error("اختر درسًا واحدًا على الأقل");
    if (form.accessMode === "until" && !form.accessUntil) return toast.error("حدد تاريخ انتهاء الباقة");
    setBusy(true);
    try {
      if (form.id) await commerceAPI.manage.updateBundle(form.id, payloadOf(form));
      else await commerceAPI.manage.createBundle(payloadOf(form));
      toast.success(form.id ? "تم تحديث الباقة" : "تم إنشاء الباقة");
      setForm(null);
      reload();
    } catch (err) {
      toast.error(apiMessage(err, "تعذر حفظ الباقة"));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (b) => {
    setBusy(true);
    try {
      await commerceAPI.manage.updateBundle(b.id, {
        ...payloadOf({ ...emptyBundle, ...b, description: b.description || "", accessMode: b.accessUntil ? "until" : "days",
          lessonIds: b.lessons.map((l) => l.id), instructorId: b.instructorId }),
        active: !b.active,
      });
      reload();
    } catch (err) {
      toast.error(apiMessage(err, "تعذر تحديث الباقة"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`حذف الباقة "${b.title}"؟ الطلاب الذين اشتروها يحتفظون بالدروس.`)) return;
    setBusy(true);
    try {
      await commerceAPI.manage.deleteBundle(b.id);
      toast.success("تم حذف الباقة");
      reload();
    } catch (err) {
      toast.error(apiMessage(err, "تعذر حذف الباقة"));
    } finally {
      setBusy(false);
    }
  };

  if (form) {
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
    const toggleLesson = (id) =>
      setForm({
        ...form,
        lessonIds: form.lessonIds.includes(id) ? form.lessonIds.filter((x) => x !== id) : [...form.lessonIds, id],
      });
    return (
      <form onSubmit={save} className="bg-white rounded-xl shadow p-4 md:p-6 space-y-4 max-w-3xl">
        <h2 className="bold-18">{form.id ? "تعديل باقة" : "باقة جديدة"}</h2>
        {isAdmin && !form.id ? (
          <div>
            <label className={label}>المدرس</label>
            <select className={input} value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value, lessonIds: [] })}>
              <option value="">اختر المدرس</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.fullname || i.username}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label className={label}>اسم الباقة</label>
          <input className={input} value={form.title} onChange={set("title")} maxLength={150} required placeholder="مثال: باقة شهر نوفمبر" />
        </div>
        <div>
          <label className={label}>الوصف (اختياري)</label>
          <textarea className={input} rows={2} value={form.description} onChange={set("description")} maxLength={2000} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>سعر الباقة (جنيه)</label>
            <input className={input} type="number" min="1" step="0.01" value={form.price} onChange={set("price")} required />
            {selectedTotal > 0 ? (
              <p className="regular-12 text-gray-500 mt-1">
                مجموع أسعار الدروس المختارة: {selectedTotal} جنيه
                {Number(form.price) > 0 && Number(form.price) < selectedTotal
                  ? ` — توفير ${Math.round(((selectedTotal - Number(form.price)) / selectedTotal) * 100)}%`
                  : ""}
              </p>
            ) : null}
          </div>
          <div>
            <label className={label}>مدة الوصول</label>
            <select className={input} value={form.accessMode} onChange={set("accessMode")}>
              <option value="days">عدد أيام من تاريخ الشراء</option>
              <option value="until">حتى تاريخ محدد (نهاية الشهر / الترم)</option>
            </select>
            {form.accessMode === "days" ? (
              <input className={`${input} mt-2`} type="number" min="1" max="730" value={form.accessDays} onChange={set("accessDays")} />
            ) : (
              <input className={`${input} mt-2`} type="date" value={form.accessUntil} onChange={set("accessUntil")} />
            )}
          </div>
        </div>

        <div>
          <label className={label}>الدروس ({form.lessonIds.length} مختار)</label>
          {isAdmin && !form.instructorId ? (
            <p className="regular-14 text-gray-500">اختر المدرس أولاً لعرض دروسه.</p>
          ) : lessons.length === 0 ? (
            <p className="regular-14 text-gray-500">لا توجد دروس.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto divide-y">
              {Object.entries(byCourse).map(([course, list]) => (
                <div key={course} className="p-3">
                  <p className="bold-14 text-gray-700 mb-2">{course}</p>
                  {list.map((l) => (
                    <label key={l.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox" checked={form.lessonIds.includes(l.id)} onChange={() => toggleLesson(l.id)} />
                      <span className="regular-14 flex-1">{l.name}</span>
                      <span className="regular-12 text-gray-500">{l.free ? "مجاني" : `${l.price} جنيه`}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={set("active")} />
          <span className="regular-14">متاحة للبيع</span>
        </label>

        <div className="flex gap-3">
          <button type="submit" disabled={busy} className={`${btn} bg-accent text-white`}>
            {busy ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button type="button" onClick={() => setForm(null)} className={`${btn} bg-gray-200 text-gray-700`}>
            إلغاء
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setForm({ ...emptyBundle })} className={`${btn} bg-accent text-white`}>
        + باقة جديدة
      </button>
      {bundles.length === 0 ? (
        <p className="regular-14 text-gray-500">لا توجد باقات بعد.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-right regular-14">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">الباقة</th>
                {isAdmin ? <th className="p-3">المدرس</th> : null}
                <th className="p-3">السعر</th>
                <th className="p-3">الدروس</th>
                <th className="p-3">المدة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3 bold-14">{b.title}</td>
                  {isAdmin ? <td className="p-3">{b.instructorName}</td> : null}
                  <td className="p-3">
                    {b.price} جنيه
                    {Number(b.lessonsTotal) > Number(b.price) ? (
                      <span className="block regular-12 text-gray-400 line-through">{b.lessonsTotal}</span>
                    ) : null}
                  </td>
                  <td className="p-3">{b.lessons.length}</td>
                  <td className="p-3">{b.accessUntil ? `حتى ${fmtDate(b.accessUntil)}` : `${b.accessDays || "افتراضي"} يوم`}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full regular-12 ${b.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {b.active ? "متاحة" : "موقوفة"}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-2 space-x-reverse">
                    <button onClick={() => edit(b)} className="text-[#088395] underline cursor-pointer">تعديل</button>
                    <button onClick={() => toggleActive(b)} disabled={busy} className="text-gray-600 underline cursor-pointer">
                      {b.active ? "إيقاف" : "تفعيل"}
                    </button>
                    <button onClick={() => remove(b)} disabled={busy} className="text-red-600 underline cursor-pointer">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- coupons

function CouponsTab({ isAdmin, instructors, coupons, bundles, reload, busy, setBusy }) {
  const [form, setForm] = useState(null);
  const [lessons, setLessons] = useState([]);

  const ownerId = isAdmin ? form?.instructorId : "self";
  useEffect(() => {
    if (!form || form.appliesTo !== "LESSON" || (isAdmin && !form.instructorId)) return;
    commerceAPI.manage
      .bundleLessons(isAdmin ? form.instructorId : undefined)
      .then((res) => setLessons(Array.isArray(res.data) ? res.data.filter((l) => !l.free) : []))
      .catch(() => setLessons([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, form?.appliesTo]);

  const ownerBundles = bundles.filter((b) => !isAdmin || !form?.instructorId || b.instructorId === form.instructorId);

  const save = async (e) => {
    e.preventDefault();
    const f = form;
    if (f.discountType === "PERCENT" && Number(f.discountValue) > 100) return toast.error("النسبة يجب ألا تزيد عن 100%");
    if ((f.appliesTo === "LESSON" || f.appliesTo === "BUNDLE") && !f.target) return toast.error("اختر الدرس أو الباقة");
    setBusy(true);
    try {
      await commerceAPI.manage.createCoupon({
        code: f.code.trim().toUpperCase(),
        discountType: f.discountType,
        discountValue: Number(f.discountValue),
        appliesTo: ["ALL", "LESSONS", "BUNDLES"].includes(f.appliesTo) ? f.appliesTo : null,
        lessonId: f.appliesTo === "LESSON" ? f.target : null,
        bundleId: f.appliesTo === "BUNDLE" ? f.target : null,
        minAmount: f.minAmount === "" ? null : Number(f.minAmount),
        maxUses: f.maxUses === "" ? null : Number(f.maxUses),
        perUserLimit: Number(f.perUserLimit) || 1,
        validFrom: f.validFrom || null,
        validUntil: f.validUntil || null,
        note: f.note.trim() || null,
        instructorId: isAdmin ? f.instructorId || null : null,
      });
      toast.success("تم إنشاء كود الخصم");
      setForm(null);
      reload();
    } catch (err) {
      toast.error(apiMessage(err, "تعذر إنشاء الكود"));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c) => {
    setBusy(true);
    try {
      await commerceAPI.manage.setCouponActive(c.id, !c.active);
      reload();
    } catch (err) {
      toast.error(apiMessage(err, "تعذر تحديث الكود"));
    } finally {
      setBusy(false);
    }
  };

  const scopeText = (c) =>
    c.lessonName
      ? `درس: ${c.lessonName}`
      : c.bundleTitle
      ? `باقة: ${c.bundleTitle}`
      : { ALL: "كل الدروس والباقات", LESSONS: "الدروس فقط", BUNDLES: "الباقات فقط" }[c.appliesTo];

  if (form) {
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    return (
      <form onSubmit={save} className="bg-white rounded-xl shadow p-4 md:p-6 space-y-4 max-w-3xl">
        <h2 className="bold-18">كود خصم جديد</h2>
        {isAdmin ? (
          <div>
            <label className={label}>صاحب الكود</label>
            <select className={input} value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value, target: "" })}>
              <option value="">كل المنصة (كل المدرسين)</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.fullname || i.username}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={label}>الكود</label>
            <input className={`${input} uppercase`} dir="ltr" value={form.code} onChange={set("code")} required
              pattern="[A-Za-z0-9_\-]{3,32}" title="3-32 حرف إنجليزي أو رقم أو - أو _" placeholder="RAMADAN25" />
          </div>
          <div>
            <label className={label}>نوع الخصم</label>
            <select className={input} value={form.discountType} onChange={set("discountType")}>
              <option value="PERCENT">نسبة مئوية %</option>
              <option value="FIXED">مبلغ ثابت (جنيه)</option>
            </select>
          </div>
          <div>
            <label className={label}>{form.discountType === "PERCENT" ? "النسبة %" : "المبلغ (جنيه)"}</label>
            <input className={input} type="number" min="0.01" step="0.01" max={form.discountType === "PERCENT" ? 100 : undefined}
              value={form.discountValue} onChange={set("discountValue")} required />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>يُطبق على</label>
            <select className={input} value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value, target: "" })}>
              <option value="ALL">كل الدروس والباقات</option>
              <option value="LESSONS">الدروس فقط</option>
              <option value="BUNDLES">الباقات فقط</option>
              {!isAdmin || form.instructorId ? <option value="LESSON">درس محدد</option> : null}
              <option value="BUNDLE">باقة محددة</option>
            </select>
          </div>
          {form.appliesTo === "LESSON" ? (
            <div>
              <label className={label}>الدرس</label>
              <select className={input} value={form.target} onChange={set("target")}>
                <option value="">اختر الدرس</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{`${l.courseName || ""} — ${l.name} (${l.price} جنيه)`}</option>
                ))}
              </select>
            </div>
          ) : form.appliesTo === "BUNDLE" ? (
            <div>
              <label className={label}>الباقة</label>
              <select className={input} value={form.target} onChange={set("target")}>
                <option value="">اختر الباقة</option>
                {ownerBundles.map((b) => (
                  <option key={b.id} value={b.id}>{`${b.title} (${b.price} جنيه)`}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={label}>إجمالي مرات الاستخدام</label>
            <input className={input} type="number" min="1" value={form.maxUses} onChange={set("maxUses")} placeholder="بلا حد" />
          </div>
          <div>
            <label className={label}>مرات الاستخدام لكل طالب</label>
            <input className={input} type="number" min="1" max="100" value={form.perUserLimit} onChange={set("perUserLimit")} />
          </div>
          <div>
            <label className={label}>أقل سعر (اختياري)</label>
            <input className={input} type="number" min="0" step="0.01" value={form.minAmount} onChange={set("minAmount")} />
          </div>
          <div>
            <label className={label}>يبدأ من</label>
            <input className={input} type="date" value={form.validFrom} onChange={set("validFrom")} />
          </div>
          <div>
            <label className={label}>ينتهي في</label>
            <input className={input} type="date" value={form.validUntil} onChange={set("validUntil")} />
          </div>
          <div>
            <label className={label}>ملاحظة (اختياري)</label>
            <input className={input} value={form.note} onChange={set("note")} maxLength={200} placeholder="عرض رمضان" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={busy} className={`${btn} bg-accent text-white`}>
            {busy ? "جاري الحفظ..." : "إنشاء الكود"}
          </button>
          <button type="button" onClick={() => setForm(null)} className={`${btn} bg-gray-200 text-gray-700`}>
            إلغاء
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setForm({ ...emptyCoupon })} className={`${btn} bg-accent text-white`}>
        + كود خصم جديد
      </button>
      {coupons.length === 0 ? (
        <p className="regular-14 text-gray-500">لا توجد أكواد خصم بعد.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-right regular-14">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">الكود</th>
                <th className="p-3">الخصم</th>
                <th className="p-3">يُطبق على</th>
                {isAdmin ? <th className="p-3">المدرس</th> : null}
                <th className="p-3">الاستخدام</th>
                <th className="p-3">الصلاحية</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 bold-14" dir="ltr">{c.code}</td>
                  <td className="p-3">{c.discountType === "PERCENT" ? `${Number(c.discountValue)}%` : `${c.discountValue} جنيه`}</td>
                  <td className="p-3">{scopeText(c)}</td>
                  {isAdmin ? <td className="p-3">{c.instructorName || "كل المنصة"}</td> : null}
                  <td className="p-3">
                    {c.usedCount} / {c.maxUses ?? "∞"}
                  </td>
                  <td className="p-3 regular-12">
                    {c.validFrom ? `من ${fmtDate(c.validFrom)} ` : ""}
                    {c.validUntil ? `حتى ${fmtDate(c.validUntil)}` : c.validFrom ? "" : "دائم"}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full regular-12 ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.active ? "مفعل" : "موقوف"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => toggle(c)} disabled={busy} className="text-[#088395] underline cursor-pointer">
                      {c.active ? "إيقاف" : "تفعيل"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
