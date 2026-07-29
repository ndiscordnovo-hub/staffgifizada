"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Film, Download, Play, Gauge, Repeat, RotateCcw, Sparkles } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { Panel, Slider, Segmented, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { runFFmpeg } from "@/lib/ffmpeg";
import { formatBytes, downloadBlob, baseName } from "@/lib/utils";
import { addHistory } from "@/lib/history";
import { saveMedia } from "@/lib/storage";
import { Save } from "lucide-react";

export default function GifPage() {
  const { media, setMedia, toast } = useMedia();
  const [opts, setOpts] = useState({ scale: 100, fps: 15, speed: 1, colors: 128, reverse: false, loop: true });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null); // { url, size, name }
  const patch = (p) => setOpts((o) => ({ ...o, ...p }));

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const isVideo = media?.type?.startsWith("video/");

  const run = async (mode) => {
    if (!media) return;
    setBusy(true); setProgress(0); setResult(null);
    try {
      const inExt = media.name.split(".").pop() || (isVideo ? "mp4" : "gif");
      const inName = `in.${inExt}`;
      let outName, outType, args, kind;

      const vf = [];
      if (opts.scale !== 100) vf.push(`scale=trunc(iw*${opts.scale / 100}/2)*2:-2`);
      if (opts.speed !== 1) vf.push(`setpts=${(1 / opts.speed).toFixed(3)}*PTS`);
      if (opts.reverse) vf.push("reverse");

      if (mode === "to-video") {
        outName = "out.mp4"; outType = "video/mp4"; kind = "video";
        args = ["-i", inName, "-movflags", "faststart", "-pix_fmt", "yuv420p"];
        if (vf.length) args.push("-vf", vf.join(","));
        args.push(outName);
      } else {
        // Produce/optimize a GIF using a palette for good quality + small size.
        outName = "out.gif"; outType = "image/gif"; kind = "gif";
        const filter = [`fps=${opts.fps}`, ...vf].join(",");
        args = [
          "-i", inName,
          "-vf", `${filter},split[s0][s1];[s0]palettegen=max_colors=${opts.colors}[p];[s1][p]paletteuse=dither=bayer`,
          "-loop", opts.loop ? "0" : "-1",
          outName,
        ];
      }

      const blob = await runFFmpeg({
        file: media.file, inName, outName, args, outType,
        onProgress: (p) => setProgress(p),
      });
      const url = URL.createObjectURL(blob);
      const name = `${baseName(media.name)}-nebula.${kind === "video" ? "mp4" : "gif"}`;
      setResult({ url, size: blob.size, name, blob });
      addHistory({ id: name + Date.now(), name, kind, size: blob.size, thumb: null });
      toast("Processamento concluído!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao processar. Tente um arquivo menor.", "error");
    } finally {
      setBusy(false); setProgress(null);
    }
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={Film}
          title="Envie um GIF ou vídeo"
          desc="Otimize GIFs, converta vídeo em GIF, altere FPS, velocidade e muito mais."
          action={<div className="w-full max-w-md"><Dropzone accept="image/gif,video/*" target="/gif" compact /></div>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={() => { setMedia(null); setResult(null); }} />
      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-3 text-sm font-semibold text-white flex items-center gap-2"><Play className="h-4 w-4 text-brand-300" /> Original</div>
            <div className="grid place-items-center rounded-xl checkerboard p-4 min-h-[220px]">
              {isVideo ? (
                <video src={media.url} controls className="max-h-[46vh] rounded-lg" />
              ) : (
                <img src={media.url} alt="" className="max-h-[46vh] rounded-lg" />
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Arquivo" value={formatBytes(media.size)} />
              <Stat label="Tipo" value={isVideo ? "Vídeo" : "GIF"} />
              <Stat label="Nome" value={media.name.slice(0, 12) + (media.name.length > 12 ? "…" : "")} />
            </div>
          </div>

          {(busy || result) && (
            <div className="card p-4">
              <div className="mb-3 text-sm font-semibold text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-300" /> Resultado</div>
              {busy && (
                <div className="py-6">
                  <ProgressBar value={progress} />
                  <p className="mt-3 text-center text-sm text-white/50">
                    {progress != null ? `Processando… ${progress}%` : "Carregando FFmpeg…"}
                  </p>
                </div>
              )}
              {result && !busy && (
                <>
                  <div className="grid place-items-center rounded-xl checkerboard p-4">
                    {result.name.endsWith(".mp4") ? (
                      <video src={result.url} controls autoPlay loop muted className="max-h-[46vh] rounded-lg" />
                    ) : (
                      <img src={result.url} alt="" className="max-h-[46vh] rounded-lg" />
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label="Novo peso" value={formatBytes(result.size)} accent={result.size < media.size ? "text-emerald-400" : "text-amber-300"} />
                    <Stat label="Economia" value={`${Math.max(0, Math.round((1 - result.size / media.size) * 100))}%`} accent="text-emerald-400" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={async () => { await saveMedia({ name: result.name, kind: result.name.endsWith(".mp4") ? "video" : "gif", type: result.blob.type, blob: result.blob }); toast("Salvo na biblioteca!", "success"); }} className="btn-ghost flex-1">
                      <Save className="h-4 w-4" /> Salvar
                    </button>
                    <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary flex-[1.4]">
                      <Download className="h-4 w-4" /> Baixar {result.name.endsWith(".mp4") ? "vídeo" : "GIF"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Ajustes" icon={Gauge}>
            <Slider label="Tamanho (escala)" value={opts.scale} min={10} max={100} unit="%" onChange={(v) => patch({ scale: v })} />
            <Slider label="FPS" value={opts.fps} min={5} max={30} onChange={(v) => patch({ fps: v })} />
            <Slider label="Velocidade" value={opts.speed} min={0.25} max={3} step={0.25} unit="×" onChange={(v) => patch({ speed: v })} />
            <Slider label="Cores (qualidade)" value={opts.colors} min={16} max={256} step={16} onChange={(v) => patch({ colors: v })} />
            <div className="flex gap-2 mt-1">
              <button onClick={() => patch({ reverse: !opts.reverse })} className={`chip flex-1 justify-center ${opts.reverse ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}><Repeat className="h-3.5 w-3.5" /> Inverter</button>
              <button onClick={() => patch({ loop: !opts.loop })} className={`chip flex-1 justify-center ${opts.loop ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}><RotateCcw className="h-3.5 w-3.5" /> Loop infinito</button>
            </div>
          </Panel>

          <Panel title="Gerar" icon={Sparkles}>
            <button disabled={busy} onClick={() => run("to-gif")} className="btn-primary w-full mb-2">
              <Film className="h-4 w-4" /> {isVideo ? "Converter em GIF" : "Otimizar GIF"}
            </button>
            <button disabled={busy} onClick={() => run("to-video")} className="btn-ghost w-full">
              <Play className="h-4 w-4" /> Converter em vídeo (MP4)
            </button>
            <p className="mt-3 text-xs text-white/40">Primeira execução baixa o motor FFmpeg (~30&nbsp;MB) uma única vez.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Header({ onNew }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Film className="h-6 w-6 text-brand-300" /> Editor de GIF</h1>
        <p className="mt-1 text-sm text-white/45">Converta, otimize e ajuste GIFs direto no navegador.</p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0"><Film className="h-4 w-4" /> Novo arquivo</button>}
    </div>
  );
}
