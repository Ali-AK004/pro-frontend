"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { adminAPI, handleAPIError } from "../services/adminAPI";

// Spreadsheet-safe CSV cell: neutralize formulas and quote when needed
const csvCell = (value) => {
  let v = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\n\r']/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

const downloadCsv = (rows, filename) => {
  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-EG") : "—");

export default function WalletManagement() {
  const [tab, setTab] = useState("cards");
  const [form, setForm] = useState({ amount: 100, count: 50, validDays: 365, batchLabel: "" });
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState("");
  const [cards, setCards] = useState({ content: [], totalElements: 0 });
  const [orders, setOrders] = useState({ content: [] });
  const [adjust, setAdjust] = useState({ userId: "", amount: "", note: "" });

  const loadCards = useCallback(async () => {
    try {
      const { data } = await adminAPI.wallet.listCards(batch, 0, 200);
      setCards(data);
    } catch (e) {
      toast.error(handleAPIError(e, "تعذر تحميل الكروت"));
    }
  }, [batch]);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await adminAPI.wallet.orders(0, 100);
      setOrders(data);
    } catch (e) {
      toast.error(handleAPIError(e, "تعذر تحميل المدفوعات"));
    }
  }, []);

  useEffect(() => {
    if (tab === "cards") loadCards();
    if (tab === "orders") loadOrders();
  }, [tab, loadCards, loadOrders]);

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        amount: Number(form.amount),
        count: Number(form.count),
        validDays: form.validDays === "" ? null : Number(form.validDays),
        batchLabel: form.batchLabel.trim() || null,
      };
      const { data } = await adminAPI.wallet.generateCards(payload);
      toast.success(`تم إنشاء ${data.length} كارت`);
      downloadCsv(
        [["الكود", "القيمة (جنيه)", "ينتهي", "الدفعة"], ...data.map((c) => [c.code, c.amount, c.expiryDate || "", c.batchLabel || ""])],
        `wallet-cards-${payload.batchLabel || "batch"}-${Date.now()}.csv`
      );
      setBatch(payload.batchLabel || "");
      loadCards();
    } catch (err) {
      toast.error(handleAPIError(err, "تعذر إنشاء الكروت"));
    } finally {
      setBusy(false);
    }
  };

  const disable = async (id) => {
    try {
      await adminAPI.wallet.disableCard(id);
      toast.success("تم إيقاف الكارت");
      loadCards();
    } catch (e) {
      toast.error(handleAPIError(e, "تعذر إيقاف الكارت"));
    }
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    try {
      const { data } = await adminAPI.wallet.adjust({
        userId: adjust.userId.trim(),
        amount: Number(adjust.amount),
        note: adjust.note.trim(),
      });
      toast.success(`الرصيد الجديد: ${data.balance} جنيه`);
      setAdjust({ userId: "", amount: "", note: "" });
    } catch (err) {
      toast.error(handleAPIError(err, "تعذر تعديل الرصيد"));
    }
  };

  const input = "w-full px-3 py-2 border border-gray-300 rounded-lg";

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex gap-2">
        {[
          ["cards", "كروت الشحن"],
          ["orders", "المدفوعات الإلكترونية"],
          ["adjust", "تعديل رصيد"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg bold-14 cursor-pointer ${tab === id ? "bg-accent text-white" : "bg-white border"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "cards" && (
        <>
          <form onSubmit={generate} className="bg-white rounded-xl shadow-sm p-6 grid md:grid-cols-5 gap-4 items-end">
            <label className="block">
              <span className="regular-12 text-gray-600">القيمة (جنيه)</span>
              <input type="number" min="1" max="5000" className={input} value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </label>
            <label className="block">
              <span className="regular-12 text-gray-600">عدد الكروت</span>
              <input type="number" min="1" max="1000" className={input} value={form.count}
                onChange={(e) => setForm({ ...form, count: e.target.value })} required />
            </label>
            <label className="block">
              <span className="regular-12 text-gray-600">الصلاحية (يوم)</span>
              <input type="number" min="0" max="3650" className={input} value={form.validDays}
                onChange={(e) => setForm({ ...form, validDays: e.target.value })} />
            </label>
            <label className="block">
              <span className="regular-12 text-gray-600">اسم الدفعة (مثلاً: سنتر المعادي)</span>
              <input maxLength={100} className={input} value={form.batchLabel}
                onChange={(e) => setForm({ ...form, batchLabel: e.target.value })} />
            </label>
            <button disabled={busy} className="bg-brand-600 text-white py-2 rounded-lg bold-14 disabled:opacity-50 cursor-pointer">
              إنشاء وتحميل CSV
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <input placeholder="فلترة باسم الدفعة" className={`  max-w-xs ${input}`} value={batch}
                onChange={(e) => setBatch(e.target.value)} />
              <button onClick={loadCards} className="px-4 py-2 border rounded-lg cursor-pointer">بحث</button>
              <span className="regular-12 text-gray-500">الإجمالي: {cards.totalElements ?? cards.content.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right regular-14">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="py-2">الكود</th>
                    <th>القيمة</th>
                    <th>الدفعة</th>
                    <th>ينتهي</th>
                    <th>الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cards.content.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 font-mono" dir="ltr">{c.code}</td>
                      <td>{c.amount}</td>
                      <td>{c.batchLabel || "—"}</td>
                      <td>{c.expiryDate || "—"}</td>
                      <td>
                        {c.used ? `مستخدم ${fmtDate(c.usedAt)}` : c.disabled ? "موقوف" : "متاح"}
                      </td>
                      <td>
                        {!c.used && !c.disabled ? (
                          <button onClick={() => disable(c.id)} className="text-red-600 cursor-pointer">إيقاف</button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-right regular-14">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="py-2">التاريخ</th>
                <th>النوع</th>
                <th>الدرس</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {orders.content.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2">{fmtDate(o.createdAt)}</td>
                  <td>{o.purpose === "WALLET_TOPUP" ? "شحن محفظة" : "شراء درس"}</td>
                  <td>{o.lessonName || "—"}</td>
                  <td>{o.amount} {o.currency}</td>
                  <td className={o.status === "PAID" ? "text-emerald-600" : o.status === "PENDING" ? "" : "text-red-600"}>
                    {o.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.content.length === 0 ? <p className="regular-14 text-gray-500 text-center py-6">لا توجد مدفوعات</p> : null}
        </div>
      )}

      {tab === "adjust" && (
        <form onSubmit={submitAdjust} className="bg-white rounded-xl shadow-sm p-6 grid md:grid-cols-4 gap-4 items-end">
          <label className="block">
            <span className="regular-12 text-gray-600">رقم الطالب (ID)</span>
            <input className={input} dir="ltr" value={adjust.userId} required
              onChange={(e) => setAdjust({ ...adjust, userId: e.target.value })} />
          </label>
          <label className="block">
            <span className="regular-12 text-gray-600">المبلغ (سالب للخصم)</span>
            <input type="number" step="0.01" className={input} value={adjust.amount} required
              onChange={(e) => setAdjust({ ...adjust, amount: e.target.value })} />
          </label>
          <label className="block">
            <span className="regular-12 text-gray-600">السبب (يظهر في السجل)</span>
            <input maxLength={300} className={input} value={adjust.note} required
              onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} />
          </label>
          <button className="bg-brand-600 text-white py-2 rounded-lg bold-14 cursor-pointer">تنفيذ</button>
        </form>
      )}
    </div>
  );
}
