"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { paymentsAdminAPI, csvDownload } from "@/app/services/paymentsAdminAPI";
import { apiMessage } from "@/app/services/commerceAPI";
import {
  Badge, Button, Card, DataTable, DateRange, Dialog, Field, PageHeader, Pager, Tabs,
  fmtDate, fmtDateTime, fmtMoney, fmtNumber, inputClass,
} from "@/app/components/ui";

const STATUS = {
  PAID: ["مدفوع", "green"],
  PENDING: ["قيد الانتظار", "amber"],
  FAILED: ["فشل", "red"],
  EXPIRED: ["انتهت المهلة", "gray"],
  REFUNDED: ["مسترد", "blue"],
};
const PURPOSE = { LESSON: "درس", BUNDLE: "باقة", WALLET_TOPUP: "شحن محفظة" };
const StatusBadge = ({ s }) => <Badge tone={(STATUS[s] || [s, "gray"])[1]}>{(STATUS[s] || [s])[0]}</Badge>;
const Student = ({ s }) =>
  s ? (
    <div>
      <div className="font-medium text-slate-800">{s.name || "—"}</div>
      <div className="text-xs text-slate-400" dir="ltr">{s.email}</div>
    </div>
  ) : (
    <span className="text-slate-400">حساب محذوف</span>
  );

/** Every online payment, every sale, refunds, the review queue and the daily Paymob reconciliation. */
export default function PaymentsCenterPage() {
  const [tab, setTab] = useState("orders");
  const [reviewCount, setReviewCount] = useState(0);
  return (
    <div className="py-6" dir="rtl">
      <PageHeader title="مركز المدفوعات" subtitle="كل عمليات الدفع والمبيعات والاستردادات والتسوية اليومية مع Paymob" />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "orders", label: "المدفوعات الإلكترونية" },
          { id: "sales", label: "كل المبيعات والاسترداد" },
          { id: "review", label: "تحتاج مراجعة", count: reviewCount },
          { id: "reconciliation", label: "التسوية اليومية" },
        ]}
      />
      {tab === "orders" ? <OrdersTab onReviewCount={setReviewCount} /> : null}
      {tab === "review" ? <OrdersTab onlyReview onReviewCount={setReviewCount} /> : null}
      {tab === "sales" ? <SalesTab /> : null}
      {tab === "reconciliation" ? <ReconciliationTab /> : null}
    </div>
  );
}

// ------------------------------------------------------------------ online payments

