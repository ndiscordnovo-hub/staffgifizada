"use client";
import { useEffect, useRef, useState } from "react";
import {
  Gauge, Download, Sparkles, Zap, Feather, Rocket, Save, Loader2,
  ArrowDownToLine, CheckCircle2,
} from "lucide-react";
import Dropzone from "@/components/Dropzone";
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
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const isImage = media?.type?.startsWith("image/") && media?.type !== "image/gif";
  const isGif = media?.type === "image/gif";
  const isVideoType = media?.type?.startsWith("video/");

  useEffect(() => {
    if (!media || !isImage) { setImg(null); return; }
    loadImage(media.url).then(setImg);
  }, [media, isImage]);

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const run = async () => {
    if (!media || busy) return;
    setBusy(true);
    setProgress(null);
    setResult(null);

    try {
      let blob, outName;

      if (isImage && img) {
        const budget = target ? DISCORD_LIMITS.find((d) => d.id === target)?.bytes : null;
        if (budget) {
          const r = await compressToTarget(img, { format: "webp" }, canvasRef.current, budget);
          blob = r.blob;
          outName = `${baseName(media.name)}-otimizado.${r.format === "jpeg" ? "jpg" : r.format}`;
        } else {
          const q = MODES.find((x) => x.id === mode).quality;
          blob = await toBlob(img, { format: "webp", quality: q }, canvasRef.current);
          outName = `${baseName(media.name)}-otimizado.webp`;
        }
      } else if (isGif) {
        setProgress(0);
        const inExt = media.name.split(".").pop() || "gif";
        const gifFps = mode === "ultra" ? 10 : mode === "balanced" ? 12 : 15;
        const gifScale = mode === "ultra" ? "scale=trunc(iw*0.7/2)*2:-2," : mode === "balanced" ? "scale=trunc(iw*0.85/2)*2:-2," : "";
        const gifColors = mode === "ultra" ? 64 : mode === "balanced" ? 128 : 256;
        const args = [
          "-i", `in.${inExt}`,
          "-vf", `fps=${gifFps},${gifScale}split[s0][s1];[s0]palettegen=max_colors=${gifColors}[p];[s1][p]paletteuse=dither=bayer`,
          "-loop", "0",
          "out.gif",
        ];
        blob = await runFFmpeg({
          file: media.file, inName: `in.${inExt}`, outName: "out.gif",
          args, outType: "image/gif",
          onProgress: setProgress, label: "Otimizar GIF",
        });
        outName = `${baseName(media.name)}-otimizado.gif`;
      } else {
        setProgress(0);
        const inExt = media.name.split(".").pop() || "mp4";
        const crf = mode === "ultra" ? 34 : mode === "balanced" ? 28 : 23;
        const args = [
          "-i", `in.${inExt}`,
          "-c:v", "libx264", "-crf", `${crf}`,
          "-preset", "veryfast",
          "-pix_fmt", "yuv420p",
          "-movflags", "faststart",
          "-c:a", "aac",
          "out.mp4",
        ];
        blob = await runFFmpeg({
          file: media.file, inName: `in.${inExt}`, outName: "out.mp4",
          args, outType: "video/mp4",
          onProgress: setProgress, label: "Otimizar Vídeo",
        });
        outName = `${baseName(media.name)}-otimizado.mp4`;
      }

      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size, name: outName, blob });
      addHistory({ id: outName + Date.now(), name: outName, kind: "optimize", size: blob.size });
      toast("Otimização concluída!", "success");
    } catch (e) {
      console.error(e);
      const m = e?.message || "";
      const msg = m.includes("demorou") || m.includes("timeout")
        ? "Timeout: arquivo grande demais. Tente o modo Ultra compacto."
        : m.includes("ocupado")
        ? "FFmpeg ocupado. Aguarde e tente novamente."
        : "Falha na otimização. Tente outro modo ou arquivo menor.";
      toast(msg, "error");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const handleSave = async () => {
    if (!result?.blob || saving) return;
    setSaving(true);
    try {
      const k = result.name.endsWith(".mp4") ? "video" : result.name.endsWith(".gif") ? "gif" : "image";
      await saveMedia({ name: result.name, kind: k, type: result.blob.type, blob: result.blob });
      toast("Salvo na biblioteca!", "success");
    } catch (e) {
      console.error(e);
      toast("Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setMedia(null);
    setResult(null);
    setImg(null);
    setMode("balanced");
    setTarget(null);
  };

  const reduction = result ? Math.max(0, Math.round((1 - result.size / media.size) * 100)) : 0;
  const fitsTarget = target && result
    ? result.size <= (DISCORD_LIMITS.find((d) => d.id === target)?.bytes || Infinity)
    : null;

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={Gauge}
          title="Otimização Inteligente"
          desc="Envie uma imagem, GIF ou vídeo e reduza o peso automaticamente."
          action={<div className="w-full max-w-md"><Dropzone compact /></div>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={reset} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-3 text-sm font-semibold text-ink flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-brand-500" /> Arquivo enviado
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Tamanho" value={formatBytes(media.size)} />
              <Stat label="Tipo" value={isImage ? "Imagem" : isGif ? "GIF" : "Vídeo"} />
              <Stat label="Formato" value={(media.name.split(".").pop() || "?").toUpperCase()} />
              <Stat label="Modo" value={target ? "Discord" : MODES.find((x) => x.id === mode)?.label || mode} accent="text-brand-500" />
            </div>
          </div>

          {(busy || result) && (
            <div className="card p-4">
              <div className="mb-3 text-sm font-semibold text-ink flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" /> Resultado
              </div>
              {busy && (
                <div className="py-8">
                  <ProgressBar value={progress} />
                  <p className="mt-3 text-center text-sm text-muted">
                    {progress != null ? `Otimizando… ${progress}%` : "Processando…"}
                  </p>
                </div>
              )}
              {result && !busy && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Antes" value={formatBytes(media.size)} />
                    <Stat label="Depois" value={formatBytes(result.size)} accent="text-emerald-500" />
                    <Stat label="Redução" value={`${reduction}%`} accent="text-emerald-500" />
                  </div>

                  {result.size >= media.size && (
                    <p className="mt-3 text-sm text-amber-500">
                      O arquivo otimizado ficou maior que o original. O original já estava bem comprimido.
                    </p>
                  )}

                  {fitsTarget !== null && (
                    <p className={`mt-3 text-sm flex items-center gap-1.5 ${fitsTarget ? "text-emerald-500" : "text-amber-500"}`}>
                      {fitsTarget ? <><CheckCircle2 className="h-4 w-4" /> Cabe no limite escolhido!</> : "Ainda acima do limite — tente Ultra compacto."}
                    </p>
                  )}

                  {(isGif || isVideoType) && (
                    <div className="mt-3 grid place-items-center rounded-xl checkerboard p-3">
                      {isGif ? (
                        <img src={result.url} alt="" className="max-h-[36vh] rounded-lg" />
                      ) : (
                        <video src={result.url} controls autoPlay loop muted className="max-h-[36vh] rounded-lg" />
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSave} disabled={saving} className="btn-ghost flex-1">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? "Salvando…" : "Salvar"}
                    </button>
                    <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary flex-[1.4]">
                      <Download className="h-4 w-4" /> Baixar otimizado
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Modo de qualidade" icon={Rocket}>
            <div className="space-y-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setTarget(null); }}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                    mode === m.id && !target ? "bg-brand-50 border-brand-200" : "bg-[#F6F5F6] border-line hover:bg-[#EEECED]"
                  }`}
                >
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
                <button
                  key={d.id}
                  onClick={() => setTarget(target === d.id ? null : d.id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    target === d.id ? "bg-brand-50 border-brand-200 text-brand-500" : "bg-[#F6F5F6] border-line text-muted hover:text-ink"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Panel>

          <button disabled={busy} onClick={run} className="btn-primary w-full">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Otimizando…</> : <><Sparkles className="h-4 w-4" /> Otimizar agora</>}
          </button>

          <p className="text-[11px] text-subtle text-center">
            {isImage ? "Imagens são comprimidas instantaneamente via Canvas." : "GIFs e vídeos usam FFmpeg (~31 MB na 1ª vez)."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Header({ onNew }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Gauge className="h-6 w-6 text-brand-500" /> Otimização Inteligente
        </h1>
        <p className="mt-1 text-sm text-subtle">Reduza o peso de imagens, GIFs e vídeos mantendo qualidade.</p>
      </div>
      {onNew && (
        <button onClick={onNew} className="btn-ghost shrink-0">Novo arquivo</button>
      )}
    </div>
  );
}
