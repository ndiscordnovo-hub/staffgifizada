"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Image as ImageIcon, Film, Video, Repeat, Gauge,
  Layers, History, Settings, Sparkles, Menu, X, TerminalSquare, FolderHeart, MessagesSquare,
  Smile, Laugh, QrCode, ShieldCheck, Rocket, Wand2, Search, Star, ChevronDown, LayoutTemplate, Cog, FolderOpen, Handshake, ScrollText,
} from "lucide-react";
import { DISCORD_INVITE } from "@/lib/utils";

const HOME = { href: "/", label: "Início", icon: Home };

const GROUPS = [
  {
    id: "regras", label: "Regras & Privacidade", icon: ScrollText, items: [
      { href: "/regras", label: "Regras, Termos e Privacidade", icon: ShieldCheck },
    ],
  },
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
      { href: "/projects", label: "Projetos", icon: FolderOpen },
      { href: "/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/qrcode", label: "QR Code", icon: QrCode },
      { href: "/saved", label: "Salvos", icon: FolderHeart },
      { href: "/history", label: "Histórico", icon: History },
    ],
  },
  {
    id: "sistema", label: "Sistema", icon: Cog, items: [
      { href: "/parceria", label: "Parceria", icon: Handshake },
      { href: "/atualizacoes", label: "Atualizações", icon: Rocket },
      { href: "/settings", label: "Configurações", icon: Settings },
    ],
  },
  {
    id: "admin", label: "Administração", icon: ShieldCheck, adminOnly: true, items: [
      { href: "/admin", label: "Painel Admin", icon: ShieldCheck },
      { href: "/logs", label: "Logs", icon: TerminalSquare },
    ],
  },
];

const ALL_ITEMS = [HOME, ...GROUPS.flatMap((g) => g.items)];
const ADMIN_HREFS = new Set(GROUPS.filter((g) => g.adminOnly).flatMap((g) => g.items.map((i) => i.href)));
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
        className={`relative flex flex-1 items-center gap-3 rounded-[13px] px-3 py-2.5 text-sm transition-all
          ${active
            ? "text-brand-500 font-semibold"
            : "text-[#45474F] font-medium hover:text-brand-500 hover:bg-[#FFF5F7] hover:translate-x-0.5"}`}
      >
        {active && (
          <motion.span
            layoutId={`${idPrefix}-nav-active`}
            className="absolute inset-0 rounded-[13px] bg-gradient-to-br from-[#FFF0F3] to-[#FFF8FA] border border-[#FFD2DC]"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <span className={`relative grid h-[31px] w-[31px] shrink-0 place-items-center rounded-[10px] ${active ? "bg-[#FFE5EB]" : "bg-[#F6F5F6] group-hover:bg-[#FFE5EB]"}`}>
          <Icon className="h-[15px] w-[15px]" />
        </span>
        <span className="relative truncate">{item.label}</span>
      </Link>
      {item.href !== "/" && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(item.href); }}
          className={`absolute right-1.5 grid h-7 w-7 place-items-center rounded-lg transition-all
            ${fav ? "text-amber-500 opacity-100" : "text-subtle opacity-0 group-hover:opacity-100 hover:text-amber-500"}`}
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Star className={`h-4 w-4 ${fav ? "fill-amber-500" : ""}`} />
        </button>
      )}
    </div>
  );
}

