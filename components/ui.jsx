"use client";
import { motion } from "framer-motion";

export function Panel({ title, icon: Icon, children, className = "" }) {
  return (
    <div className={`card p-4 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          {Icon && <Icon className="h-4 w-4 text-brand-300" />}
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
        <span className="tabular-nums text-white/70">
          {value}{unit}
          {onReset && value !== undefined && (
            <button onClick={onReset} className="ml-2 text-white/30 hover:text-white/70">↺</button>
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

export function Segmented({ options, value, onChange, className = "", scroll = false }) {
  return (
    <div className={`relative flex gap-1 rounded-xl bg-white/[0.04] border border-white/10 p-1 ${scroll ? "overflow-x-auto no-scrollbar" : ""} ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative ${scroll ? "shrink-0 px-3.5" : "flex-1 px-2.5"} rounded-lg py-2 text-xs font-medium transition-colors whitespace-nowrap
              ${active ? "text-white" : "text-white/50 hover:text-white/80"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join()}`}
                className="absolute inset-0 rounded-lg bg-brand-500/30 border border-brand-400/40"
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
          ? "bg-brand-500/20 border-brand-400/50 text-white"
          : "bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.07] hover:-translate-y-0.5"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// Animated indeterminate/determinate progress bar.
export function ProgressBar({ value }) {
  const indeterminate = value == null;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
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
    <div className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${accent || "text-white"}`}>{value}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/25 to-brand-700/15 border border-white/10">
        <Icon className="h-8 w-8 text-brand-200" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-white/50">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
