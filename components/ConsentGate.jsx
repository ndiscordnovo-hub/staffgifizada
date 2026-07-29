"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldCheck, Lock, Zap } from "lucide-react";
import { DISCORD_INVITE, SITE_NAME } from "@/lib/utils";

const CONSENT_KEY = "nebula.consent.v1"; // bump the suffix to re-prompt everyone

export default function ConsentGate() {
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState(true); // assume accepted until we check (no flash)
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    const ok = localStorage.getItem(CONSENT_KEY) === "1";
    setAccepted(ok);
    if (!ok) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "1");
    document.body.style.overflow = "";
    setAccepted(true);
  };

  if (!mounted || accepted) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] grid place-items-center p-4 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="glass-strong w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-card"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bem-vindo ao {SITE_NAME}</h2>
              <p className="text-xs text-white/45">Editor de mídia para criadores do Discord</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2.5">
            <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <Lock className="h-4 w-4 text-brand-300 mt-0.5 shrink-0" />
              <p className="text-sm text-white/70"><strong className="text-white">100% privado.</strong> Seus arquivos são processados no seu navegador e nunca enviados a servidores.</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <ShieldCheck className="h-4 w-4 text-brand-300 mt-0.5 shrink-0" />
              <p className="text-sm text-white/70">Você é responsável pelo conteúdo que edita. Não use para material ilegal ou de terceiros sem permissão.</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <Zap className="h-4 w-4 text-brand-300 mt-0.5 shrink-0" />
              <p className="text-sm text-white/70">Ferramenta gratuita, fornecida "como está", sem garantias.</p>
            </div>
          </div>

          <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-brand-500 rounded"
            />
            <span className="text-sm text-white/70">
              Li e concordo com os{" "}
              <Link href="/termos" target="_blank" className="text-brand-300 underline hover:text-brand-200">Termos de Uso</Link>
              {" "}e a{" "}
              <Link href="/privacidade" target="_blank" className="text-brand-300 underline hover:text-brand-200">Política de Privacidade</Link>.
            </span>
          </label>

          <button
            disabled={!checked}
            onClick={accept}
            className="btn-primary w-full mt-5"
          >
            Concordar e entrar
          </button>

          <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs text-white/40 hover:text-brand-300 transition-colors">
            💬 Entre também no nosso servidor do Discord
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
