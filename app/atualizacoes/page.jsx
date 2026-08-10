"use client";
import { motion } from "framer-motion";
import { Rocket, Sparkles, Zap, Bug } from "lucide-react";
import { CHANGELOG } from "@/lib/changelog";

function Section({ icon: Icon, title, items, color }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <div className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
        <Icon className="h-4 w-4" /> {title}
      </div>
      <ul className="mt-1.5 space-y-1 pl-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span className="text-line">•</span> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AtualizacoesPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Rocket className="h-6 w-6 text-brand-500" /> Atualizações
        </h1>
        <p className="mt-1 text-sm text-subtle">Tudo que mudou no Gif Edition, versão por versão.</p>
      </div>

      <div className="space-y-4">
        {CHANGELOG.map((v, i) => (
          <motion.div
            key={v.version}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1 text-sm font-bold text-brand-500">v{v.version}</span>
                {i === 0 && <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">mais recente</span>}
              </div>
              <span className="text-xs text-subtle">{v.date}</span>
            </div>
            <Section icon={Sparkles} title="Adicionado" items={v.added} color="text-brand-500" />
            <Section icon={Zap} title="Melhorias" items={v.improved} color="text-amber-500" />
            <Section icon={Bug} title="Correções" items={v.fixed} color="text-emerald-500" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
