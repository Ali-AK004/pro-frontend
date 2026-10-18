"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { FiTrendingUp, FiCreditCard, FiUsers, FiUserCheck, FiAlertTriangle, FiPocket, FiPercent, FiDollarSign } from "react-icons/fi";
import { paymentsAdminAPI } from "@/app/services/paymentsAdminAPI";
import { apiMessage } from "@/app/services/commerceAPI";
import { Card, DataTable, DateRange, PageHeader, StatCard, Badge, fmtMoney, fmtNumber } from "@/app/components/ui";

const shortDay = (d) => new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "—");

/** Business overview for a period: sales, money received, students, and what the platform owes. */
export default function AnalyticsPage({ onNavigate }) {
  const [range, setRange] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r) => {
    setLoading(true);
    try {
      const { data } = await paymentsAdminAPI.analytics(r.from, r.to);
      setData(data);
    } catch (e) {
      toast.error(apiMessage(e, "تعذر تحميل التحليلات"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [load, range]);

  const d = data;
  return (
    <div className="py-6" dir="rtl">
      <PageHeader
        title="التحليلات"
        subtitle={d ? `من ${new Date(d.from).toLocaleDateString("ar-EG")} إلى ${new Date(d.to).toLocaleDateString("ar-EG")}` : "المبيعات والطلاب والأموال"}
        actions={<DateRange value={range} onChange={setRange} />}
      />

      {!d && loading ? <p className="text-slate-400">جاري التحميل...</p> : null}
      {d ? (
        <div className="space-y-6">
          {d.needsReview > 0 ? (
            <button
              onClick={() => onNavigate?.("payments")}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-right cursor-pointer"
            >
              <FiAlertTriangle className="w-5 h-5 shrink-0" />
              <span>{fmtNumber(d.needsReview)} عملية دفع تحتاج مراجعتك (استرداد بالبطاقة بعد صرف الرصيد). اضغط لفتح مركز المدفوعات.</span>
            </button>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={FiTrendingUp} label="المبيعات" value={fmtMoney(d.salesGross)} hint={`${fmtNumber(d.salesCount)} عملية بيع بعد الخصومات والاستردادات`} />
            <StatCard icon={FiPercent} label="عمولة المنصة" value={fmtMoney(d.platformFee)} hint={`للمدرسين ${fmtMoney(d.instructorsNet)}`} />
            <StatCard icon={FiCreditCard} label="المحصّل إلكترونيًا (Paymob)" value={fmtMoney(d.onlineReceived)}
              hint={Number(d.cardRefunds) ? `استرداد بالبطاقة ${fmtMoney(d.cardRefunds)}` : "شحن المحفظة + الشراء المباشر"} />
            <StatCard icon={FiPocket} label="كروت شحن مستخدمة" value={fmtMoney(d.chargeCodes)} hint="نقدية محصلة في السناتر" />
            <StatCard icon={FiUsers} tone="teal" label="طلاب جدد" value={fmtNumber(d.newStudents)} hint={`إجمالي الطلاب ${fmtNumber(d.totalStudents)}`} />
            <StatCard icon={FiUserCheck} label="طلاب نشطون" value={fmtNumber(d.activeStudents)} hint={`اشترى منهم ${fmtNumber(d.payingStudents)}`} />
            <StatCard icon={FiCreditCard} tone="gray" label="نجاح الدفع الإلكتروني" value={pct(d.paymentsPaid, d.paymentsStarted)}
              hint={`${fmtNumber(d.paymentsPaid)} ناجحة من ${fmtNumber(d.paymentsStarted)} محاولة`} />
            <StatCard icon={FiDollarSign} label="التزامات حالية" value={fmtMoney(Number(d.walletLiability) + Number(d.instructorsDue))}
              hint={`محافظ الطلاب ${fmtMoney(d.walletLiability)} · مستحقات المدرسين ${fmtMoney(d.instructorsDue)}`} />
          </div>

          <Card title="المبيعات والتحصيل يوميًا">
            <div className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.days.map((x) => ({ ...x, sales: Number(x.sales), onlineCash: Number(x.onlineCash) }))}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#088395" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#088395" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 12 }} minTickGap={20} />
                  <YAxis tick={{ fontSize: 12 }} width={60} />
                  <Tooltip labelFormatter={shortDay} formatter={(v, name) => [fmtMoney(v), name]} />
                  <Legend />
                  <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#088395" fill="url(#gSales)" strokeWidth={2} />
                  <Area type="monotone" dataKey="onlineCash" name="المحصّل إلكترونيًا" stroke="#2fa8bd" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card title="طلاب جدد يوميًا">
              <div className="h-56" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 11 }} minTickGap={20} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                    <Tooltip labelFormatter={shortDay} formatter={(v) => [fmtNumber(v), "طلاب جدد"]} />
                    <Bar dataKey="newStudents" fill="#088395" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="طريقة الدفع" className="xl:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                {[["المحفظة", d.walletSales, "teal"], ["دفع إلكتروني مباشر", d.onlineSales, "blue"]].map(([label, v, tone]) => (
                  <div key={label} className="p-4 rounded-xl bg-slate-50">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{fmtMoney(v)}</p>
                    <Badge tone={tone}>{pct(Number(v), Number(d.salesGross))} من المبيعات</Badge>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400">
                المبيعات من المحفظة تشمل رصيدًا شُحن بكروت السناتر أو إلكترونيًا. الأرقام بعد كوبونات الخصم وبعد خصم أي استرداد.
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card title="أعلى المدرسين مبيعًا" padded={false}>
              <DataTable
                rowKey="instructorId"
                rows={d.topInstructors}
                columns={[
                  { key: "name", label: "المدرس" },
                  { key: "sales", label: "العمليات", render: (r) => fmtNumber(r.sales) },
                  { key: "gross", label: "المبيعات", render: (r) => fmtMoney(r.gross) },
                  { key: "platformFee", label: "عمولة المنصة", render: (r) => fmtMoney(r.platformFee) },
                ]}
              />
            </Card>
            <Card title="الأكثر مبيعًا" padded={false}>
              <DataTable
                rowKey="key"
                rows={d.bestSellers.map((b, i) => ({ ...b, key: `${b.source}-${b.name}-${i}` }))}
                columns={[
                  { key: "name", label: "العنصر", render: (r) => (<span><Badge tone={r.source === "BUNDLE" ? "amber" : "teal"}>{r.source === "BUNDLE" ? "باقة" : "درس"}</Badge> <span className="mr-1">{r.name}</span></span>) },
                  { key: "instructor", label: "المدرس" },
                  { key: "sales", label: "العمليات", render: (r) => fmtNumber(r.sales) },
                  { key: "gross", label: "المبيعات", render: (r) => fmtMoney(r.gross) },
                ]}
              />
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
