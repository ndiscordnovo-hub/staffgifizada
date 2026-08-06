"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Layers, Gauge, Film, ImageIcon, Video,
} from "lucide-react";
import { DISCORD_INVITE, SITE_VERSION } from "@/lib/utils";
import { CHANGELOG } from "@/lib/changelog";

const FEATURES = [
  {
    icon: ImageIcon,
    title: "Editor de Imagens",
    desc: "Corte, ajustes de cor, texto, fundo e presets do Discord.",
    href: "/image",
    gradient: "from-[#f2555f] to-[#b3121f]",
  },
  {
    icon: Film,
    title: "Editor de GIF",
    desc: "Ajuste todos os frames, recorte e otimize mantendo o GIF.",
    href: "/gif",
    gradient: "from-[#ff8f96] to-[#e63946]",
  },
  {
    icon: Video,
    title: "Editor de Vídeos",
    desc: "Corte, comprima, gire e converta em GIF com um clique.",
    href: "/video",
    gradient: "from-[#ff6a5a] to-[#c31724]",
  },
  {
    icon: Gauge,
    title: "Otimização Inteligente",
    desc: "Reduza o peso para os limites do Discord (8/10/25MB).",
    href: "/optimize",
    gradient: "from-[#f2555f] to-[#7a0f18]",
  },
  {
    icon: Sparkles,
    title: "Assistente IA",
    desc: "Remova o fundo de fotos automaticamente, no navegador.",
    href: "/image",
    gradient: "from-[#ff8f96] to-[#b3121f]",
  },
  {
    icon: Layers,
    title: "Processamento em Lote",
    desc: "A mesma edição aplicada a vários arquivos de uma vez.",
    href: "/batch",
    gradient: "from-[#e63946] to-[#7a0f18]",
  },
];

const STATS = [
  { label: "Arquivos processados", prefix: "+", suffix: "K", raw: 120 },
  { label: "Usuários ativos", prefix: "+", suffix: "", raw: 3500 },
  { label: "Ferramentas disponíveis", prefix: "", suffix: "", raw: 12 },
  { label: "Tempo médio", prefix: "~", suffix: "s", raw: 2 },
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
      <div className="mt-1.5 text-sm text-white/50">{stat.label}</div>
    </motion.div>
  );
}

