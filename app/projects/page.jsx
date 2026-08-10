"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Trash2, Play, Clock, Image as ImageIcon, Film, Video, Loader2, FolderPlus, AlertCircle } from "lucide-react";
import { getAllProjects, deleteProject, clearProjects, EDITOR_LABELS, EDITOR_ROUTES } from "@/lib/projects";
import { formatBytes } from "@/lib/utils";
import { useMedia } from "@/components/MediaContext";

const EDITOR_ICONS = { image: ImageIcon, gif: Film, video: Video };

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useMedia();
  const router = useRouter();

  const load = async () => {
    try {
      setProjects(await getAllProjects());
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("nebula:projects", h);
    return () => window.removeEventListener("nebula:projects", h);
  }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteProject(id);
      toast("Projeto excluído.", "success");
    } catch { toast("Erro ao excluir.", "error"); }
    setDeleting(null);
  };

  const handleClear = async () => {
    await clearProjects();
    toast("Todos os projetos foram excluídos.", "success");
  };

  const handleOpen = (project) => {
    sessionStorage.setItem("gifedition.resume-project", project.id);
    router.push(EDITOR_ROUTES[project.editor] || "/image");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-brand-500" /> Projetos
          </h1>
          <p className="mt-1 text-sm text-subtle">Retome suas edições de onde parou.</p>
        </div>
        {projects.length > 0 && (
          <button onClick={handleClear} className="btn-ghost shrink-0 text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" /> Limpar tudo
          </button>
        )}
      </div>

      {loading ? (
        <div className="card py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-400" />
          <p className="mt-3 text-sm text-muted">Carregando projetos…</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200">
            <FolderPlus className="h-8 w-8 text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-ink">Nenhum projeto salvo</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted">
            Quando estiver editando um arquivo, clique em "Salvar projeto" para guardar suas configurações e continuar depois.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted">
            <AlertCircle className="h-3.5 w-3.5" />
            Projetos ficam salvos no seu navegador.
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {projects.map((p, i) => {
              const Icon = EDITOR_ICONS[p.editor] || ImageIcon;
              const editorLabel = EDITOR_LABELS[p.editor] || p.editor;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="card group relative overflow-hidden"
                >
                  {/* Thumbnail or gradient placeholder */}
                  <div className="relative h-36 overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-50 via-white to-brand-100">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <Icon className="h-12 w-12 text-brand-200" />
                      </div>
                    )}
                    {/* Editor badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-line px-2 py-1 text-[11px] font-semibold text-ink shadow-sm">
                      <Icon className="h-3 w-3 text-brand-500" />
                      {editorLabel}
                    </div>
                    {/* Time badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-black/50 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-white/80">
                      <Clock className="h-3 w-3" />
                      {relativeTime(p.updatedAt)}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-ink text-sm truncate">{p.name || p.fileName}</h3>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-subtle">
                      <span>{p.fileName}</span>
                      <span className="text-line">·</span>
                      <span>{formatBytes(p.fileSize)}</span>
                    </div>

                    {/* Settings preview */}
                    {p.opts && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {p.opts.scale != null && p.opts.scale !== 100 && (
                          <span className="rounded-md bg-brand-50 border border-brand-100 px-1.5 py-0.5 text-[10px] text-brand-600">Escala {p.opts.scale}%</span>
                        )}
                        {p.opts.fps != null && p.opts.fps !== 15 && (
                          <span className="rounded-md bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600">{p.opts.fps} FPS</span>
                        )}
                        {p.opts.brightness != null && p.opts.brightness !== 100 && (
                          <span className="rounded-md bg-amber-50 border border-amber-100 px-1.5 py-0.5 text-[10px] text-amber-600">Brilho {p.opts.brightness}%</span>
                        )}
                        {p.opts.rotate != null && p.opts.rotate !== 0 && (
                          <span className="rounded-md bg-purple-50 border border-purple-100 px-1.5 py-0.5 text-[10px] text-purple-600">Rotação {p.opts.rotate}°</span>
                        )}
                        {p.opts.crop && (
                          <span className="rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-600">Recorte</span>
                        )}
                        {p.opts.quality != null && p.opts.quality !== 90 && (
                          <span className="rounded-md bg-orange-50 border border-orange-100 px-1.5 py-0.5 text-[10px] text-orange-600">Qualidade {p.opts.quality}%</span>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleOpen(p)}
                        className="btn-primary flex-1 !py-2 text-xs"
                      >
                        <Play className="h-3.5 w-3.5" /> Continuar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="btn-ghost !py-2 !px-3 text-xs hover:!text-red-500"
                      >
                        {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
