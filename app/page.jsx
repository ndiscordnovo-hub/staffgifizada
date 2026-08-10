"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Layers, Gauge, Film, ImageIcon, Video,
  Lock, Zap, Smile, Repeat, UploadCloud, ArrowRight,
} from "lucide-react";
import { DISCORD_INVITE, SITE_VERSION } from "@/lib/utils";
import { CHANGELOG } from "@/lib/changelog";
import Dropzone from "@/components/Dropzone";

const TOOLS = [
  { icon: ImageIcon, label: "Imagens", href: "/image" },
  { icon: Film, label: "GIF", href: "/gif" },
  { icon: Video, label: "Vídeos", href: "/video" },
  { icon: Smile, label: "Emoji", href: "/emoji" },
  { icon: Gauge, label: "Otimizar", href: "/optimize" },
  { icon: Repeat, label: "Converter", href: "/convert" },
  { icon: Layers, label: "Lote", href: "/batch" },
  { icon: Sparkles, label: "Meme", href: "/meme" },
];

const FEATURES = [
  {
    icon: ImageIcon,
    title: "Editor de Imagens",
    desc: "Corte, ajustes de cor, texto, fundo e presets do Discord.",
    href: "/image",
  },
  {
    icon: Film,
    title: "Editor de GIF",
    desc: "Ajuste todos os frames, recorte e otimize mantendo o GIF.",
    href: "/gif",
  },
  {
    icon: Video,
    title: "Editor de Vídeos",
    desc: "Corte, comprima, gire e converta em GIF com um clique.",
    href: "/video",
  },
  {
    icon: Gauge,
    title: "Otimização Inteligente",
    desc: "Reduza o peso para os limites do Discord (8/10/25MB).",
    href: "/optimize",
  },
  {
    icon: Sparkles,
    title: "Remoção de Fundo",
    desc: "Remova o fundo de fotos automaticamente, no navegador.",
    href: "/image",
  },
  {
    icon: Layers,
    title: "Processamento em Lote",
    desc: "A mesma edição aplicada a vários arquivos de uma vez.",
    href: "/batch",
  },
];

const TRUST = [
  { icon: Lock, text: "100% privado" },
  { icon: Zap, text: "Sem instalação" },
  { icon: Sparkles, text: "Sem marca d'água" },
];

const STATS = [
  { label: "Ferramentas disponíveis", prefix: "", suffix: "", raw: 12 },
  { label: "Formatos suportados", prefix: "+", suffix: "", raw: 15 },
  { label: "Processamento local", prefix: "", suffix: "%", raw: 100 },
  { label: "Custo para usar", prefix: "R$", suffix: "", raw: 0 },
];

function StatCard({ stat, index }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); io.disconnect(); } },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let t0 = null;
    let raf;
    function step(t) {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / 900, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(stat.raw * ease));
      if (p < 1) raf = requestAnimationFrame(step);
      else setCount(stat.raw);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, stat.raw]);

  let display = stat.prefix;
  if (stat.suffix === "K") display += count.toLocaleString("pt-BR") + "K";
  else if (stat.suffix === "s") display += count + "s";
  else display += count.toLocaleString("pt-BR");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      className="card p-6 text-center"
    >
      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums gradient-text">
        {display}
      </div>
      <div className="mt-1.5 text-sm text-muted">{stat.label}</div>
    </motion.div>
  );
}

