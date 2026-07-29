"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FolderHeart, Download, Pencil, Trash2, ImageIcon, Film, Video, Music, HardDrive } from "lucide-react";
import { EmptyState, Stat } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { getAllSaved, deleteSaved, clearSaved } from "@/lib/storage";
import { formatBytes, downloadBlob } from "@/lib/utils";

const CATS = [
  { id: "all", label: "Tudo", match: () => true, icon: FolderHeart },
  { id: "image", label: "Imagens", match: (k) => k === "image", icon: ImageIcon },
  { id: "gif", label: "GIFs", match: (k) => k === "gif", icon: Film },
  { id: "video", label: "Vídeos", match: (k) => k === "video", icon: Video },
  { id: "audio", label: "Áudios", match: (k) => k === "audio", icon: Music },
];

function routeFor(rec) {
  if (rec.kind === "video" || rec.type?.startsWith("video/")) return "/video";
  if (rec.kind === "gif" || rec.type === "image/gif") return "/gif";
  return "/image";
}

export default function SavedPage() {
  const router = useRouter();
  const { setMedia, toast } = useMedia();
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const all = await getAllSaved();
      setItems(all);
    } catch {
      toast("Não foi possível abrir a biblioteca.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("nebula:saved", h);
    return () => window.removeEventListener("nebula:saved", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Object URLs for previews; rebuilt whenever the item set changes.
  const urls = useMemo(() => {
    const map = {};
    items.forEach((it) => { map[it.id] = URL.createObjectURL(it.blob); });
    return map;
  }, [items]);
  useEffect(() => () => Object.values(urls).forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const visible = items.filter((it) => CATS.find((c) => c.id === cat).match(it.kind));
  const totalBytes = items.reduce((a, b) => a + (b.size || 0), 0);

  const openInEditor = (rec) => {
    const file = new File([rec.blob], rec.name, { type: rec.type });
    setMedia(file);
    toast(`Abrindo "${rec.name}" no editor`, "info");
    router.push(routeFor(rec));
  };

  const remove = async (id) => {
    await deleteSaved(id);
    toast("Removido dos salvos", "info");
  };

  const count = (id) => items.filter((it) => CATS.find((c) => c.id === id).match(it.kind)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderHeart className="h-6 w-6 text-brand-300" /> Salvos
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Sua biblioteca de arquivos. Reabra pra editar de novo ou baixe quando quiser.
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={async () => { await clearSaved(); toast("Biblioteca esvaziada", "info"); }} className="btn-ghost shrink-0">
            <Trash2 className="h-4 w-4" /> Limpar tudo
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`chip ${cat === c.id ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}>
            <c.icon className="h-3.5 w-3.5" /> {c.label} <span className="text-white/30">{count(c.id)}</span>
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-white/40">
          <HardDrive className="h-3.5 w-3.5" /> {formatBytes(totalBytes)} usados
        </span>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm">Carregando biblioteca…</div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FolderHeart}
          title={items.length === 0 ? "Nenhum arquivo salvo ainda" : "Nada nesta categoria"}
          desc='Nos editores, clique em "Salvar" para guardar o resultado aqui e reabrir depois.'
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {visible.map((it) => (
              <motion.div key={it.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="card overflow-hidden group">
                <div className="relative aspect-square checkerboard grid place-items-center overflow-hidden">
                  {it.kind === "video" ? (
                    <video src={urls[it.id]} className="h-full w-full object-cover" muted loop
                      onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} />
                  ) : it.kind === "audio" ? (
                    <Music className="h-10 w-10 text-brand-200" />
                  ) : (
                    <img src={urls[it.id]} alt={it.name} className="h-full w-full object-cover" />
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openInEditor(it)} title="Editar" className="btn-primary !px-3 !py-2"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => downloadBlob(it.blob, it.name)} title="Baixar" className="btn-ghost !px-3 !py-2"><Download className="h-4 w-4" /></button>
                    <button onClick={() => remove(it.id)} title="Excluir" className="btn-ghost !px-3 !py-2 hover:!text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-medium text-white">{it.name}</div>
                  <div className="mt-0.5 text-xs text-white/40">
                    {formatBytes(it.size)}{it.w ? ` · ${it.w}×${it.h}` : ""}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <p className="text-xs text-white/35">
        Os arquivos ficam guardados no seu navegador (IndexedDB) — não são enviados a nenhum servidor.
      </p>
    </div>
  );
}
