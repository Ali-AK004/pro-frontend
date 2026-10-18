"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import EarningsView from "@/app/components/EarningsView";
import { adminEarningsAPI, instructorEarningsAPI } from "@/app/services/earningsAPI";
import { apiMessage } from "@/app/services/commerceAPI";

const money = (v) => `${Number(v || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} جنيه`;

/** Admin: what every instructor earned, was paid and is still owed; record payouts and commissions. */
export default function AdminEarningsPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await adminEarningsAPI.balances();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(apiMessage(e, "تعذر تحميل أرباح المدرسين"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const api = useMemo(() => (selected ? instructorEarningsAPI(selected.instructorId) : null), [selected]);
  const totalDue = rows.reduce((s, r) => s + Number(r.balanceDue || 0), 0);

  return (
    <div className="py-6 space-y-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bold-24 text-gray-900">أرباح المدرسين</h1>
          <p className="regular-14 text-gray-600">
            صافي أرباح كل مدرس بعد عمولة المنصة، وما تم صرفه، والمستحق. الإجمالي المستحق لكل المدرسين: {money(totalDue)}
          </p>
        </div>
        {selected ? (
          <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg bg-gray-200 bold-14 cursor-pointer">
            ← كل المدرسين
          </button>
        ) : null}
      </div>

      {selected ? (
        <>
          <h2 className="bold-20">{selected.name}</h2>
          <EarningsView api={api} adminTools onChanged={load} />
        </>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-right regular-14">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">المدرس</th>
                <th className="p-3">العمولة</th>
                <th className="p-3">العمليات</th>
                <th className="p-3">صافي الأرباح</th>
                <th className="p-3">تم صرفه</th>
                <th className="p-3">المستحق</th>
                <th className="p-3">آخر بيع</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.instructorId} className="border-t">
                  <td className="p-3">
                    <span className="bold-14">{r.name}</span>
                    <span className="block regular-12 text-gray-500" dir="ltr">{r.email}</span>
                  </td>
                  <td className="p-3">
                    {Number(r.commissionPercent)}%{r.defaultCommission ? <span className="regular-12 text-gray-400"> (افتراضي)</span> : null}
                  </td>
                  <td className="p-3">{r.sales}</td>
                  <td className="p-3">{money(r.totalNet)}</td>
                  <td className="p-3">{money(r.totalPaid)}</td>
                  <td className={`p-3 bold-14 ${Number(r.balanceDue) > 0 ? "text-emerald-700" : ""}`}>{money(r.balanceDue)}</td>
                  <td className="p-3">{r.lastSaleAt ? new Date(r.lastSaleAt).toLocaleDateString("ar-EG") : "—"}</td>
                  <td className="p-3">
                    <button onClick={() => setSelected(r)} className="text-brand-600 underline cursor-pointer">التفاصيل</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-gray-500">لا يوجد مدرسون.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
