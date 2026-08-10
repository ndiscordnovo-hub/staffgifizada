"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import { useMedia } from "./MediaContext";

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
};
const COLORS = {
  success: "text-emerald-500",
  info: "text-brand-500",
  warn: "text-amber-500",
  error: "text-rose-500",
};

export default function Toaster() {
  const { toasts } = useMedia();
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[min(92vw,360px)]">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.kind] || Info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="bg-white border border-line rounded-xl px-4 py-3 flex items-start gap-3 shadow-card"
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${COLORS[t.kind] || COLORS.info}`} />
              <p className="text-sm text-ink leading-snug">{t.message}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