function WelcomeModal({ onClose }) {
  const router = useRouter();
  return (
    <motion.div
      className="fixed inset-0 z-[200] grid place-items-center p-5"
      style={{ background: "rgba(5,3,5,0.74)", backdropFilter: "blur(16px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl p-8 text-center border border-white/15"
        style={{
          background: "linear-gradient(180deg,#17131a,#100c12)",
          boxShadow: "0 40px 90px -30px #000, 0 0 0 1px rgba(255,255,255,0.03) inset",
        }}
        initial={{ y: 16, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <div
          className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-3xl"
          style={{
            background: "linear-gradient(120deg,#f2555f,#b3121f)",
            boxShadow: "0 16px 34px -12px rgba(242,85,95,0.7), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          👋
        </div>
        <h3 className="text-xl font-extrabold tracking-tight">Bem-vindo ao GifEdition!</h3>
        <p className="mt-2.5 text-white/55 text-[15px] leading-relaxed">
          Edite imagens, GIFs e vídeos com facilidade. Escolha uma categoria no menu ou
          clique em &ldquo;Começar Agora&rdquo; para iniciar sua primeira edição.
        </p>
        <button
          onClick={() => { onClose(); router.push("/image"); }}
          className="btn-primary mt-5 w-full text-base py-3 rounded-2xl font-bold"
        >
          🚀 Começar Agora
        </button>
        <button
          onClick={onClose}
          className="mt-3 text-sm text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
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
      {/* Ambient blobs */}
      <div className="landing-aura" aria-hidden="true">
        <div className="landing-blob b1" />
        <div className="landing-blob b2" />
        <div className="landing-blob b3" />
      </div>

      {/* Hero */}
      <section className="relative pt-8 sm:pt-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/55">
            <span className="h-[7px] w-[7px] rounded-full bg-[#ff6a5a] shadow-[0_0_12px_#ff6a5a] animate-pulse" />
            A melhor plataforma de mídia para o Discord
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]"
          style={{ textWrap: "balance" }}
        >
          Edite imagens, GIFs e vídeos{" "}
          <span className="gradient-text">como um profissional.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-5 mx-auto max-w-2xl text-white/50 text-base sm:text-lg"
          style={{ textWrap: "balance" }}
        >
          Rapidez, qualidade e praticidade em um só lugar — direto no navegador, sem instalar nada e sem marca d&apos;água.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-8 flex gap-3 justify-center flex-wrap"
        >
          <Link href="/image" className="btn-primary text-base px-7 py-3 rounded-2xl font-bold shadow-glow">
            🚀 Começar Agora
          </Link>
          <a href="#recursos" className="btn-ghost text-base px-7 py-3 rounded-2xl font-bold">
            📖 Conhecer Recursos
          </a>
        </motion.div>
      </section>

      {/* Features */}
      <section id="recursos">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-[.16em] uppercase text-[#ff6a5a]">
            Tudo em um só lugar
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ textWrap: "balance" }}>
            Ferramentas para todo tipo de mídia
          </h2>
          <p className="mt-3 text-white/50">Editores completos e inteligentes, pensados para criadores de conteúdo.</p>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map(({ icon: Icon, title, desc, href, gradient }) => (
            <motion.div variants={featureItem} key={title}>
              <Link
                href={href}
                className="group card relative p-6 h-full flex flex-col overflow-hidden hover:-translate-y-1.5 hover:border-white/15 transition-all duration-200"
              >
                <div className="absolute inset-x-[-30%] bottom-[-50%] h-[70%] blur-[46px] opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(circle,#e6394688,transparent_60%)]" />
                <div
                  className={`relative mb-4 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-gradient-to-br ${gradient}`}
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 12px 26px -12px rgba(179,18,31,0.7)" }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="relative font-bold text-lg tracking-tight">{title}</h3>
                <p className="relative mt-1.5 text-sm text-white/50">{desc}</p>
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
          <h3 className="text-lg font-bold flex items-center gap-2.5">
            📣 Últimas novidades
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#f2555f22] border border-[#f2555f55] text-[#ff8f96]">
              v{latest.version}
            </span>
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            {latest.added?.map((t, i) => (
              <li key={`a${i}`} className="flex gap-3 text-white/55 text-sm">
                <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-lg h-fit bg-[#37d67a1e] text-[#7ff0b0] border border-[#37d67a44] tracking-wide">
                  NOVO
                </span>
                {t}
              </li>
            ))}
            {latest.improved?.slice(0, 2).map((t, i) => (
              <li key={`i${i}`} className="flex gap-3 text-white/55 text-sm">
                <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-lg h-fit bg-[#f2555f1e] text-[#ff8f96] border border-[#f2555f44] tracking-wide">
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
            background: "radial-gradient(120% 150% at 50% 0%, rgba(88,101,242,0.19), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))",
          }}
        >
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Faça parte da comunidade
          </h3>
          <p className="mt-2.5 text-white/50 max-w-sm">
            Entre no nosso Discord para novidades, suporte e dicas com outros criadores.
          </p>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noreferrer"
            className="btn mt-5 text-base px-7 py-3 rounded-2xl font-bold text-white"
            style={{ background: "#5865F2", boxShadow: "0 14px 30px -12px #5865F2" }}
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
            background: "radial-gradient(120% 150% at 50% 0%, rgba(230,57,70,0.19), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))",
          }}
        >
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Pronto para começar?
          </h3>
          <p className="mt-2.5 text-white/50">
            Escolha uma ferramenta no menu ou envie seu primeiro arquivo agora mesmo.
          </p>
          <Link href="/image" className="btn-primary mt-5 text-base px-7 py-3 rounded-2xl font-bold shadow-glow inline-flex">
            🚀 Começar Agora
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