function WelcomeModal({ onClose }) {
  const router = useRouter();
  return (
    <motion.div
      className="fixed inset-0 z-[200] grid place-items-center p-5 bg-black/40 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl p-8 text-center bg-white border border-line shadow-card"
        initial={{ y: 16, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <div
          className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-3xl"
          style={{
            background: "linear-gradient(135deg, #FF5A78, #F31845, #D70D35)",
            boxShadow: "0 16px 34px -12px rgba(243,24,69,0.5)",
          }}
        >
          👋
        </div>
        <h3 className="text-xl font-extrabold tracking-tight text-ink">Bem-vindo ao GifEdition!</h3>
        <p className="mt-2.5 text-muted text-[15px] leading-relaxed">
          Edite imagens, GIFs e vídeos com facilidade. Escolha uma categoria no menu ou
          clique em &ldquo;Começar Agora&rdquo; para iniciar sua primeira edição.
        </p>
        <button
          onClick={() => { onClose(); router.push("/image"); }}
          className="btn-primary mt-5 w-full text-base py-3"
        >
          Começar Agora
        </button>
        <button
          onClick={onClose}
          className="mt-3 text-sm text-subtle hover:text-brand-500 transition-colors underline underline-offset-2"
        >
          Não mostrar novamente
        </button>
      </motion.div>
    </motion.div>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const featureItem = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const latest = CHANGELOG[0];

  useEffect(() => {
    if (!localStorage.getItem("gifedition.welcomed")) {
      setShowWelcome(true);
    }
  }, []);

  function closeWelcome() {
    localStorage.setItem("gifedition.welcomed", "1");
    setShowWelcome(false);
  }

  return (
    <div className="space-y-14 -mt-4">
      {/* Hero */}
      <section className="relative pt-8 sm:pt-12">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
          {/* Text side */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-line px-4 py-1.5 text-xs font-semibold text-muted shadow-card-sm">
                <span className="h-[7px] w-[7px] rounded-full bg-brand-500 shadow-[0_0_12px_rgba(243,24,69,0.5)] animate-pulse" />
                A melhor plataforma de mídia para o Discord
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.05] text-ink"
              style={{ textWrap: "balance" }}
            >
              Edite imagens, GIFs e vídeos{" "}
              <span className="gradient-text">como um profissional.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-5 max-w-xl text-muted text-base sm:text-lg"
              style={{ textWrap: "balance" }}
            >
              Rapidez, qualidade e praticidade em um só lugar — direto no navegador, sem instalar nada e sem marca d&apos;água.
            </motion.p>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-6 flex flex-wrap gap-4"
            >
              {TRUST.map(({ icon: TIcon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-muted">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 border border-brand-100">
                    <TIcon className="h-4 w-4 text-brand-500" />
                  </div>
                  {text}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-8 flex gap-3 flex-wrap"
            >
              <Link href="/image" className="btn-primary text-base px-7 py-3">
                Começar Agora
              </Link>
              <a href="#recursos" className="btn-ghost text-base px-7 py-3">
                Conhecer Recursos
              </a>
            </motion.div>
          </div>

          {/* Upload panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <Dropzone />
          </motion.div>
        </div>
      </section>

      {/* Quick tools grid */}
      <section>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {TOOLS.map(({ icon: TIcon, label, href }) => (
            <Link
              key={href}
              href={href}
              className="group card flex flex-col items-center gap-2 py-4 px-2 hover:border-brand-200 hover:-translate-y-1 transition-all"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 border border-brand-100 group-hover:bg-brand-100 transition-colors">
                <TIcon className="h-5 w-5 text-brand-500" />
              </div>
              <span className="text-xs font-semibold text-muted group-hover:text-brand-500 transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="recursos">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-[.16em] uppercase text-brand-500">
            Tudo em um só lugar
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink" style={{ textWrap: "balance" }}>
            Ferramentas para todo tipo de mídia
          </h2>
          <p className="mt-3 text-muted">Editores completos e inteligentes, pensados para criadores de conteúdo.</p>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map(({ icon: Icon, title, desc, href }) => (
            <motion.div variants={featureItem} key={title}>
              <Link
                href={href}
                className="group card relative p-6 h-full flex flex-col overflow-hidden hover:-translate-y-1.5 hover:border-brand-200 transition-all duration-200"
              >
                <div className="mb-4 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg tracking-tight text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{desc}</p>
                <div className="mt-auto pt-4">
                  <span className="text-sm font-semibold text-brand-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Usar ferramenta <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </section>

      {/* Changelog + Community */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-4">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="card p-6"
        >
          <h3 className="text-lg font-bold flex items-center gap-2.5 text-ink">
            Últimas novidades
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-brand-50 border border-brand-100 text-brand-500">
              v{latest.version}
            </span>
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            {latest.added?.map((t, i) => (
              <li key={`a${i}`} className="flex gap-3 text-muted text-sm">
                <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-lg h-fit bg-emerald-50 text-emerald-600 border border-emerald-200 tracking-wide">
                  NOVO
                </span>
                {t}
              </li>
            ))}
            {latest.improved?.slice(0, 2).map((t, i) => (
              <li key={`i${i}`} className="flex gap-3 text-muted text-sm">
                <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-lg h-fit bg-brand-50 text-brand-500 border border-brand-100 tracking-wide">
                  MELHORIA
                </span>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="card p-8 text-center flex flex-col items-center justify-center"
          style={{
            background: "radial-gradient(120% 150% at 50% 0%, rgba(88,101,242,0.06), transparent 60%), #fff",
          }}
        >
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
            Faça parte da comunidade
          </h3>
          <p className="mt-2.5 text-muted max-w-sm">
            Entre no nosso Discord para novidades, suporte e dicas com outros criadores.
          </p>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-5 text-base px-7 py-3 rounded-2xl font-bold text-white cursor-pointer"
            style={{ background: "#5865F2", boxShadow: "0 14px 30px -12px rgba(88,101,242,0.5)" }}
          >
            Entrar no Discord
          </a>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="card p-8 text-center"
          style={{
            background: "radial-gradient(120% 150% at 50% 0%, rgba(243,24,69,0.05), transparent 60%), #fff",
          }}
        >
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
            Pronto para começar?
          </h3>
          <p className="mt-2.5 text-muted">
            Escolha uma ferramenta no menu ou envie seu primeiro arquivo agora mesmo.
          </p>
          <Link href="/image" className="btn-primary mt-5 text-base px-7 py-3 inline-flex">
            Começar Agora
          </Link>
        </motion.div>
      </section>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && <WelcomeModal onClose={closeWelcome} />}
      </AnimatePresence>
    </div>
  );
}
