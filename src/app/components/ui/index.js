"use client";

/*
 * Academitna UI kit: compact, clean, one brand colour (teal, see globals.css @theme).
 * White cards on light gray, thin borders, small type and icons. Every dashboard screen uses
 * these pieces so the whole site looks and behaves the same.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiInbox, FiSearch, FiX } from "react-icons/fi";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

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

/** Rows of a list response: a page ({ content }) or, for older endpoints, a plain array. */
export const rowsOf = (data) => (Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []);

// ------------------------------------------------------------------ paged lists

/**
 * Loads one page of a list and reloads (back to page 0) when `deps` change.
 * fetchPage(page, size) must return an axios response whose data is a page.
 */
export function usePaged(fetchPage, deps = [], { size = 20, onError } = {}) {
  const [state, setState] = useState({ rows: [], page: 0, total: 0, loading: true });
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const errRef = useRef(onError);
  errRef.current = onError;
  const seq = useRef(0);

  const load = useCallback(
    async (page = 0) => {
      const mine = ++seq.current;
      setState((s) => ({ ...s, loading: true }));
      try {
        const { data } = await fetchRef.current(page, size);
        if (mine !== seq.current) return;
        const rows = rowsOf(data);
        setState({ rows, page: data?.number ?? page, total: data?.totalElements ?? rows.length, loading: false });
      } catch (e) {
        if (mine !== seq.current) return;
        setState((s) => ({ ...s, rows: [], total: 0, loading: false }));
        errRef.current?.(e);
      }
    },
    [size]
  );

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, size, setPage: load, reload: () => load(state.page) };
}