function OrdersTab({ onlyReview = false, onReviewCount }) {
  const [filters, setFilters] = useState({ status: "", purpose: "", q: "", from: "", to: "" });
  const [range, setRange] = useState({ from: "", to: "" });
  const [data, setData] = useState({ content: [], totalElements: 0, page: 0, size: 50 });
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(
    async (page = 0) => {
      setLoading(true);
      try {
        const { data } = await paymentsAdminAPI.orders(
          { ...filters, ...range, needsReview: onlyReview || undefined },
          page
        );
        setData(data);
        onReviewCount?.(data.needsReview);
      } catch (e) {
        toast.error(apiMessage(e, "تعذر تحميل المدفوعات"));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.status, filters.purpose, range, onlyReview]
  );

  useEffect(() => {
    load(0);
  }, [load]);

  const exportCsv = async () => {
    try {
      const { data } = await paymentsAdminAPI.orders({ ...filters, ...range, needsReview: onlyReview || undefined }, 0, 500);
      csvDownload("payments.csv",
        ["رقم العملية", "التاريخ", "تاريخ الدفع", "النوع", "العنصر", "الطالب", "البريد", "قبل الخصم", "المبلغ", "كوبون", "الحالة", "رقم Paymob", "رقم المعاملة"],
        data.content.map((o) => [o.id, fmtDateTime(o.createdAt), fmtDateTime(o.paidAt), PURPOSE[o.purpose], o.itemName,
          o.student?.name, o.student?.email, o.originalAmount ?? o.amount, o.amount, o.couponCode, (STATUS[o.status] || [o.status])[0],
          o.providerOrderId, o.providerTransactionId]));
      if (data.totalElements > data.content.length) toast.info(`تم تصدير أحدث ${data.content.length} عملية`);
    } catch (e) {
      toast.error(apiMessage(e, "تعذر التصدير"));
    }
  };

  return (
    <>
      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <form className="flex-1 min-w-56" onSubmit={(e) => { e.preventDefault(); load(0); }}>
            <Field label="بحث">
              <input className={inputClass} placeholder="اسم الطالب، البريد، الهاتف، رقم العملية أو رقم Paymob"
                value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            </Field>
          </form>
          {!onlyReview ? (
            <Field label="الحالة">
              <select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">الكل</option>
                {Object.entries(STATUS).map(([k, [v]]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          ) : null}
          <Field label="النوع">
            <select className={inputClass} value={filters.purpose} onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}>
              <option value="">الكل</option>
              {Object.entries(PURPOSE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <DateRange value={range} onChange={setRange} />
          <Button variant="secondary" onClick={exportCsv}>تصدير Excel</Button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {fmtNumber(data.filteredCount)} عملية · الإجمالي {fmtMoney(data.filteredAmount)}
          {onlyReview ? " · عمليات استُردت بالبطاقة بعد أن صرف الطالب الرصيد، أو تحتاج قرارًا منك" : ""}
        </p>
      </Card>

      <Card padded={false}>
        <DataTable
          loading={loading}
          rows={data.content}
          onRowClick={(o) => setOpenId(o.id)}
          empty={onlyReview ? "لا توجد عمليات تحتاج مراجعة" : "لا توجد مدفوعات في هذه الفترة"}
          columns={[
            { key: "createdAt", label: "التاريخ", render: (o) => fmtDateTime(o.createdAt) },
            { key: "student", label: "الطالب", render: (o) => <Student s={o.student} /> },
            { key: "item", label: "العنصر", render: (o) => (<span><span className="text-slate-400 ml-1">{PURPOSE[o.purpose]}:</span>{o.itemName}</span>) },
            { key: "amount", label: "المبلغ", render: (o) => (
              <span className="font-semibold">{fmtMoney(o.amount)}{o.couponCode ? <span className="block text-xs text-slate-400 font-normal">كوبون {o.couponCode}</span> : null}</span>) },
            { key: "status", label: "الحالة", render: (o) => (
              <span className="flex items-center gap-1"><StatusBadge s={o.status} />{o.needsReview ? <Badge tone="red">مراجعة</Badge> : null}</span>) },
          ]}
        />
        <Pager page={data.page} size={data.size} total={data.totalElements} onPage={load} />
      </Card>

      <OrderDialog id={openId} onClose={() => setOpenId(null)} onChanged={() => load(data.page)} />
    </>
  );
}

function OrderDialog({ id, onClose, onChanged }) {
  const [d, setD] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setD(null);
    setNote("");
    paymentsAdminAPI.order(id).then((r) => setD(r.data)).catch((e) => toast.error(apiMessage(e, "تعذر تحميل العملية")));
  }, [id]);

  const resolve = async () => {
    setBusy(true);
    try {
      await paymentsAdminAPI.resolve(id, note.trim());
      toast.success("تم إغلاق المراجعة");
      onChanged();
      onClose();
    } catch (e) {
      toast.error(apiMessage(e, "تعذر الحفظ"));
    } finally {
      setBusy(false);
    }
  };

  const o = d?.order;
  return (
    <Dialog open={!!id} title="تفاصيل عملية الدفع" onClose={onClose} wide>
      {!o ? <p className="text-slate-400">جاري التحميل...</p> : (
        <div className="space-y-5 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Info label="الحالة"><StatusBadge s={o.status} /></Info>
            <Info label="المبلغ">{fmtMoney(o.amount)}{o.originalAmount && Number(o.originalAmount) !== Number(o.amount) ? <span className="text-slate-400"> (قبل الخصم {fmtMoney(o.originalAmount)})</span> : null}</Info>
            <Info label="العنصر">{PURPOSE[o.purpose]}: {o.itemName}</Info>
            <Info label="الطالب"><Student s={o.student} /></Info>
            <Info label="أُنشئت">{fmtDateTime(o.createdAt)}</Info>
            <Info label="دُفعت">{fmtDateTime(o.paidAt)}</Info>
            <Info label="رقم العملية"><span dir="ltr" className="font-mono text-xs">{o.id}</span></Info>
            <Info label="رقم طلب Paymob"><span dir="ltr" className="font-mono text-xs">{o.providerOrderId || "—"}</span></Info>
            <Info label="رقم معاملة Paymob"><span dir="ltr" className="font-mono text-xs">{o.providerTransactionId || "—"}</span></Info>
            {o.refundedAt ? <Info label="الاسترداد">{fmtDateTime(o.refundedAt)} · {o.refundMethod === "WALLET" ? "للمحفظة" : "للبطاقة"}</Info> : null}
            {o.failureReason ? <Info label="سبب الفشل">{o.failureReason}</Info> : null}
            {o.purpose !== "WALLET_TOPUP" ? <Info label="دروس مفتوحة بهذه العملية">{fmtNumber(d.lessonsOpened)}</Info> : null}
          </div>

          {o.reviewNote ? <div className="p-3 rounded-xl bg-slate-50 text-slate-600 whitespace-pre-line">{o.reviewNote.split(" | ").join("\n")}</div> : null}

          {d.wallet.length ? (
            <div>
              <p className="font-medium text-slate-700 mb-2">حركات المحفظة المرتبطة</p>
              <ul className="space-y-1">
                {d.wallet.map((w, i) => (
                  <li key={i} className="flex justify-between gap-3 text-slate-600">
                    <span>{fmtDateTime(w.createdAt)} · {w.note || w.type}</span>
                    <span className={Number(w.amount) < 0 ? "text-red-600" : "text-emerald-700"}>{fmtMoney(w.amount, { sign: true })}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {o.needsReview ? (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-3">
              <p className="text-amber-800">بعد التصرف (تواصل مع الطالب، خصم يدوي من المحفظة، أو إغلاق الدروس) سجّل ما فعلته وأغلق المراجعة.</p>
              <input className={inputClass} maxLength={300} placeholder="ماذا فعلت؟" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button onClick={resolve} loading={busy} disabled={!note.trim()}>إغلاق المراجعة</Button>
            </div>
          ) : null}

          {d.sale && !d.sale.refundedAt && o.status === "PAID" ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="danger" onClick={() => setRefundOpen(true)}>استرداد للمحفظة</Button>
              <span className="text-xs text-slate-400">لاسترداد المبلغ للبطاقة استخدم لوحة Paymob؛ النظام يلتقط الاسترداد تلقائيًا.</span>
            </div>
          ) : null}
          <RefundDialog sale={refundOpen ? d.sale : null} onClose={() => setRefundOpen(false)}
            onDone={() => { setRefundOpen(false); onChanged(); onClose(); }} />
        </div>
      )}
    </Dialog>
  );
}

const Info = ({ label, children }) => (
  <div>
    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
    <div className="text-slate-800">{children}</div>
  </div>
);

// ------------------------------------------------------------------ sales and refunds

function SalesTab() {
  const [range, setRange] = useState({ from: "", to: "" });
  const [filters, setFilters] = useState({ q: "", method: "" });
  const [data, setData] = useState({ content: [], totalElements: 0, page: 0, size: 50 });
  const [loading, setLoading] = useState(true);
  const [refund, setRefund] = useState(null);

  const load = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const { data } = await paymentsAdminAPI.sales({ ...filters, ...range }, page);
      setData(data);
    } catch (e) {
      toast.error(apiMessage(e, "تعذر تحميل المبيعات"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, filters.method]);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <>
      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <form className="flex-1 min-w-56" onSubmit={(e) => { e.preventDefault(); load(0); }}>
            <Field label="بحث">
              <input className={inputClass} placeholder="الطالب، البريد، الهاتف، اسم الدرس أو الباقة"
                value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            </Field>
          </form>
          <Field label="طريقة الدفع">
            <select className={inputClass} value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })}>
              <option value="">الكل</option>
              <option value="WALLET">المحفظة</option>
              <option value="PAYMOB">إلكتروني</option>
            </select>
          </Field>
          <DateRange value={range} onChange={setRange} />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          الاسترداد يعيد المبلغ لمحفظة الطالب، ويخصمه من أرباح المدرس، ويمكنه إغلاق الدروس التي فتحتها العملية مع إرجاع أي وصول سابق كما كان.
        </p>
      </Card>
      <Card padded={false}>
        <DataTable
          loading={loading}
          rows={data.content}
          empty="لا توجد مبيعات في هذه الفترة"
          columns={[
            { key: "createdAt", label: "التاريخ", render: (s) => fmtDateTime(s.createdAt) },
            { key: "student", label: "الطالب", render: (s) => <Student s={s.student} /> },
            { key: "item", label: "العنصر", render: (s) => (<span><Badge tone={s.source === "BUNDLE" ? "amber" : "teal"}>{s.source === "BUNDLE" ? "باقة" : "درس"}</Badge> <span className="mr-1">{s.itemName}</span></span>) },
            { key: "instructorName", label: "المدرس" },
            { key: "paymentMethod", label: "الدفع", render: (s) => (s.paymentMethod === "PAYMOB" ? "إلكتروني" : "محفظة") },
            { key: "gross", label: "المبلغ", render: (s) => <span className="font-semibold">{fmtMoney(s.gross)}</span> },
            { key: "action", label: "", render: (s) => s.refundedAt
                ? <Badge tone="blue">استُرد {fmtDate(s.refundedAt)}</Badge>
                : <Button size="sm" variant="secondary" onClick={() => setRefund(s)}>استرداد</Button> },
          ]}
        />
        <Pager page={data.page} size={data.size} total={data.totalElements} onPage={load} />
      </Card>
      <RefundDialog sale={refund} onClose={() => setRefund(null)} onDone={() => { setRefund(null); load(data.page); }} />
    </>
  );
}

function RefundDialog({ sale, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [endAccess, setEndAccess] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setNote("");
    setEndAccess(true);
  }, [sale]);

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await paymentsAdminAPI.refund(sale.reference, note.trim(), endAccess);
      toast.success(`تم رد ${fmtMoney(data.refunded)} للمحفظة${endAccess ? ` وإغلاق ${fmtNumber(data.lessonsClosed)} درس` : ""}`);
      onDone();
    } catch (e) {
      toast.error(apiMessage(e, "تعذر الاسترداد"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={!!sale}
      title="استرداد للمحفظة"
      onClose={onClose}
      footer={<>
        <Button variant="danger" onClick={submit} loading={busy} disabled={!note.trim()}>تأكيد الاسترداد</Button>
        <Button variant="secondary" onClick={onClose}>إلغاء</Button>
      </>}
    >
      {sale ? (
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">
            سيُضاف <b>{fmtMoney(sale.gross)}</b> لمحفظة <b>{sale.student?.name}</b> ويُخصم صافي المدرس <b>{sale.instructorName}</b> من مستحقاته.
          </p>
          <Field label="سبب الاسترداد">
            <input className={inputClass} maxLength={300} autoFocus value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-brand-600" checked={endAccess} onChange={(e) => setEndAccess(e.target.checked)} />
            <span>
              <span className="block font-medium text-slate-700">إغلاق الدروس التي فتحتها هذه العملية ({fmtNumber(sale.lessonsOpened)})</span>
              <span className="block text-xs text-slate-400">إذا كان للطالب وصول مدفوع سابق لنفس الدرس، يعود لتاريخه السابق ولا يُغلق.</span>
            </span>
          </label>
        </div>
      ) : null}
    </Dialog>
  );
}

// ------------------------------------------------------------------ reconciliation

function ReconciliationTab() {
  const [range, setRange] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  useEffect(() => {
    paymentsAdminAPI.reconciliation(range.from, range.to).then((r) => setData(r.data))
      .catch((e) => toast.error(apiMessage(e, "تعذر تحميل التسوية")));
  }, [range]);

  const exportCsv = () =>
    csvDownload("paymob-reconciliation.csv", ["اليوم", "عمليات مدفوعة", "المدفوع", "عمليات مستردة", "المسترد", "الصافي"],
      data.days.map((d) => [d.day, d.paidCount, d.paid, d.refundCount, d.refunded, d.net]));

  return (
    <>
      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DateRange value={range} onChange={setRange} />
          <Button variant="secondary" onClick={exportCsv} disabled={!data}>تصدير Excel</Button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          قارن كل يوم بتقرير التسوية في لوحة Paymob (بتوقيت القاهرة). أي فرق يعني دفعًا لم يصل إشعاره للمنصة أو استردادًا تم خارجها.
        </p>
      </Card>
      {data ? (
        <Card padded={false}>
          <DataTable
            rowKey="day"
            rows={data.days}
            columns={[
              { key: "day", label: "اليوم", render: (d) => new Date(d.day).toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "short" }) },
              { key: "paidCount", label: "عمليات", render: (d) => fmtNumber(d.paidCount) },
              { key: "paid", label: "المدفوع", render: (d) => fmtMoney(d.paid) },
              { key: "refunded", label: "المسترد للبطاقة", render: (d) => (Number(d.refunded) ? <span className="text-red-600">{fmtMoney(d.refunded)}</span> : "—") },
              { key: "net", label: "الصافي", render: (d) => <span className="font-semibold">{fmtMoney(d.net)}</span> },
            ]}
          />
          <div className="flex flex-wrap justify-between gap-3 px-4 py-3 border-t border-slate-100 text-sm font-semibold text-slate-700">
            <span>الإجمالي: {fmtNumber(data.paidCount)} عملية</span>
            <span>المدفوع {fmtMoney(data.paid)} · المسترد {fmtMoney(data.refunded)} · الصافي {fmtMoney(data.net)}</span>
          </div>
        </Card>
      ) : null}
    </>
  );
}
