"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Image as ImageIcon, Film, Video, Repeat, Gauge,
  Layers, History, Settings, Sparkles, Menu, X, TerminalSquare, FolderHeart, MessagesSquare,
} from "lucide-react";
import { DISCORD_INVITE } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Início", icon: Home },
  { href: "/image", label: "Imagens", icon: ImageIcon },
  { href: "/gif", label: "GIF", icon: Film },
  { href: "/video", label: "Vídeos", icon: Video },
  { href: "/convert", label: "Conversor", icon: Repeat },
  { href: "/optimize", label: "Otimização", icon: Gauge },
  { href: "/batch", label: "Processamento em lote", icon: Layers },
  { href: "/saved", label: "Salvos", icon: FolderHeart },
  { href: "/history", label: "Histórico", icon: History },
  { href: "/logs", label: "Logs", icon: TerminalSquare },
  { href: "/settings", label: "Configurações", icon: Settings },
];

function NavList({ pathname, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
              ${active ? "text-white" : "text-white/55 hover:text-white hover:bg-white/[0.05]"}`}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/25 to-brand-500/5 border border-brand-400/30"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className={`relative h-[18px] w-[18px] ${active ? "text-brand-300" : ""}`} />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-bold tracking-tight text-white">Gifizada<span className="gradient-text">Studio</span></div>
        <div className="text-[10px] uppercase tracking-widest text-white/35">media toolkit</div>
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between glass-strong px-4 py-3">
        <Brand />
        <div className="flex items-center gap-2">
          <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-gradient-to-br from-brand-500/25 to-brand-800/10 border border-brand-400/40"
            aria-label="Entrar no Discord">
            <MessagesSquare className="h-4 w-4 text-brand-300" /> Discord
          </a>
          <button onClick={() => setOpen(true)} className="btn-ghost !p-2.5" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop rail */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-ink-850/60 backdrop-blur-xl">
        <Brand />
        <NavList pathname={pathname} />
        <div className="mt-auto p-4">
          <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
            className="group block rounded-2xl p-4 bg-gradient-to-br from-brand-500/20 to-brand-800/10 border border-brand-400/30 hover:border-brand-400/60 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <MessagesSquare className="h-4 w-4 text-brand-300" /> Entre no Discord
            </div>
            <p className="mt-1 text-[11px] text-white/45">Novidades, suporte e a comunidade Staff Gifizada.</p>
          </a>
          <p className="mt-3 text-center text-[11px] text-white/30">100% privado · grátis</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 z-50 h-full w-72 flex flex-col bg-ink-850 border-r border-white/10"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button onClick={() => setOpen(false)} className="btn-soft !p-2.5 mr-3" aria-label="Fechar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
              <div className="mt-auto p-4">
                <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl p-3 bg-gradient-to-br from-brand-500/20 to-brand-800/10 border border-brand-400/30 text-white font-semibold text-sm">
                  <MessagesSquare className="h-4 w-4 text-brand-300" /> Entre no Discord
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
