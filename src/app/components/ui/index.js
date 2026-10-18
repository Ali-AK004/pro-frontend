"use client";

/*
 * Academitna UI kit ("clean modern"): white cards on light gray, teal #088395 as the main colour.
 * Every new or redesigned screen uses these pieces so the whole site looks and behaves the same.
 */
import { useEffect, useRef } from "react";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// ------------------------------------------------------------------ formatting

export const fmtMoney = (v, { sign = false } = {}) => {
  const n = Number(v || 0);
  const s = Math.abs(n).toLocaleString("ar-EG", { maximumFractionDigits: 2 });
  return `${n < 0 ? "−" : sign && n > 0 ? "+" : ""}${s} ج.م`;
};
export const fmtNumber = (v) => Number(v || 0).toLocaleString("ar-EG");
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
export const isoDay = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ------------------------------------------------------------------ layout

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, actions, children, className, padded = true }) {
  return (
    <section className={cx("bg-white rounded-2xl border border-slate-200/80 shadow-sm", className)}>
      {title || actions ? (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          {actions}
        </header>
      ) : null}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

// One palette site-wide (defined in globals.css @theme): brand teal for everything neutral,
// green = success, amber = warning, red = error/danger only.
const TONES = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  gray: "bg-slate-100 text-slate-600",
};
// Older names still used by some screens
TONES.teal = TONES.brand;
TONES.blue = TONES.brand;
TONES.green = TONES.success;
TONES.amber = TONES.warning;
TONES.red = TONES.danger;

export function StatCard({ label, value, hint, icon: Icon, tone = "teal" }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-start gap-4">
      {Icon ? (
        <span className={cx("shrink-0 w-11 h-11 rounded-xl flex items-center justify-center", TONES[tone])}>
          <Icon className="w-5 h-5" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-xl font-bold text-slate-900 truncate">{value}</p>
        {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Badge({ tone = "gray", children }) {
  return <span className={cx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", TONES[tone])}>{children}</span>;
}

// ------------------------------------------------------------------ controls

const BUTTONS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600/40",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
  ghost: "text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-600/30",
};

export function Button({ variant = "primary", size = "md", loading = false, className, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors cursor-pointer",
        "focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        BUTTONS[variant],
        className
      )}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  );
}

export const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 " +
  "focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15";

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label ? <span className="block mb-1.5 text-sm font-medium text-slate-700">{label}</span> : null}
      {children}
      {hint ? <span className="block mt-1 text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 mb-5 bg-slate-100 rounded-xl overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            "whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
            value === t.id ? "bg-white text-brand-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          )}
        >
          {t.label}
          {t.count ? <span className="mr-2 px-1.5 rounded-full bg-red-500 text-white text-xs">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

const dateInputClass = inputClass.replace("w-full ", "w-40 ").replace("py-2.5", "py-1.5");

const PRESETS = [
  { days: 7, label: "7 أيام" },
  { days: 30, label: "30 يومًا" },
  { days: 90, label: "3 شهور" },
  { days: 365, label: "سنة" },
];

/** Date range with quick presets. value = { from, to } as yyyy-mm-dd strings ("" = default). */
export function DateRange({ value, onChange }) {
  const pick = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    onChange({ from: isoDay(from), to: isoDay(to) });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button key={p.days} variant="secondary" size="sm" onClick={() => pick(p.days)}>
          {p.label}
        </Button>
      ))}
      <input type="date" aria-label="من" className={dateInputClass} value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })} />
      <span className="text-slate-400">—</span>
      <input type="date" aria-label="إلى" className={dateInputClass} value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })} />
    </div>
  );
}

// ------------------------------------------------------------------ data display

/**
 * columns: [{ key, label, render?(row), className? }]
 */
export function DataTable({ columns, rows, rowKey = "id", empty = "لا توجد بيانات", onRowClick, loading }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead>
          <tr className="text-slate-500 border-b border-slate-200">
            {columns.map((c) => (
              <th key={c.key} className={cx("px-4 py-3 font-medium whitespace-nowrap", c.className)}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">جاري التحميل...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">{empty}</td></tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r[rowKey]}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cx("border-b border-slate-100 last:border-0", onRowClick && "cursor-pointer hover:bg-slate-50")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx("px-4 py-3 text-slate-700 whitespace-nowrap", c.className)}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page, size, total, onPage }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (size || 1)));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
      <span>{fmtNumber(total)} نتيجة</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>السابق</Button>
        <span>{fmtNumber(page + 1)} / {fmtNumber(pages)}</span>
        <Button variant="secondary" size="sm" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>التالي</Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ dialog

/** Accessible modal dialog (Esc closes, focus moves inside). Replaces window.confirm/alert. */
export function Dialog({ open, title, onClose, children, footer, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx("relative w-full bg-white rounded-2xl shadow-xl outline-none max-h-[90vh] flex flex-col", wide ? "max-w-3xl" : "max-w-lg")}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="text-slate-400 hover:text-slate-600 text-2xl leading-none cursor-pointer">×</button>
        </header>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer ? <footer className="flex justify-start gap-2 px-6 py-4 border-t border-slate-100">{footer}</footer> : null}
      </div>
    </div>
  );
}
