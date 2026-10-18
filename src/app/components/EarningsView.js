"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiMessage } from "@/app/services/commerceAPI";

/**
 * Earnings of one instructor: balance due, totals for a period, months, best sellers, sales and payouts.
 * `api` is myEarningsAPI (instructor) or instructorEarningsAPI(id) (admin).
 * `adminTools` (admin only) adds the payout and commission forms.
 */
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const METHODS = {
  CASH: "نقدًا",
  BANK_TRANSFER: "تحويل بنكي",
  INSTAPAY: "إنستاباي",
  MOBILE_WALLET: "محفظة موبايل",
  OTHER: "أخرى",
};
const money = (v) => `${Number(v || 0).toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} جنيه`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-EG") : "—");
const input = "px-3 py-2 border border-gray-300 rounded-lg focus:border-brand-600 bg-white";

const csvCell = (value) => {
  let v = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\n\r']/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

function Card({ title, value, hint, tone = "gray" }) {
  const tones = {
    gray: "bg-white",
    green: "bg-emerald-50 border-emerald-200",
    blue: "bg-brand-50 border-brand-200",
    amber: "bg-amber-50 border-amber-200",
  };
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${tones[tone]}`}>
      <p className="regular-14 text-gray-600">{title}</p>
      <p className="bold-20 text-gray-900 mt-1">{value}</p>
      {hint ? <p className="regular-12 text-gray-500 mt-1">{hint}</p> : null}
    </div>
  );
}

export default function EarningsView({ api, adminTools = false, onChanged }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState({ content: [], totalElements: 0, page: 0, size: 50 });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payout, setPayout] = useState({ amount: "", method: "INSTAPAY", note: "", paidOn: "" });
  const [commission, setCommission] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (page = 0) => {
      setLoading(true);
      try {
        const [s, l, p] = await Promise.all([api.summary(from, to), api.sales(from, to, page, 50), api.payouts()]);
        setSummary(s.data);
        setSales(l.data);
        setPayouts(Array.isArray(p.data) ? p.data : []);
        setCommission(String(Number(s.data.commissionPercent)));
      } catch (e) {
        toast.error(apiMessage(e, "تعذر تحميل الأرباح"));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, from, to]
  );

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const exportCsv = async () => {
    try {
      const { data } = await api.sales(from, to, 0, 1000);
      const rows = [
        ["التاريخ", "النوع", "العنصر", "الطالب", "طريقة الدفع", "المدفوع", "العمولة %", "عمولة المنصة", "صافي المدرس"],
        ...data.content.map((r) => [
          new Date(r.createdAt).toLocaleString("ar-EG"),
          r.source === "BUNDLE" ? "باقة" : "درس",
          r.itemName,
          r.studentName || "",
          r.paymentMethod === "PAYMOB" ? "دفع إلكتروني" : "محفظة",
          r.gross,
          r.commissionPercent,
          r.platformFee,
          r.net,
        ]),
      ];
      const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `earnings-${summary?.from || ""}-${summary?.to || ""}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      if (data.totalElements > data.content.length) toast.info(`تم تصدير أحدث ${data.content.length} عملية`);
    } catch (e) {
      toast.error(apiMessage(e, "تعذر التصدير"));
    }
  };

  const submitPayout = async (e) => {
    e.preventDefault();
    if (!window.confirm(`تسجيل دفعة ${payout.amount} جنيه للمدرس؟`)) return;
    setBusy(true);
    try {
      await api.recordPayout({
        amount: Number(payout.amount),
        method: payout.method,
        note: payout.note.trim() || null,
        paidOn: payout.paidOn || null,
      });
      toast.success("تم تسجيل الدفعة");
      setPayout({ amount: "", method: payout.method, note: "", paidOn: "" });
      await load(0);
      onChanged?.();
    } catch (err) {
      toast.error(apiMessage(err, "تعذر تسجيل الدفعة"));
    } finally {
      setBusy(false);
    }
  };

  const saveCommission = async (reset) => {
    setBusy(true);
    try {
      await api.setCommission(reset ? null : Number(commission));
      toast.success(reset ? "تمت العودة للنسبة الافتراضية" : "تم حفظ العمولة (تُطبق على المبيعات الجديدة فقط)");
      await load(0);
      onChanged?.();
    } catch (err) {
      toast.error(apiMessage(err, "تعذر حفظ العمولة"));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !summary) {
    return <p className="regular-14 text-gray-500 py-8">جاري تحميل الأرباح...</p>;
  }
  if (!summary) return null;

  const pages = Math.ceil((sales.totalElements || 0) / (sales.size || 50));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title={adminTools ? "المستحق للمدرس" : "المستحق لك الآن"} value={money(summary.balanceDue)} hint="صافي الأرباح ناقص ما تم صرفه" tone="green" />
        <Card title="صافي هذا الشهر" value={money(summary.thisMonthNet)} tone="blue" />
        <Card title="إجمالي صافي الأرباح" value={money(summary.totalNet)} hint={`تم صرف ${money(summary.totalPaid)}`} />
        <Card
          title="عمولة المنصة"
          value={`${Number(summary.commissionPercent)}%`}
          hint={summary.defaultCommission ? "النسبة الافتراضية للمنصة" : "نسبة خاصة بهذا المدرس"}
          tone="amber"
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block regular-12 text-gray-600 mb-1">من</label>
          <input type="date" className={input} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block regular-12 text-gray-600 mb-1">إلى</label>
          <input type="date" className={input} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={() => load(0)} className="px-4 py-2 rounded-lg bg-accent text-white bold-14 cursor-pointer">
          عرض
        </button>
        <button onClick={exportCsv} className="px-4 py-2 rounded-lg bg-gray-800 text-white bold-14 cursor-pointer">
          تصدير Excel (CSV)
        </button>
        <p className="regular-12 text-gray-500">
          الفترة: {fmtDate(summary.from)} – {fmtDate(summary.to)} · {summary.periodSales} عملية · المدفوع {money(summary.periodGross)} ·
          عمولة المنصة {money(summary.periodPlatformFee)} · الصافي {money(summary.periodNet)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <h3 className="bold-16 p-4 pb-2">حسب الشهر</h3>
          {summary.months.length === 0 ? (
            <p className="regular-14 text-gray-500 px-4 pb-4">لا توجد مبيعات في هذه الفترة.</p>
          ) : (
            <table className="w-full text-right regular-14">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">الشهر</th>
                  <th className="p-3">العمليات</th>
                  <th className="p-3">المدفوع</th>
                  <th className="p-3">عمولة المنصة</th>
                  <th className="p-3">الصافي</th>
                </tr>
              </thead>
              <tbody>
                {summary.months.map((m) => (
                  <tr key={`${m.year}-${m.month}`} className="border-t">
                    <td className="p-3">{`${MONTHS[m.month - 1]} ${m.year}`}</td>
                    <td className="p-3">{m.sales}</td>
                    <td className="p-3">{money(m.gross)}</td>
                    <td className="p-3">{money(m.platformFee)}</td>
                    <td className="p-3 bold-14">{money(m.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <h3 className="bold-16 p-4 pb-2">الأكثر مبيعًا</h3>
          {summary.topItems.length === 0 ? (
            <p className="regular-14 text-gray-500 px-4 pb-4">—</p>
          ) : (
            <table className="w-full text-right regular-14">
              <tbody>
                {summary.topItems.map((t) => (
                  <tr key={`${t.source}-${t.name}`} className="border-t">
                    <td className="p-3">
                      <span className="regular-12 text-gray-500 ml-2">{t.source === "BUNDLE" ? "باقة" : "درس"}</span>
                      {t.name}
                    </td>
                    <td className="p-3">{t.sales} عملية</td>
                    <td className="p-3 bold-14">{money(t.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {adminTools ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={submitPayout} className="bg-white rounded-xl shadow p-4 space-y-3">
            <h3 className="bold-16">تسجيل دفعة للمدرس</h3>
            <p className="regular-12 text-gray-500">سجّل المبلغ بعد تحويله فعليًا. لا يمكن تسجيل أكثر من المستحق ({money(summary.balanceDue)}).</p>
            <div className="flex flex-wrap gap-3">
              <input className={`${input} w-36`} type="number" min="0.01" step="0.01" placeholder="المبلغ" required
                value={payout.amount} onChange={(e) => setPayout({ ...payout, amount: e.target.value })} />
              <select className={input} value={payout.method} onChange={(e) => setPayout({ ...payout, method: e.target.value })}>
                {Object.entries(METHODS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input className={input} type="date" value={payout.paidOn} onChange={(e) => setPayout({ ...payout, paidOn: e.target.value })} />
            </div>
            <input className={`${input} w-full`} maxLength={300} placeholder="ملاحظة (رقم التحويل، الفترة...)"
              value={payout.note} onChange={(e) => setPayout({ ...payout, note: e.target.value })} />
            <button type="submit" disabled={busy || Number(summary.balanceDue) <= 0}
              className="px-4 py-2 rounded-lg bg-accent text-white bold-14 cursor-pointer disabled:opacity-50">
              تسجيل الدفعة
            </button>
          </form>

          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <h3 className="bold-16">عمولة المنصة لهذا المدرس</h3>
            <p className="regular-12 text-gray-500">التغيير يُطبق على المبيعات الجديدة فقط، ولا يغير المبيعات السابقة.</p>
            <div className="flex flex-wrap items-center gap-3">
              <input className={`${input} w-28`} type="number" min="0" max="100" step="0.01" value={commission}
                onChange={(e) => setCommission(e.target.value)} />
              <span className="regular-14">%</span>
              <button onClick={() => saveCommission(false)} disabled={busy || commission === ""}
                className="px-4 py-2 rounded-lg bg-accent text-white bold-14 cursor-pointer disabled:opacity-50">
                حفظ
              </button>
              {!summary.defaultCommission ? (
                <button onClick={() => saveCommission(true)} disabled={busy}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 bold-14 cursor-pointer">
                  العودة للنسبة الافتراضية
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <h3 className="bold-16 p-4 pb-2">المبيعات ({sales.totalElements})</h3>
        {sales.content.length === 0 ? (
          <p className="regular-14 text-gray-500 px-4 pb-4">لا توجد مبيعات في هذه الفترة.</p>
        ) : (
          <table className="w-full text-right regular-14">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">العنصر</th>
                <th className="p-3">الطالب</th>
                <th className="p-3">الدفع</th>
                <th className="p-3">المدفوع</th>
                <th className="p-3">عمولة المنصة</th>
                <th className="p-3">الصافي</th>
              </tr>
            </thead>
            <tbody>
              {sales.content.map((r) => (
                <tr key={r.id} className={`border-t ${Number(r.net) < 0 ? "text-red-600" : ""}`}>
                  <td className="p-3 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                  <td className="p-3">
                    <span className="regular-12 text-gray-500 ml-2">{r.source === "BUNDLE" ? "باقة" : "درس"}</span>
                    {r.itemName}
                  </td>
                  <td className="p-3">{r.studentName || "—"}</td>
                  <td className="p-3">{r.paymentMethod === "PAYMOB" ? "إلكتروني" : "محفظة"}</td>
                  <td className="p-3">{money(r.gross)}</td>
                  <td className="p-3">{`${money(r.platformFee)} (${Number(r.commissionPercent)}%)`}</td>
                  <td className="p-3 bold-14">{money(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pages > 1 ? (
          <div className="flex items-center gap-3 p-4">
            <button disabled={sales.page <= 0} onClick={() => load(sales.page - 1)} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50 cursor-pointer">السابق</button>
            <span className="regular-14">{sales.page + 1} / {pages}</span>
            <button disabled={sales.page + 1 >= pages} onClick={() => load(sales.page + 1)} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50 cursor-pointer">التالي</button>
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <h3 className="bold-16 p-4 pb-2">الدفعات المصروفة</h3>
        {payouts.length === 0 ? (
          <p className="regular-14 text-gray-500 px-4 pb-4">لم تُصرف دفعات بعد.</p>
        ) : (
          <table className="w-full text-right regular-14">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">الطريقة</th>
                <th className="p-3">ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{fmtDate(p.paidOn)}</td>
                  <td className="p-3 bold-14">{money(p.amount)}</td>
                  <td className="p-3">{METHODS[p.method] || p.method}</td>
                  <td className="p-3">{p.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="regular-12 text-gray-500">
        تُحسب هنا المبيعات المدفوعة من المحفظة أو إلكترونيًا فقط. أكواد الدروس التي يبيعها المدرس بنفسه في السنتر يحصل على ثمنها مباشرة ولا تظهر هنا.
      </p>
    </div>
  );
}
