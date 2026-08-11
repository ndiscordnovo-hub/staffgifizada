"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Download, Sparkles, Zap, Feather, Rocket, Save } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { Panel, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { loadImage, compressToTarget, toBlob } from "@/lib/imageProcessor";
import { runFFmpeg } from "@/lib/ffmpeg";
import { formatBytes, downloadBlob, baseName, DISCORD_LIMITS } from "@/lib/utils";
import { addHistory } from "@/lib/history";
import { saveMedia } from "@/lib/storage";

const MODES = [
  { id: "max", label: "Máxima qualidade", desc: "Compressão leve, nitidez total", icon: Sparkles, quality: 0.95 },
  { id: "balanced", label: "Equilibrado", desc: "Melhor custo-benefício", icon: Zap, quality: 0.8 },
  { id: "ultra", label: "Ultra compacto", desc: "Menor peso possível", icon: Feather, quality: 0.55 },
];

export default function OptimizePage() {
  const { media, setMedia, toast } = useMedia();
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [mode, setMode] = useState("balanced");
  const [target, setTarget] = useState(null); // discord limit id
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [stages, setStages] = useState([]);
  const [overlayResult, setOverlayResult] = useState(null);

  const isImage = media?.type?.startsWith("image/") && media?.type !== "image/gif";

  useEffect(() => {
    if (!media || !isImage) { setImg(null); return; }
    loadImage(media.url).then(setImg);
  }, [media, isImage]);

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const predicted = () => {
    if (!media) return null;
    if (target) return DISCORD_LIMITS.find((d) => d.id === target)?.bytes;
    const m = MODES.find((x) => x.id === mode);
    return Math.round(media.size * (m.quality * 0.7)); // rough estimate
  };

  const updateStage = (id, status, detail) =>
    setStages((s) => s.map((st) => (st.id === id ? { ...st, status, ...(detail !== undefined ? { detail } : {}) } : st)));

  const run = async () => {
    if (!media) return;
    const pipeStages = [
      { id: "load", label: "Analisando arquivo", status: "waiting" },
      { id: "process", label: "Otimizando qualidade", status: "waiting" },
      { id: "optimize", label: "Comprimindo dados", status: "waiting" },
      { id: "generate", label: "Gerando resultado", status: "waiting" },
    ];
    setStages(pipeStages);
    setBusy(true); setProgress(null); setResult(null);
    updateStage("load", "loading");
    try {
      let blob, outName;
      if (isImage && img) {
        updateStage("load", "done");
        updateStage("process", "processing");
        const budget = target ? DISCORD_LIMITS.find((d) => d.id === target).bytes : null;
        if (budget) {
          const r = await compressToTarget(img, { format: "webp" }, canvasRef.current, budget);
          blob = r.blob; outName = `${baseName(media.name)}-otimizado.${r.format === "jpeg" ? "jpg" : r.format}`;
        } else {
          const q = MODES.find((x) => x.id === mode).quality;
          blob = await toBlob(img, { format: "webp", quality: q }, canvasRef.current);
          outName = `${baseName(media.name)}-otimizado.webp`;
        }
        updateStage("process", "done");
        updateStage("optimize", "done");
      } else {
        setProgress(0);
        const inExt = media.name.split(".").pop() || "mp4";
        const crf = target ? 30 : mode === "ultra" ? 34 : mode === "balanced" ? 28 : 23;
        const isGif = media.type === "image/gif";
        outName = `${baseName(media.name)}-otimizado.${isGif ? "gif" : "mp4"}`;
        const args = isGif
          ? ["-i", `in.${inExt}`, "-vf", "fps=12,scale=trunc(iw*0.8/2)*2:-2,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "out.gif"]
          : ["-i", `in.${inExt}`, "-c:v", "libx264", "-crf", `${crf}`, "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "faststart", "-c:a", "aac", "out.mp4"];
        updateStage("load", "done");
        updateStage("process", "processing");
        blob = await runFFmpeg({
          file: media.file, inName: `in.${inExt}`, outName: isGif ? "out.gif" : "out.mp4", args, outType: isGif ? "image/gif" : "video/mp4",
          onProgress: (p) => {
            setProgress(p);
            if (p > 0 && p < 80) updateStage("process", "processing", `${p}%`);
            if (p >= 80) { updateStage("process", "done"); updateStage("optimize", "optimizing"); }
          },
        });
        updateStage("optimize", "done");
      }
      updateStage("generate", "generating");
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size, name: outName, blob });
      addHistory({ id: outName + Date.now(), name: outName, kind: "optimize", size: blob.size });
      updateStage("generate", "done");
      setBusy(false); setProgress(null);
      const redu = Math.max(0, Math.round((1 - blob.size / media.size) * 100));
      setOverlayResult({
        title: "Otimização concluída!",
        items: [
          { label: "Antes", value: formatBytes(media.size) },
          { label: "Depois", value: formatBytes(blob.size), accent: "text-emerald-400" },
          { label: "Redução", value: `${redu}%`, accent: "text-emerald-400" },
          { label: "Qualidade", value: target ? "Auto (Discord)" : mode === "max" ? "Máxima" : mode === "balanced" ? "Equilibrado" : "Ultra" },
        ],
      });
    } catch (e) {
      console.error(e);
      setStages((s) => s.map((st) => (st.status !== "done" ? { ...st, status: "error" } : st)));
      toast("Falha na otimização.", "error");
      setBusy(false); setProgress(null);
      setTimeout(() => setStages([]), 2000);
    }
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState icon={Gauge} title="Otimização Inteligente" desc="Envie uma imagem, GIF ou vídeo e reduza o peso automaticamente para os limites do Discord."
          action={<div className="w-full max-w-md"><Dropzone compact /></div>} />
      </div>
    );
  }

  const est = predicted();

  return (
    <div className="space-y-6">
      <ProcessingOverlay open={busy || overlayResult != null} progress={progress} title="Otimizando…" stages={stages} result={overlayResult} onClose={() => { setOverlayResult(null); setStages([]); }} />
      <Header onNew={() => { setMedia(null); setResult(null); }} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-4">
          <Panel title="Análise do arquivo" icon={Gauge}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Tamanho atual" value={formatBytes(media.size)} />
              <Stat label="Tamanho previsto" value={est ? `~${formatBytes(est)}` : "—"} accent="text-brand-500" />
              <Stat label="Qualidade" value={target ? "Auto" : mode === "max" ? "Alta" : mode === "balanced" ? "Boa" : "Compacta"} />
              <Stat label="Tempo estim." value={isImage ? "< 1s" : "5–40s"} />
            </div>
          </Panel>

          {(busy || result) && (
            <Panel title="Resultado" icon={Sparkles}>
              {busy ? (
                <div className="py-6"><ProgressBar value={progress} /><p className="mt-3 text-center text-sm text-muted">{progress != null ? `Processando… ${progress}%` : "Otimizando…"}</p></div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Antes" value={formatBytes(media.size)} />
                    <Stat label="Depois" value={formatBytes(result.size)} accent="text-emerald-500" />
                    <Stat label="Redução" value={`${Math.max(0, Math.round((1 - result.size / media.size) * 100))}%`} accent="text-emerald-500" />
                  </div>
                  {target && (
                    <p className={`mt-3 text-sm ${result.size <= DISCORD_LIMITS.find((d) => d.id === target).bytes ? "text-emerald-500" : "text-amber-500"}`}>
                      {result.size <= DISCORD_LIMITS.find((d) => d.id === target).bytes ? "✓ Cabe no limite escolhido!" : "Ainda acima do limite — tente Ultra compacto."}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={async () => { const k = result.name.endsWith(".mp4") ? "video" : result.name.endsWith(".gif") ? "gif" : "image"; await saveMedia({ name: result.name, kind: k, type: result.blob.type, blob: result.blob }); toast("Salvo na biblioteca!", "success"); }} className="btn-ghost flex-1"><Save className="h-4 w-4" /> Salvar</button>
                    <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary flex-[1.4]"><Download className="h-4 w-4" /> Baixar otimizado</button>
                  </div>
                </>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Modo de qualidade" icon={Rocket}>
            <div className="space-y-2">
              {MODES.map((m) => (
                <button key={m.id} onClick={() => { setMode(m.id); setTarget(null); }}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${mode === m.id && !target ? "bg-brand-50 border-brand-200" : "bg-[#F6F5F6] border-line hover:bg-[#EEECED]"}`}>
                  <m.icon className="h-5 w-5 text-brand-500 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-ink">{m.label}</div>
                    <div className="text-xs text-subtle">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Limites do Discord" icon={Zap}>
            <div className="grid grid-cols-2 gap-2">
              {DISCORD_LIMITS.map((d) => (
                <button key={d.id} onClick={() => setTarget(target === d.id ? null : d.id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${target === d.id ? "bg-brand-50 border-brand-200 text-brand-500" : "bg-[#F6F5F6] border-line text-muted hover:text-ink"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </Panel>

          <button disabled={busy} onClick={run} className="btn-primary w-full"><Sparkles className="h-4 w-4" /> Otimizar agora</button>
        </div>
      </div>
    </div>
  );
}

function Header({ onNew }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2"><Gauge className="h-6 w-6 text-brand-500" /> Otimização Inteligente</h1>
        <p className="mt-1 text-sm text-subtle">Reduza o peso automaticamente mantendo a melhor qualidade.</p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0">Novo arquivo</button>}
    </div>
  );
}
