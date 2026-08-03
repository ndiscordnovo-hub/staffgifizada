"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileImage, Layers, ArrowRight } from "lucide-react";
import Dropzone from "@/components/Dropzone";

// Lets the user pick how to work before uploading: one file, or many (batch).
export default function ModeChooser({ accept, target, batchHref = "/batch" }) {
  const [mode, setMode] = useState(null); // null | "single"

  if (mode === "single") {
    return (
      <div className="w-full max-w-md mx-auto">
        <Dropzone accept={accept} target={target} compact />
        <button onClick={() => setMode(null)} className="btn-soft w-full mt-3 text-xs">← Voltar aos modos</button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto text-left">
      {/* Modo 1 — Arquivo único */}
      <motion.button
        whileHover={{ y: -4 }}
        onClick={() => setMode("single")}
        className="group card p-5 hover:border-brand-400/40 transition-all"
      >
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500/30 to-brand-700/10 border border-white/10 mb-3">
          <FileImage className="h-6 w-6 text-brand-200" />
        </div>
        <div className="font-bold text-white flex items-center gap-1.5">
          Arquivo Único <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
        </div>
        <p className="mt-1 text-sm text-white/50">
          Edite um arquivo com total liberdade. Ideal pra ajustes exclusivos e personalizar cada peça.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-white/40">
          <li>• Todas as ferramentas disponíveis</li>
          <li>• Edição 100% personalizada</li>
        </ul>
      </motion.button>

      {/* Modo 2 — Lote */}
      <motion.div whileHover={{ y: -4 }}>
        <Link href={batchHref} className="group card p-5 h-full flex flex-col hover:border-brand-400/40 transition-all">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500/25 to-brand-700/10 border border-white/10 mb-3">
            <Layers className="h-6 w-6 text-brand-200" />
          </div>
          <div className="font-bold text-white flex items-center gap-1.5">
            Em Lote <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
          </div>
          <p className="mt-1 text-sm text-white/50">
            Envie vários arquivos e aplique a mesma configuração em todos de uma vez. Rapidez e produtividade.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-white/40">
            <li>• Dezenas de arquivos juntos</li>
            <li>• Uma config pra todos + ZIP</li>
          </ul>
        </Link>
      </motion.div>
    </div>
  );
}
