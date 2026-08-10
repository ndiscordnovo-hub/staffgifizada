"use client";
import { motion } from "framer-motion";

export function Panel({ title, icon: Icon, children, className = "" }) {
  return (
    <div className={`card p-4 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          {Icon && <Icon className="h-4 w-4 text-brand-500" />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, unit = "", onChange, onReset }) {
  return (
    <div className="mb-3.5">
      <div className="field-label">
        <span>{label}</span>
        <span className="tabular-nums text-ink">
          {value}{unit}
          {onReset && value !== undefined && (
            <button onClick={onReset} className="ml-2 text-subtle hover:text-muted">↺</button>
          )}
        </span>
      </div>
      <input
        type="range"
        className="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export function Segmented({ options, value, onChange, className = "", scroll = false, wrap = false }) {
  const container = scroll ? "overflow-x-auto no-scrollbar" : wrap ? "flex-wrap" : "";
  const btnSize = scroll || wrap ? "shrink-0 px-3.5" : "flex-1 px-2.5";
  return (
    <div className={`relative flex gap-1 rounded-xl bg-[#F6F5F6] border border-line p-1 ${container} ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative ${btnSize} rounded-lg py-2 text-xs font-medium transition-colors whitespace-nowrap
              ${active ? "text-brand-500" : "text-muted hover:text-ink"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join()}`}
                className="absolute inset-0 rounded-lg bg-white border border-brand-200 shadow-card-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              {o.icon && <o.icon className="h-3.5 w-3.5" />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ToolButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] font-medium transition-all
        ${active
          ? "bg-brand-50 border-brand-200 text-brand-500"
          : "bg-white border-line text-muted hover:text-ink hover:border-brand-200 hover:-translate-y-0.5"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function ProgressBar({ value }) {
  const indeterminate = value == null;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      {indeterminate ? (
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 animate-[shimmer_1.2s_infinite]" />
      ) : (
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />
      )}
    </div>
  );
}

export function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-[#F6F5F6] border border-line px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-subtle">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${accent || "text-ink"}`}>{value}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200">
        <Icon className="h-8 w-8 text-brand-500" />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
