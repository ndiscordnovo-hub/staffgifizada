"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, Layers, Gauge, Repeat, Film, ImageIcon, Video,
  ShieldCheck, Zap, Wand2, ArrowRight, MessagesSquare,
} from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { DISCORD_INVITE } from "@/lib/utils";

const QUICK = [
  { href: "/image?preset=discord-banner", label: "Criar Banner Discord", desc: "600×240 otimizado", icon: ImageIcon, color: "from-brand-500/35 to-brand-800/10" },
  { href: "/image?preset=discord-avatar", label: "Criar Avatar 512×512", desc: "Perfil perfeito", icon: Sparkles, color: "from-brand-400/30 to-brand-700/10" },
  { href: "/optimize", label: "Otimizar Imagem", desc: "Menor peso, mesma nitidez", icon: Gauge, color: "from-brand-600/30 to-brand-900/10" },
  { href: "/gif", label: "Otimizar GIF", desc: "Comprima sem travar", icon: Film, color: "from-brand-500/30 to-brand-700/10" },
  { href: "/video", label: "Converter Vídeo", desc: "MP4 · WEBM · GIF", icon: Video, color: "from-brand-400/25 to-brand-600/10" },
  { href: "/convert", label: "Converter GIF", desc: "GIF ⇄ vídeo", icon: Repeat, color: "from-brand-600/30 to-brand-800/10" },
  { href: "/batch", label: "Processar em lote", desc: "Dezenas de arquivos", icon: Layers, color: "from-brand-500/25 to-brand-900/10" },
];

const FEATURES = [
  { icon: ShieldCheck, title: "100% privado", desc: "Processamento no navegador. Seus arquivos nunca são enviados a um servidor." },
  { icon: Zap, title: "Extremamente rápido", desc: "WebAssembly + Canvas com pré-visualização em tempo real." },
  { icon: Wand2, title: "Otimização inteligente", desc: "Modos prontos para os limites do Discord (8/10/25MB e Nitro)." },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            A melhor ferramenta de mídia para criadores do Discord
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
            Edite imagens, GIFs e vídeos <br className="hidden sm:block" />
            <span className="gradient-text">como um profissional.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-white/55">
            Redimensione, comprima, converta e otimize em segundos. Sem upload, sem espera, sem marca d'água.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-8">
          <Dropzone />
        </motion.div>
      </section>

      {/* Quick tools */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Ferramentas Rápidas</h2>
          <Link href="/image" className="btn-soft text-xs">Ver tudo <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {QUICK.map(({ href, label, desc, icon: Icon, color }) => (
            <motion.div variants={item} key={href}>
              <Link href={href} className="group card p-4 h-full flex flex-col hover:-translate-y-1 hover:border-brand-400/30 transition-all">
                <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${color} border border-white/10`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="font-semibold text-sm text-white group-hover:text-brand-200 transition-colors">{label}</div>
                <div className="mt-0.5 text-xs text-white/45">{desc}</div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-5">
            <Icon className="h-6 w-6 text-brand-300" />
            <h3 className="mt-3 font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/50">{desc}</p>
          </div>
        ))}
      </section>

      {/* Discord CTA */}
      <section>
        <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
          className="group relative block overflow-hidden rounded-3xl border border-brand-400/30 bg-gradient-to-r from-brand-600/25 via-brand-500/15 to-transparent p-6 sm:p-8 hover:border-brand-400/60 transition-all">
          <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow shrink-0">
                <MessagesSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Entre no nosso servidor do Discord</h3>
                <p className="mt-0.5 text-sm text-white/55">Suporte, novidades, dicas e a comunidade Staff Gifizada. Bora fazer parte!</p>
              </div>
            </div>
            <span className="btn-primary shrink-0">Entrar agora <ArrowRight className="h-4 w-4" /></span>
          </div>
        </a>
      </section>
    </div>
  );
}
