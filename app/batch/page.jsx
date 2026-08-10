"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Download, Package, Trash2, CheckCircle2, Loader2, X, Plus,
  Ban, AlertTriangle, ImageIcon, Film, Video, FileWarning,
} from "lucide-react";
import { Panel, Slider, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { loadImage, toBlob } from "@/lib/imageProcessor";
import { runFFmpeg } from "@/lib/ffmpeg";
import { formatBytes, downloadBlob, baseName, uid, SIZE_PRESETS } from "@/lib/utils";
import { makeZip, blobToU8 } from "@/lib/zip";

const MAX_FILES = 15;
const MIN_FILES = 2;

// Detects how a file must be processed (and keeps its format).
function kindOf(type, name) {
  if (type === "image/gif") return "gif";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("image/")) return "image";
  // fall back by extension
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "gif") return "gif";
  if (["mp4", "webm", "mov", "mkv", "avi"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
  return "other";
}

const KIND_ICON = { image: ImageIcon, gif: Film, video: Video, other: FileWarning };

// Canvas export mime that PRESERVES the original image format.
function imageFormat(type) {
  if (type === "image/jpeg") return "jpeg";
  if (type === "image/webp") return "webp";
  return "png";
}

export default function BatchPage() {
  const { toast } = useMedia();
  const canvasRef = useRef(null);
  const addInputRef = useRef(null);
  const cancelRef = useRef(false);
  const [items, setItems] = useState([]);
  const [cfg, setCfg] = useState({ preset: "none", quality: 85 });
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null); // { ok, err }
  const patchCfg = (p) => setCfg((c) => ({ ...c, ...p }));

  const setItem = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setItems((prev) => {
      const room = MAX_FILES - prev.length;
      if (room <= 0) { toast(`Máximo de ${MAX_FILES} arquivos.`, "warn"); return prev; }
      const take = incoming.slice(0, room);
      if (take.length < incoming.length) toast(`Limite de ${MAX_FILES} — alguns arquivos foram ignorados.`, "warn");
      const mapped = take.map((f) => ({
        id: uid(), file: f, name: f.name, size: f.size, type: f.type,
        kind: kindOf(f.type, f.name), status: "pending", progress: 0, out: null, error: null,
      }));
      return [...prev, ...mapped];
    });
    setReport(null);
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const clearAll = () => { setItems([]); setReport(null); };

  const processOne = async (it) => {
    const preset = SIZE_PRESETS.find((p) => p.id === cfg.preset);
    if (it.kind === "image") {
      const img = await loadImage(it.file);
      const edits = { format: imageFormat(it.type), quality: cfg.quality / 100 };
      if (preset) { edits.resizeW = preset.w; edits.resizeH = preset.h; }
      const blob = await toBlob(img, edits, canvasRef.current);
      return { blob, name: it.name }; // mesmo formato e nome
    }
    // GIF / vídeo via FFmpeg — preserva o formato original
    const inExt = (it.name.split(".").pop() || (it.kind === "gif" ? "gif" : "mp4")).toLowerCase();
    const inName = `in.${inExt}`;
    const onProgress = (p) => setItem(it.id, { progress: p });

    if (it.kind === "gif") {
      const colors = Math.max(32, Math.min(256, Math.round((cfg.quality / 100) * 256)));
      const scale = preset ? `scale=${preset.w}:-2:flags=lanczos,` : "";
      const outName = "out.gif";
      const blob = await runFFmpeg({
        file: it.file, inName, outName, outType: "image/gif", onProgress,
        args: ["-i", inName, "-vf", `${scale}split[s0][s1];[s0]palettegen=max_colors=${colors}[p];[s1][p]paletteuse`, "-loop", "0", outName],
      });
      return { blob, name: `${baseName(it.name)}.gif` };
    }
    // vídeo
    const isWebm = inExt === "webm";
    const outExt = isWebm ? "webm" : "mp4";
    const outName = `out.${outExt}`;
    const crf = Math.round(40 - (cfg.quality / 100) * 20); // q100→20, q10→38
    const args = ["-i", inName];
    if (preset) args.push("-vf", `scale=${preset.w}:-2`);
    if (isWebm) args.push("-c:v", "libvpx-vp9", "-crf", `${crf}`, "-b:v", "0", "-c:a", "libopus");
    else args.push("-c:v", "libx264", "-crf", `${crf}`, "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "faststart", "-c:a", "aac");
    args.push(outName);
    const blob = await runFFmpeg({ file: it.file, inName, outName, outType: isWebm ? "video/webm" : "video/mp4", onProgress, args });
    return { blob, name: `${baseName(it.name)}.${outExt}` };
  };

  const process = async () => {
    if (items.length < MIN_FILES) return;
    cancelRef.current = false;
    setRunning(true); setReport(null);
    let ok = 0, err = 0;
    for (const it of items) {
      if (cancelRef.current) break;
      if (it.status === "done") { ok++; continue; }
      if (it.kind === "other") { setItem(it.id, { status: "error", error: "Formato não suportado" }); err++; continue; }
      setItem(it.id, { status: "processing", progress: 0 });
      try {
        const { blob, name } = await processOne(it); // eslint-disable-line no-await-in-loop
        setItem(it.id, { status: "done", progress: 100, out: { blob, size: blob.size, name } });
        ok++;
      } catch (e) {
        console.error(e);
        setItem(it.id, { status: "error", error: e?.message?.slice(0, 60) || "Falha" });
        err++;
      }
    }
    setRunning(false);
    setReport({ ok, err, canceled: cancelRef.current });
    toast(cancelRef.current ? "Processamento cancelado." : `Lote concluído: ${ok} ok, ${err} erro(s).`, cancelRef.current ? "warn" : "success");
  };

  const cancel = () => { cancelRef.current = true; toast("Cancelando após o arquivo atual…", "info"); };

  const downloadZip = async () => {
    const outs = items.filter((i) => i.out).map((i) => i.out);
    if (!outs.length) return;
    const entries = await Promise.all(outs.map(async (f) => ({ name: f.name, data: await blobToU8(f.blob) })));
    downloadBlob(await makeZip(entries), "gifedition-lote.zip");
    toast("ZIP gerado!", "success");
  };

  const totalIn = items.reduce((a, b) => a + b.size, 0);
  const totalOut = items.reduce((a, b) => a + (b.out?.size || 0), 0);
  const doneCount = items.filter((i) => i.status === "done").length;
  const canProcess = items.length >= MIN_FILES && !running;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2"><Layers className="h-6 w-6 text-brand-500" /> Processamento em lote</h1>
        <p className="mt-1 text-sm text-subtle">Envie de {MIN_FILES} a {MAX_FILES} arquivos e aplique a mesma configuração a todos. O formato de cada arquivo é preservado.</p>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <input ref={addInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-4">
          {items.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <EmptyState
                icon={Package}
                title="Adicione seus arquivos"
                desc={`De ${MIN_FILES} a ${MAX_FILES} arquivos (imagens, GIFs ou vídeos). Arraste aqui ou clique no botão.`}
                action={<button onClick={() => addInputRef.current?.click()} className="btn-primary"><Plus className="h-4 w-4" /> Escolher arquivos</button>}
              />
            </div>
          ) : (
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-ink">Fila · {items.length}/{MAX_FILES}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => addInputRef.current?.click()} disabled={items.length >= MAX_FILES || running} className="btn-soft text-xs"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
                  <button onClick={clearAll} disabled={running} className="btn-soft text-xs"><Trash2 className="h-3.5 w-3.5" /> Limpar</button>
                </div>
              </div>

              {running && (
                <div className="mb-4"><ProgressBar value={Math.round((doneCount / items.length) * 100)} /><p className="mt-2 text-xs text-muted text-center">{doneCount}/{items.length} processados</p></div>
              )}

              <div className="space-y-2 max-h-[52vh] overflow-auto pr-1">
                <AnimatePresence>
                  {items.map((it) => {
                    const Icon = KIND_ICON[it.kind] || ImageIcon;
                    return (
                      <motion.div key={it.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="rounded-xl bg-[#F6F5F6] border border-line px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 shrink-0 grid place-items-center rounded-lg ${it.status === "error" ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-500"}`}>
                            {it.status === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                             it.status === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                             it.status === "error" ? <AlertTriangle className="h-4 w-4" /> :
                             <Icon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-ink">{it.name}</div>
                            <div className="text-xs text-subtle">
                              <span className="uppercase">{it.kind}</span> · {formatBytes(it.size)}
                              {it.out && <span className="text-emerald-500"> → {formatBytes(it.out.size)}</span>}
                              {it.error && <span className="text-red-500"> · {it.error}</span>}
                            </div>
                          </div>
                          {it.out ? (
                            <button onClick={() => downloadBlob(it.out.blob, it.out.name)} className="btn-soft !p-2" title="Baixar"><Download className="h-4 w-4" /></button>
                          ) : (
                            !running && <button onClick={() => removeItem(it.id)} className="btn-soft !p-2 hover:!text-red-500" title="Remover"><X className="h-4 w-4" /></button>
                          )}
                        </div>
                        {it.status === "processing" && (it.kind === "gif" || it.kind === "video") && (
                          <div className="mt-2"><ProgressBar value={it.progress} /></div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Relatório final */}
          {report && (
            <div className="card p-4">
              <div className="text-sm font-semibold text-ink mb-2">Relatório final</div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Sucesso" value={report.ok} accent="text-emerald-500" />
                <Stat label="Erros" value={report.err} accent={report.err ? "text-red-500" : undefined} />
                <Stat label="Status" value={report.canceled ? "Cancelado" : "Concluído"} accent={report.canceled ? "text-amber-500" : "text-emerald-500"} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Configuração (aplicada a todos)" icon={Layers}>
            <p className="mb-3 text-[11px] text-amber-600">🔒 O formato de cada arquivo é preservado (GIF continua GIF, MP4 continua MP4…).</p>
            <div className="field-label">Redimensionar (opcional)</div>
            <select className="input" value={cfg.preset} onChange={(e) => patchCfg({ preset: e.target.value })}>
              <option value="none">Manter tamanho original</option>
              {SIZE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.w}×{p.h}</option>)}
            </select>
            <div className="mt-4">
              <Slider label="Qualidade" value={cfg.quality} min={10} max={100} unit="%" onChange={(v) => patchCfg({ quality: v })} />
            </div>
            <p className="text-[11px] text-subtle">Vídeos e GIFs (via FFmpeg) baixam o motor ~30&nbsp;MB na 1ª vez.</p>
          </Panel>

          <Panel title="Resumo">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Arquivos" value={`${items.length}/${MAX_FILES}`} />
              <Stat label="Concluídos" value={doneCount} accent="text-emerald-500" />
              <Stat label="Peso total" value={formatBytes(totalIn)} />
              <Stat label="Depois" value={totalOut ? formatBytes(totalOut) : "—"} accent="text-emerald-500" />
            </div>
            {items.length > 0 && items.length < MIN_FILES && (
              <p className="mt-3 text-xs text-amber-600">Adicione pelo menos {MIN_FILES} arquivos para processar em lote.</p>
            )}
          </Panel>

          {running ? (
            <button onClick={cancel} className="btn-ghost w-full !border-red-200 !text-red-500"><Ban className="h-4 w-4" /> Cancelar</button>
          ) : (
            <button disabled={!canProcess} onClick={process} className="btn-primary w-full"><Layers className="h-4 w-4" /> Processar tudo</button>
          )}
          <button disabled={!items.some((i) => i.out)} onClick={downloadZip} className="btn-ghost w-full"><Package className="h-4 w-4" /> Baixar todos (ZIP)</button>
        </div>
      </div>
    </div>
  );
}
