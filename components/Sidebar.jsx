"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Image as ImageIcon, Film, Video, Repeat, Gauge,
  Layers, History, Settings, Sparkles, Menu, X, TerminalSquare, FolderHeart, MessagesSquare,
  Smile, Laugh, QrCode, ShieldCheck, Rocket, Wand2, Search, Star, ChevronDown,
} from "lucide-react";
import { DISCORD_INVITE } from "@/lib/utils";

const HOME = { href: "/", label: "Início", icon: Home };

const GROUPS = [
  {
    id: "editores", label: "Editores", icon: Wand2, items: [
      { href: "/image", label: "Imagens", icon: ImageIcon },
      { href: "/gif", label: "GIF", icon: Film },
      { href: "/video", label: "Vídeos", icon: Video },
      { href: "/emoji", label: "Emoji & Sticker", icon: Smile },
      { href: "/meme", label: "Meme", icon: Laugh },
    ],
  },
  {
    id: "otimizacao", label: "Otimização & Conversão", icon: Gauge, items: [
      { href: "/optimize", label: "Otimização", icon: Gauge },
      { href: "/convert", label: "Conversor", icon: Repeat },
      { href: "/batch", label: "Processamento em lote", icon: Layers },
    ],
  },
  {
    id: "recursos", label: "Recursos", icon: FolderHeart, items: [
      { href: "/qrcode", label: "QR Code", icon: QrCode },
      { href: "/saved", label: "Salvos", icon: FolderHeart },
      { href: "/history", label: "Histórico", icon: History },
    ],
  },
  {
    id: "admin", label: "Administração", icon: ShieldCheck, items: [
      { href: "/admin", label: "Admin", icon: ShieldCheck },
      { href: "/logs", label: "Logs", icon: TerminalSquare },
      { href: "/atualizacoes", label: "Atualizações", icon: Rocket },
      { href: "/settings", label: "Configurações", icon: Settings },
    ],
  },
];

const ALL_ITEMS = [HOME, ...GROUPS.flatMap((g) => g.items)];
const FAV_KEY = "gifedition.navfav";

function isActive(href, pathname) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavRow({ item, pathname, onNavigate, favorites, toggleFav, idPrefix }) {
  const active = isActive(item.href, pathname);
  const Icon = item.icon;
  const fav = favorites.includes(item.href);
  return (
    <div className="group relative flex items-center">
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`relative flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
          ${active ? "text-white" : "text-white/55 hover:text-white hover:bg-white/[0.05]"}`}
      >
        {active && (
          <motion.span
            layoutId={`${idPrefix}-nav-active`}
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/25 to-brand-500/5 border border-brand-400/30"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <Icon className={`relative h-[18px] w-[18px] ${active ? "text-brand-300" : ""}`} />
        <span className="relative truncate">{item.label}</span>
      </Link>
      {item.href !== "/" && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(item.href); }}
          className={`absolute right-1.5 grid h-7 w-7 place-items-center rounded-lg transition-all
            ${fav ? "text-amber-400 opacity-100" : "text-white/25 opacity-0 group-hover:opacity-100 hover:text-white/70"}`}
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Star className={`h-4 w-4 ${fav ? "fill-amber-400" : ""}`} />
        </button>
      )}
    </div>
  );
}

