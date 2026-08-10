"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, Loader2, XCircle, Clock, Zap, Cpu, PackageCheck } from "lucide-react";

const STAGE_META = {
  waiting:    { label: "Aguardando",        icon: Clock,        color: "text-slate-400",   bg: "bg-slate-100" },
  loading:    { label: "Carregando FFmpeg", icon: Zap,          color: "text-amber-500",   bg: "bg-amber-50" },
  processing: { label: "Processando",      icon: Cpu,          color: "text-blue-500",    bg: "bg-blue-50" },
  optimizing: { label: "Otimizando",       icon: Sparkles,     color: "text-purple-500",  bg: "bg-purple-50" },
  generating: { label: "Gerando arquivo",  icon: PackageCheck,  color: "text-emerald-500", bg: "bg-emerald-50" },
  done:       { label: "Concluído",         icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  error:      { label: "Erro",             icon: XCircle,      color: "text-red-500",     bg: "bg-red-50" },
};

const DEFAULT_MSGS = [
  "Preparando os quadros…",
  "Aplicando os ajustes…",
  "Otimizando as cores…",
  "Montando a animação…",
  "Quase lá…",
];

export default function ProcessingOverlay({ open, progress, title = "Processando", messages = DEFAULT_MSGS, stages }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!open) { setMsgIndex(0); return; }
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 2200);
    return () => clearInterval(id);
  }, [open, messages.length]);

  const pct = typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : null;
  const hasStages = stages && stages.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] grid place-items-center p-4 bg-black/80 backdrop-blur-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center shadow-card"
          >
            {/* Animated ring */}
            <div className="relative mx-auto h-28 w-28">
              <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: "1.5s", background: "conic-gradient(from 0deg, transparent 0%, #e63946 70%, #ff9195 100%)", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 9px))", mask: "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 9px))" }} />
              <div className="absolute inset-0 rounded-full border-[9px] border-white/5" />
              <div className="absolute inset-0 grid place-items-center">
                {pct != null ? (
                  <span className="text-2xl font-extrabold tabular-nums text-white">{pct}<span className="text-sm text-white/50">%</span></span>
                ) : (
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                    <Sparkles className="h-8 w-8 text-brand-300" />
                  </motion.div>
                )}
              </div>
            </div>

            <h3 className="mt-6 text-lg font-bold text-white">{title}</h3>

            {/* progress bar */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
              {pct != null ? (
                <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-fuchsia-400"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ease: "easeOut", duration: 0.3 }} />
              ) : (
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand-400 to-fuchsia-400 animate-[shimmer_1.2s_infinite]" />
              )}
            </div>

            {/* Pipeline stages */}
            {hasStages && (
              <div className="mt-5 space-y-1.5 text-left">
                {stages.map((s, i) => {
                  const meta = STAGE_META[s.status] || STAGE_META.waiting;
                  const Icon = meta.icon;
                  const isActive = s.status === "processing" || s.status === "loading" || s.status === "optimizing" || s.status === "generating";
                  return (
                    <motion.div
                      key={s.id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${isActive ? "bg-white/15 ring-1 ring-white/10" : "bg-white/5"}`}
                    >
                      <div className={`shrink-0 h-6 w-6 rounded-lg grid place-items-center ${isActive ? "bg-white/20" : s.status === "done" ? "bg-emerald-500/20" : s.status === "error" ? "bg-red-500/20" : "bg-white/10"}`}>
                        {isActive ? (
                          <Loader2 className={`h-3.5 w-3.5 animate-spin ${meta.color}`} />
                        ) : (
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                        )}
                      </div>
                      <span className={`text-xs font-medium flex-1 ${isActive ? "text-white" : s.status === "done" ? "text-emerald-400" : s.status === "error" ? "text-red-400" : "text-white/40"}`}>
                        {s.label || meta.label}
                      </span>
                      {s.detail && (
                        <span className="text-[10px] text-white/30 tabular-nums">{s.detail}</span>
                      )}
                      {s.status === "done" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* rotating message (only when no stages) */}
            {!hasStages && (
              <div className="mt-4 h-5 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={msgIndex}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-white/50"
                  >
                    {pct != null && pct < 100 ? messages[msgIndex] : "Finalizando…"}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            <p className="mt-4 text-[11px] text-white/30">Tudo acontece no seu navegador — pode levar alguns segundos.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { STAGE_META };
