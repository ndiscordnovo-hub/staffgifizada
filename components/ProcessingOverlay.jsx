"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const DEFAULT_MSGS = [
  "Preparando os quadros…",
  "Aplicando os ajustes…",
  "Otimizando as cores…",
  "Montando a animação…",
  "Quase lá…",
];

// A pretty full-screen processing overlay with animated ring + progress.
export default function ProcessingOverlay({ open, progress, title = "Processando", messages = DEFAULT_MSGS }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!open) { setMsgIndex(0); return; }
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 2200);
    return () => clearInterval(id);
  }, [open, messages.length]);

  const pct = typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : null;

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
              {/* spinning gradient ring */}
              <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: "1.5s", background: "conic-gradient(from 0deg, transparent 0%, #e63946 70%, #ff9195 100%)", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 9px))", mask: "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 9px))" }} />
              {/* faint track */}
              <div className="absolute inset-0 rounded-full border-[9px] border-white/5" />
              {/* center content: % or pulsing icon */}
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

            {/* rotating message */}
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

            <p className="mt-4 text-[11px] text-white/30">Tudo acontece no seu navegador — pode levar alguns segundos.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