function NavContent({ pathname, onNavigate, query, setQuery, openGroups, toggleGroup, favorites, toggleFav, idPrefix, adminUnlocked }) {
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const searchable = ALL_ITEMS.filter((i) => adminUnlocked || !ADMIN_HREFS.has(i.href));
  const results = searching ? searchable.filter((i) => i.label.toLowerCase().includes(q)) : [];
  const favItems = searchable.filter((i) => favorites.includes(i.href));
  const groups = GROUPS.filter((g) => !g.adminOnly || adminUnlocked);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ferramenta…"
            className="w-full rounded-[14px] bg-white border border-line pl-9 pr-8 py-2.5 text-sm text-ink placeholder-subtle shadow-card-sm focus:outline-none focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle hover:text-ink" aria-label="Limpar">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {searching ? (
          <div className="flex flex-col gap-1">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-subtle">Nada encontrado.</p>
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
                <div className="flex items-center gap-2 px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-500/70">
                  <Star className="h-3.5 w-3.5 fill-amber-500/70" /> Favoritos
                </div>
                <div className="flex flex-col gap-1">
                  {favItems.map((item) => (
                    <NavRow key={"f" + item.href} item={item} pathname={pathname} onNavigate={onNavigate} favorites={favorites} toggleFav={toggleFav} idPrefix={idPrefix + "-fav"} />
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {groups.map((g) => {
              const isOpen = openGroups.includes(g.id);
              const GroupIcon = g.icon;
              const hasActive = g.items.some((i) => isActive(i.href, pathname));
              return (
                <div key={g.id} className="mt-2">
                  <button
                    onClick={() => toggleGroup(g.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-subtle hover:text-muted transition-colors"
                  >
                    <GroupIcon className={`h-3.5 w-3.5 ${hasActive ? "text-brand-500" : ""}`} />
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
      <div className="grid h-10 w-10 place-items-center rounded-[13px] shadow-glow relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FF5E7C 0%, #F31845 60%, #D70D35 100%)" }}>
        <Sparkles className="h-5 w-5 text-white relative z-10" />
        <div className="absolute inset-0 border-[1.5px] border-white/20 rounded-[13px]" />
      </div>
      <div className="leading-tight">
        <div className="text-[18px] font-extrabold tracking-tight text-ink" style={{ letterSpacing: "-0.025em" }}>
          Gif<span className="text-brand-500">Edition</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-subtle">media toolkit</div>
      </div>
    </Link>
  );
}

function DiscordCard({ compact }) {
  if (compact) {
    return (
      <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl p-3 text-white font-bold text-sm"
        style={{ background: "linear-gradient(145deg, #181A22, #101116)", boxShadow: "0 18px 38px rgba(15,16,22,0.16)" }}>
        <MessagesSquare className="h-4 w-4" /> Entrar agora
      </a>
    );
  }
  return (
    <div className="rounded-[20px] p-[18px] text-white"
      style={{
        background: "radial-gradient(circle at 100% 0, rgba(243,22,67,0.32), transparent 43%), linear-gradient(145deg, #181A22, #101116)",
        boxShadow: "0 18px 38px rgba(15,16,22,0.16)",
      }}>
      <b className="block mb-1.5 text-sm">Entre no Discord</b>
      <p className="text-[13px] leading-relaxed text-white/65 mb-3.5">Novidades, suporte e a comunidade GifEdition.</p>
      <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl p-2.5 text-sm font-extrabold"
        style={{ background: "var(--color-primary)" }}>
        Entrar agora
      </a>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  useEffect(() => {
    const sync = () => setAdminUnlocked(sessionStorage.getItem("gifedition.admin") === "1");
    sync();
    window.addEventListener("gifedition:admin", sync);
    return () => window.removeEventListener("gifedition:admin", sync);
  }, []);

  const activeGroupId = useMemo(() => {
    const g = GROUPS.find((grp) => grp.items.some((i) => isActive(i.href, pathname)));
    return g?.id || GROUPS[0].id;
  }, [pathname]);
  const [openGroups, setOpenGroups] = useState([activeGroupId]);

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

  const navProps = { pathname, query, setQuery, openGroups, toggleGroup, favorites, toggleFav, adminUnlocked };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between glass-strong px-4 py-3">
        <Brand />
        <div className="flex items-center gap-2">
          <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-brand-500 bg-brand-50 border border-brand-100"
            aria-label="Entrar no Discord">
            <MessagesSquare className="h-4 w-4" /> Discord
          </a>
          <button onClick={() => setOpen(true)} className="grid h-[42px] w-[42px] place-items-center rounded-[13px] border border-line bg-white" aria-label="Abrir menu">
            <Menu className="h-5 w-5 text-ink" />
          </button>
        </div>
      </div>

      {/* Desktop rail */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-line"
        style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)" }}>
        <Brand />
        <NavContent {...navProps} idPrefix="desk" />
        <div className="p-4">
          <DiscordCard />
          <p className="mt-3 text-center text-[12px] font-semibold text-subtle">100% privado · grátis</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 z-50 h-full w-72 flex flex-col bg-white border-r border-line"
              style={{ boxShadow: "20px 0 50px rgba(0,0,0,0.08)" }}
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
