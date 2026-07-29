"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Download, Package, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { Panel, Segmented, Slider, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { loadImage, toBlob } from "@/lib/imageProcessor";
import { formatBytes, downloadBlob, baseName, uid, SIZE_PRESETS } from "@/lib/utils";
import { makeZip, blobToU8 } from "@/lib/zip";

export default function BatchPage() {
  const { toast } = useMedia();
  const canvasRef = useRef(null);
  const [items, setItems] = useState([]); // { id, file, name, size, status, out }
  const [cfg, setCfg] = useState({ format: "webp", quality: 0.85, preset: "none" });
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const patchCfg = (p) => setCfg((c) => ({ ...c, ...p }));

  const onFiles = (files) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    setItems((prev) => [
      ...prev,
      ...imgs.map((f) => ({ id: uid(), file: f, name: f.name, size: f.size, status: "pending", out: null })),
    ]);
    if (imgs.length < files.length) toast("Apenas imagens são aceitas no lote.", "warn");
  };

  const process = async () => {
    if (!items.length) return;
    setRunning(true); setDone(0);
    const preset = SIZE_PRESETS.find((p) => p.id === cfg.preset);
    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      const it = updated[i];
      if (it.status === "done") { setDone((d) => d + 1); continue; }
      updated[i] = { ...it, status: "processing" };
      setItems([...updated]);
      try {
        const img = await loadImage(it.file); // eslint-disable-line no-await-in-loop
        const edits = { format: cfg.format, quality: cfg.quality };
        if (preset) { edits.resizeW = preset.w; edits.resizeH = preset.h; }
        const blob = await toBlob(img, edits, canvasRef.current); // eslint-disable-line no-await-in-loop
        const ext = cfg.format === "jpeg" ? "jpg" : cfg.format;
        updated[i] = { ...it, status: "done", out: { blob, size: blob.size, name: `${baseName(it.name)}.${ext}` } };
      } catch {
        updated[i] = { ...it, status: "error" };
      }
      setItems([...updated]);
      setDone((d) => d + 1);
    }
    setRunning(false);
    toast("Lote concluído!", "success");
  };

  const downloadZip = async () => {
    const files = items.filter((i) => i.out).map((i) => i.out);
    if (!files.length) return;
    const entries = await Promise.all(files.map(async (f) => ({ name: f.name, data: await blobToU8(f.blob) })));
    const zip = await makeZip(entries);
    downloadBlob(zip, "nebula-lote.zip");
    toast("ZIP gerado!", "success");
  };

  const totalIn = items.reduce((a, b) => a + b.size, 0);
  const totalOut = items.reduce((a, b) => a + (b.out?.size || 0), 0);
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Layers className="h-6 w-6 text-brand-300" /> Processamento em lote</h1>
        <p className="mt-1 text-sm text-white/45">Envie dezenas de imagens e aplique a mesma configuração a todas.</p>
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-4">
          <Dropzone accept="image/*" multiple onFiles={onFiles} compact />

          {items.length === 0 ? (
            <EmptyState icon={Package} title="Nenhum arquivo na fila" desc="Adicione imagens acima para começar." />
          ) : (
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Fila · {items.length} arquivo(s)</div>
                <button onClick={() => setItems([])} className="btn-soft text-xs"><Trash2 className="h-3.5 w-3.5" /> Limpar</button>
              </div>
              {running && (
                <div className="mb-4"><ProgressBar value={pct} /><p className="mt-2 text-xs text-white/50 text-center">{done}/{items.length} processados</p></div>
              )}
              <div className="space-y-2 max-h-[46vh] overflow-auto pr-1">
                <AnimatePresence>
                  {items.map((it) => (
                    <motion.div key={it.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5">
                      <div className="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-brand-500/15 text-brand-200">
                        {it.status === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                         it.status === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                         <Layers className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white/90">{it.name}</div>
                        <div className="text-xs text-white/40">
                          {formatBytes(it.size)}
                          {it.out && <span className="text-emerald-400"> → {formatBytes(it.out.size)}</span>}
                        </div>
                      </div>
                      {it.out && <button onClick={() => downloadBlob(it.out.blob, it.out.name)} className="btn-soft !p-2"><Download className="h-4 w-4" /></button>}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Configuração do lote" icon={Layers}>
            <div className="field-label">Formato</div>
            <Segmented options={[{ value: "webp", label: "WEBP" }, { value: "jpeg", label: "JPG" }, { value: "png", label: "PNG" }]} value={cfg.format} onChange={(v) => patchCfg({ format: v })} />
            {cfg.format !== "png" && <div className="mt-4"><Slider label="Qualidade" value={Math.round(cfg.quality * 100)} min={10} max={100} unit="%" onChange={(v) => patchCfg({ quality: v / 100 })} /></div>}
            <div className="field-label mt-4">Redimensionar (opcional)</div>
            <select className="input" value={cfg.preset} onChange={(e) => patchCfg({ preset: e.target.value })}>
              <option value="none">Manter tamanho original</option>
              {SIZE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.w}×{p.h}</option>)}
            </select>
          </Panel>

          <Panel title="Resumo">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Arquivos" value={items.length} />
              <Stat label="Concluídos" value={done} accent="text-emerald-400" />
              <Stat label="Peso total" value={formatBytes(totalIn)} />
              <Stat label="Após" value={totalOut ? formatBytes(totalOut) : "—"} accent="text-emerald-400" />
            </div>
          </Panel>

          <button disabled={running || !items.length} onClick={process} className="btn-primary w-full">
            {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando…</> : <><Layers className="h-4 w-4" /> Processar tudo</>}
          </button>
          <button disabled={!items.some((i) => i.out)} onClick={downloadZip} className="btn-ghost w-full"><Package className="h-4 w-4" /> Baixar ZIP</button>
        </div>
      </div>
    </div>
  );
}