function NavContent({ pathname, onNavigate, query, setQuery, openGroups, toggleGroup, favorites, toggleFav, idPrefix }) {
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const results = searching ? ALL_ITEMS.filter((i) => i.label.toLowerCase().includes(q)) : [];
  const favItems = ALL_ITEMS.filter((i) => favorites.includes(i.href));

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ferramenta…"
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-9 pr-8 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70" aria-label="Limpar">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {searching ? (
          <div className="flex flex-col gap-1">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-white/35">Nada encontrado.</p>
            ) : (
              results.map((item) => (
                <NavRow key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} favorites={favorites} toggleFav={toggleFav} idPrefix={idPrefix} />
              ))
            )}
          </div>
        ) : (
          <>
            {/* Início */}
            <div className="mb-1">
              <NavRow item={HOME} pathname={pathname} onNavigate={onNavigate} favorites={favorites} toggleFav={toggleFav} idPrefix={idPrefix} />
            </div>

            {/* Favoritos */}
            {favItems.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400/70">
                  <Star className="h-3.5 w-3.5 fill-amber-400/70" /> Favoritos
                </div>
                <div className="flex flex-col gap-1">
                  {favItems.map((item) => (
                    <NavRow key={"f" + item.href} item={item} pathname={pathname} onNavigate={onNavigate} favorites={favorites} toggleFav={toggleFav} idPrefix={idPrefix + "-fav"} />
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {GROUPS.map((g) => {
              const isOpen = openGroups.includes(g.id);
              const GroupIcon = g.icon;
              const hasActive = g.items.some((i) => isActive(i.href, pathname));
              return (
                <div key={g.id} className="mt-2">
                  <button
                    onClick={() => toggleGroup(g.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
                  >
                    <GroupIcon className={`h-3.5 w-3.5 ${hasActive ? "text-brand-300" : ""}`} />
                    <span className="flex-1 text-left">{g.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-1 pt-0.5">
                          {g.items.map((item) => (
                            <NavRow key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} favorites={favorites} toggleFav={toggleFav} idPrefix={idPrefix} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-bold tracking-tight text-white">Gif<span className="gradient-text">Edition</span></div>
        <div className="text-[10px] uppercase tracking-widest text-white/35">media toolkit</div>
      </div>
    </Link>
  );
}

function DiscordCard({ compact }) {
  if (compact) {
    return (
      <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl p-3 bg-gradient-to-br from-brand-500/20 to-brand-800/10 border border-brand-400/30 text-white font-semibold text-sm">
        <MessagesSquare className="h-4 w-4 text-brand-300" /> Entre no Discord
      </a>
    );
  }
  return (
    <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
      className="group block rounded-2xl p-4 bg-gradient-to-br from-brand-500/20 to-brand-800/10 border border-brand-400/30 hover:border-brand-400/60 hover:-translate-y-0.5 transition-all">
      <div className="flex items-center gap-2 text-white font-semibold text-sm">
        <MessagesSquare className="h-4 w-4 text-brand-300" /> Entre no Discord
      </div>
      <p className="mt-1 text-[11px] text-white/45">Novidades, suporte e a comunidade Gif Edition.</p>
    </a>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Open only the group that contains the current route (clean menu by default).
  const activeGroupId = useMemo(() => {
    const g = GROUPS.find((grp) => grp.items.some((i) => isActive(i.href, pathname)));
    return g?.id || GROUPS[0].id;
  }, [pathname]);
  const [openGroups, setOpenGroups] = useState([activeGroupId]);

  // Ensure the active group is open when the route changes.
  useEffect(() => {
    setOpenGroups((prev) => (prev.includes(activeGroupId) ? prev : [...prev, activeGroupId]));
  }, [activeGroupId]);

  useEffect(() => {
    try { setFavorites(JSON.parse(localStorage.getItem(FAV_KEY)) || []); } catch {}
  }, []);

  const toggleGroup = (id) =>
    setOpenGroups((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleFav = (href) =>
    setFavorites((prev) => {
      const next = prev.includes(href) ? prev.filter((x) => x !== href) : [...prev, href];
      try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

  const navProps = { pathname, query, setQuery, openGroups, toggleGroup, favorites, toggleFav };

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
        <NavContent {...navProps} idPrefix="desk" />
        <div className="p-4">
          <DiscordCard />
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
              <div className="flex items-center justify-between shrink-0">
                <Brand />
                <button onClick={() => setOpen(false)} className="btn-soft !p-2.5 mr-3" aria-label="Fechar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavContent {...navProps} idPrefix="mob" onNavigate={() => setOpen(false)} />
              <div className="p-4 shrink-0">
                <DiscordCard compact />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
