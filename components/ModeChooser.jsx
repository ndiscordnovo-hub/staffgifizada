"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileImage, Layers, ArrowRight } from "lucide-react";
import Dropzone from "@/components/Dropzone";

export default function ModeChooser({ accept, target, batchHref = "/batch", onBatch }) {
  const [mode, setMode] = useState(null);
  const batchInputRef = useRef(null);

  if (mode === "single") {
    return (
      <div className="w-full max-w-md mx-auto">
        <Dropzone accept={accept} target={target} compact />
        <button onClick={() => setMode(null)} className="btn-soft w-full mt-3 text-xs">← Voltar aos modos</button>
      </div>
    );
  }

  const BatchInner = (
    <>
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 mb-3">
        <Layers className="h-6 w-6 text-brand-500" />
      </div>
      <div className="font-bold text-ink flex items-center gap-1.5">
        Em Lote <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
      </div>
      <p className="mt-1 text-sm text-muted">
        Envie vários arquivos e edite todos ao mesmo tempo — as mesmas ferramentas, aplicadas a todos. Rapidez e padrão.
      </p>
      <ul className="mt-3 space-y-1 text-xs text-subtle">
        <li>• 2 a 15 arquivos juntos</li>
        <li>• Mesma edição pra todos + ZIP</li>
      </ul>
    </>
  );

  return (
    <div className="grid sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto text-left">
      <motion.button whileHover={{ y: -4 }} onClick={() => setMode("single")} className="group card p-5 hover:border-brand-200 transition-all">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 mb-3">
          <FileImage className="h-6 w-6 text-brand-500" />
        </div>
        <div className="font-bold text-ink flex items-center gap-1.5">
          Arquivo Único <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
        </div>
        <p className="mt-1 text-sm text-muted">
          Edite um arquivo com total liberdade. Ideal pra ajustes exclusivos e personalizar cada peça.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-subtle">
          <li>• Todas as ferramentas disponíveis</li>
          <li>• Edição 100% personalizada</li>
        </ul>
      </motion.button>

      {onBatch ? (
        <>
          <motion.button whileHover={{ y: -4 }} onClick={() => batchInputRef.current?.click()} className="group card p-5 text-left hover:border-brand-200 transition-all">
            {BatchInner}
          </motion.button>
          <input
            ref={batchInputRef} type="file" accept={accept} multiple className="hidden"
            onChange={(e) => { onBatch(Array.from(e.target.files || [])); e.target.value = ""; }}
          />
        </>
      ) : (
        <motion.div whileHover={{ y: -4 }}>
          <Link href={batchHref} className="group card p-5 h-full flex flex-col hover:border-brand-200 transition-all">
            {BatchInner}
          </Link>
        </motion.div>
      )}
    </div>
  );
}
