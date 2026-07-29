"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Star, Trash2, ImageIcon, Film, Video, Repeat, Gauge } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { getHistory, clearHistory, getFavorites, toggleFavorite } from "@/lib/history";
import { formatBytes } from "@/lib/utils";

const KIND_ICON = { image: ImageIcon, gif: Film, video: Video, convert: Repeat, optimize: Gauge, audio: Film };

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [favs, setFavs] = useState([]);
  const [tab, setTab] = useState("all");

  const refresh = () => { setItems(getHistory()); setFavs(getFavorites()); };
  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener("nebula:history", h);
    return () => window.removeEventListener("nebula:history", h);
  }, []);

  const list = tab === "fav" ? favs : items;
  const isFav = (id) => favs.some((f) => f.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><History className="h-6 w-6 text-brand-300" /> Histórico</h1>
          <p className="mt-1 text-sm text-white/45">Seus últimos arquivos e favoritos, salvos localmente no navegador.</p>
        </div>
        {items.length > 0 && <button onClick={() => { clearHistory(); refresh(); }} className="btn-ghost shrink-0"><Trash2 className="h-4 w-4" /> Limpar</button>}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("all")} className={`chip ${tab === "all" ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}>Recentes ({items.length})</button>
        <button onClick={() => setTab("fav")} className={`chip ${tab === "fav" ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}><Star className="h-3.5 w-3.5" /> Favoritos ({favs.length})</button>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={History} title="Nada por aqui ainda" desc="Os arquivos que você exportar aparecerão aqui automaticamente." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {list.map((it) => {
              const Icon = KIND_ICON[it.kind] || ImageIcon;
              return (
                <motion.div key={it.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card p-4 flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 grid place-items-center rounded-xl overflow-hidden bg-brand-500/15 text-brand-200">
                    {it.thumb ? <img src={it.thumb} alt="" className="h-full w-full object-cover" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{it.name}</div>
                    <div className="text-xs text-white/40">{formatBytes(it.size)} · {new Date(it.at).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <button onClick={() => { toggleFavorite(it); refresh(); }} className="btn-soft !p-2">
                    <Star className={`h-4 w-4 ${isFav(it.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