/** Value that settles `ms` after the last change (for search boxes). */
export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ------------------------------------------------------------------ layout

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, actions, children, className, padded = true }) {
  return (
    <section className={cx("bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]", className)}>
      {title || actions ? (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {actions}
        </header>
      ) : null}
      <div className={padded ? "p-4" : ""}>{children}</div>
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

export function StatCard({ label, value, hint, icon: Icon, tone = "brand" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
      {Icon ? (
        <span className={cx("shrink-0 w-9 h-9 rounded-lg flex items-center justify-center", TONES[tone] || TONES.brand)}>
          <Icon className="w-4 h-4" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-slate-900 truncate">{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Badge({ tone = "gray", children }) {
  return (
    <span className={cx("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap", TONES[tone] || TONES.gray)}>
      {children}
    </span>
  );
}

export function EmptyState({ title = "لا توجد بيانات", hint, action }) {
  return (
    <div className="py-12 text-center">
      <FiInbox className="mx-auto w-7 h-7 text-slate-300" />
      <p className="mt-2 text-sm font-medium text-slate-600">{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

// ------------------------------------------------------------------ controls

const BUTTONS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600/30",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-200",
  ghost: "text-slate-600 hover:text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-600/20",
};

export function Button({ variant = "primary", size = "md", loading = false, className, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap",
        "focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:w-4 [&_svg]:h-4",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
        BUTTONS[variant] || BUTTONS.primary,
        className
      )}
    >
      {loading ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  );
}

/** Small square icon button for table rows (the label is the tooltip and the screen-reader name). */
export function IconButton({ label, icon: Icon, tone = "default", className, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      {...props}
      className={cx(
        "inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
        tone === "danger" ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-brand-700 hover:bg-brand-50",
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export const inputClass =
  "w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 " +
  "focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 disabled:bg-slate-50";

export const textareaClass = inputClass.replace("h-9 ", "min-h-20 py-2 ");

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label ? <span className="block mb-1 text-xs font-medium text-slate-600">{label}</span> : null}
      {children}
      {error ? (
        <span className="block mt-1 text-[11px] text-red-600">{error}</span>
      ) : hint ? (
        <span className="block mt-1 text-[11px] text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

export function SearchBox({ value, onChange, placeholder = "بحث...", className }) {
  return (
    <div className={cx("relative", className)}>
      <FiSearch className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input className={cx(inputClass, "pr-8 pl-7")} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value ? (
        <button type="button" aria-label="مسح" onClick={() => onChange("")}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
          <FiX className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** options: [{ value, label }]; "" means "all" (hide that row with allLabel={null}). */
export function Select({ value, onChange, options, allLabel = "الكل", disabled, className }) {
  return (
    <select className={cx(inputClass, "pl-7 cursor-pointer", className)} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {allLabel !== null ? <option value="">{allLabel}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 mb-4 border-b border-slate-200 overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            "whitespace-nowrap px-3 py-2 -mb-px border-b-2 text-sm font-medium transition-colors cursor-pointer",
            value === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          {t.label}
          {t.count ? <span className="mr-1.5 px-1.5 rounded-full bg-red-500 text-white text-[10px]">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

const dateInputClass = inputClass.replace("w-full ", "w-36 ");

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
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESETS.map((p) => (
        <Button key={p.days} variant="secondary" size="sm" onClick={() => pick(p.days)}>
          {p.label}
        </Button>
      ))}
      <input type="date" aria-label="من" className={dateInputClass} value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })} />
      <span className="text-slate-300">—</span>
      <input type="date" aria-label="إلى" className={dateInputClass} value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })} />
    </div>
  );
}

/** A row of filters above a list; every filter is optional. */
export function Toolbar({ children, actions }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <div className="flex flex-1 flex-wrap items-center gap-2 [&>*]:w-full sm:[&>*]:w-48">{children}</div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

// ------------------------------------------------------------------ data display

/**
 * columns: [{ key, label, render?(row), className? }]
 */
export function DataTable({ columns, rows, rowKey = "id", empty = "لا توجد بيانات", emptyHint, onRowClick, loading }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead>
          <tr className="bg-slate-50/80 text-[11px] text-slate-500 border-b border-slate-200">
            {columns.map((c) => (
              <th key={c.key} className={cx("px-3 py-2 font-medium whitespace-nowrap", c.className)}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td colSpan={columns.length} className="px-3 py-3"><div className="h-3 rounded bg-slate-100 animate-pulse" /></td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr><td colSpan={columns.length}><EmptyState title={empty} hint={emptyHint} /></td></tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={r[rowKey] ?? i}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cx(
                  "border-b border-slate-100 last:border-0 transition-colors",
                  onRowClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/60",
                  loading && "opacity-60"
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx("px-3 py-2.5 text-slate-700 whitespace-nowrap", c.className)}>
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
  if (!total) return null;
  const pages = Math.max(1, Math.ceil(total / (size || 1)));
  const from = page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-slate-100 text-xs text-slate-500">
      <span>{fmtNumber(from)}–{fmtNumber(to)} من {fmtNumber(total)}</span>
      {pages > 1 ? (
        <div className="flex items-center gap-1">
          <IconButton label="السابق" icon={FiChevronRight} disabled={page <= 0} onClick={() => onPage(page - 1)} />
          <span className="px-1">{fmtNumber(page + 1)} / {fmtNumber(pages)}</span>
          <IconButton label="التالي" icon={FiChevronLeft} disabled={page + 1 >= pages} onClick={() => onPage(page + 1)} />
        </div>
      ) : null}
    </div>
  );
}

/** Table + pager for a usePaged() list. */
export function PagedTable({ list, columns, empty, emptyHint, onRowClick, rowKey }) {
  return (
    <Card padded={false}>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} empty={empty} emptyHint={emptyHint}
        onRowClick={onRowClick} rowKey={rowKey} />
      <Pager page={list.page} size={list.size} total={list.total} onPage={list.setPage} />
    </Card>
  );
}

/** Compact media card for grids (courses and similar). actions: IconButtons. */
export function MediaCard({ image, title, subtitle, meta, actions, onClick, fallbackIcon: Fallback }) {
  return (
    <article className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
      <button type="button" onClick={onClick} className="relative aspect-[16/9] bg-slate-100 cursor-pointer" tabIndex={onClick ? 0 : -1}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        ) : Fallback ? (
          <Fallback className="absolute inset-0 m-auto w-7 h-7 text-slate-300" />
        ) : null}
      </button>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-500 line-clamp-2 min-h-8">{subtitle}</p> : null}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">{meta}</div>
          {actions ? <div className="flex items-center gap-0.5 shrink-0">{actions}</div> : null}
        </div>
      </div>
    </article>
  );
}

/** Grid of cards + pager for a usePaged() list. */
export function PagedGrid({ list, renderItem, empty, emptyHint, skeleton = 8 }) {
  return (
    <div>
      {list.loading && list.rows.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: skeleton }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="aspect-[16/9] bg-slate-100 animate-pulse" />
              <div className="p-3 space-y-2"><div className="h-3 w-2/3 rounded bg-slate-100" /><div className="h-3 w-1/2 rounded bg-slate-100" /></div>
            </div>
          ))}
        </div>
      ) : list.rows.length === 0 ? (
        <Card><EmptyState title={empty} hint={emptyHint} /></Card>
      ) : (
        <div className={cx("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", list.loading && "opacity-60")}>
          {list.rows.map(renderItem)}
        </div>
      )}
      {list.total > list.size ? (
        <div className="mt-3 bg-white rounded-xl border border-slate-200">
          <Pager page={list.page} size={list.size} total={list.total} onPage={list.setPage} />
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ dialogs

/** Accessible modal dialog (Esc closes, focus moves inside). Replaces window.confirm/alert. */
/** Modal. Long forms pass closeOnBackdrop={false} so a stray click outside does not lose typed work. */
export function Dialog({ open, title, onClose, children, footer, wide = false, closeOnBackdrop = true }) {
  const ref = useRef(null);
  // Keep the latest onClose without re-running the effect (re-running would steal focus from inputs)
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && closeRef.current?.();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/40" onClick={closeOnBackdrop ? onClose : undefined} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx("relative w-full bg-white rounded-xl shadow-xl outline-none max-h-[90vh] flex flex-col", wide ? "max-w-3xl" : "max-w-md")}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <IconButton label="إغلاق" icon={FiX} onClick={onClose} />
        </header>
        <div className="px-4 py-4 overflow-y-auto text-sm">{children}</div>
        {footer ? <footer className="flex justify-start gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-xl">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "تأكيد", danger = false, busy, onConfirm, onClose }) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant={danger ? "danger" : "primary"} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        </>
      }
    >
      <p className="text-slate-600 leading-relaxed">{message}</p>
    </Dialog>
  );
}
