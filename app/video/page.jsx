"use client";
import { useEffect, useRef, useState } from "react";
import { Video, Download, Scissors, Volume2, VolumeX, Film, Sparkles, Gauge, RotateCw, Crop, X as XIcon } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import ModeChooser from "@/components/ModeChooser";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import CropOverlay from "@/components/CropOverlay";
import { Panel, Slider, Segmented, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { runFFmpeg } from "@/lib/ffmpeg";
import { loadImage } from "@/lib/imageProcessor";
import { formatBytes, downloadBlob, baseName } from "@/lib/utils";
import { addHistory } from "@/lib/history";
import { saveMedia } from "@/lib/storage";
import { Save } from "lucide-react";

export default function VideoPage() {
  const { media, setMedia, toast } = useMedia();
  const videoRef = useRef(null);
  const [dur, setDur] = useState(0);
  const [opts, setOpts] = useState({
    start: 0, end: 0, scale: 100, fps: 30, crf: 26, rotate: 0,
    audio: "keep", format: "mp4",
    brightness: 100, contrast: 100, saturation: 100, sharpen: 0, grayscale: 0, crop: null,
  });
  const [frameImg, setFrameImg] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyTitle, setBusyTitle] = useState("Processando…");
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const patch = (p) => setOpts((o) => ({ ...o, ...p }));

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  // Live preview filter + FFmpeg color filters (aplicado a todos os frames).
  const cssFilter = `brightness(${opts.brightness}%) contrast(${opts.contrast}%) saturate(${opts.saturation}%) grayscale(${opts.grayscale}%)`;
  const colorFilters = () => {
    const out = [];
    const b = (opts.brightness - 100) / 100, c = opts.contrast / 100;
    let s = opts.saturation / 100;
    if (opts.grayscale) s *= 1 - opts.grayscale / 100;
    if (b !== 0 || c !== 1 || s !== 1) out.push(`eq=brightness=${b.toFixed(3)}:contrast=${c.toFixed(3)}:saturation=${s.toFixed(3)}`);
    if (opts.sharpen > 0) out.push(`unsharp=5:5:${(opts.sharpen / 100 * 1.5).toFixed(2)}:5:5:0`);
    return out;
  };

  const onLoaded = () => {
    const d = videoRef.current?.duration || 0;
    setDur(d);
    setOpts((o) => ({ ...o, end: d }));
  };

  const openCrop = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return toast("Aguarde o vídeo carregar.", "warn");
    try {
      const c = document.createElement("canvas");
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      setFrameImg(await loadImage(c.toDataURL("image/png")));
      setCropping(true);
    } catch { toast("Não foi possível abrir o corte.", "error"); }
  };

  const buildVf = () => {
    const vf = [];
    if (opts.crop) vf.push(`crop=${opts.crop.w}:${opts.crop.h}:${opts.crop.x}:${opts.crop.y}`);
    vf.push(...colorFilters());
    if (opts.scale !== 100) vf.push(`scale=trunc(iw*${opts.scale / 100}/2)*2:-2`);
    if (opts.rotate === 90) vf.push("transpose=1");
    if (opts.rotate === 180) vf.push("transpose=1,transpose=1");
    if (opts.rotate === 270) vf.push("transpose=2");
    return vf;
  };

  const run = async (mode) => {
    if (!media) return;
    setBusyTitle(mode === "gif" ? "Convertendo em GIF…" : mode === "audio" ? "Extraindo áudio…" : "Exportando vídeo…");
    setBusy(true); setProgress(0); setResult(null);
    try {
      const inExt = media.name.split(".").pop() || "mp4";
      const inName = `in.${inExt}`;
      const start = Math.max(0, opts.start);
      const dr = Math.max(0.1, (opts.end || dur) - start);
      const vf = buildVf();
      let outName, outType, kind, args;

      if (mode === "gif") {
        outName = "out.gif"; outType = "image/gif"; kind = "gif";
        const filter = [`fps=${Math.min(opts.fps, 20)}`, ...vf].join(",");
        args = ["-ss", `${start}`, "-t", `${dr}`, "-i", inName, "-vf",
          `${filter},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, outName];
      } else if (mode === "audio") {
        outName = "out.mp3"; outType = "audio/mpeg"; kind = "audio";
        args = ["-ss", `${start}`, "-t", `${dr}`, "-i", inName, "-vn", "-q:a", "2", outName];
      } else {
        outType = opts.format === "webm" ? "video/webm" : "video/mp4";
        outName = `out.${opts.format}`; kind = "video";
        args = ["-ss", `${start}`, "-t", `${dr}`, "-i", inName];
        if (vf.length) args.push("-vf", vf.join(","));
        if (opts.fps !== 30) args.push("-r", `${opts.fps}`);
        if (opts.format === "webm") {
          args.push("-c:v", "libvpx-vp9", "-crf", `${opts.crf}`, "-b:v", "0");
        } else {
          args.push("-c:v", "libx264", "-crf", `${opts.crf}`, "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "faststart");
        }
        if (opts.audio === "remove") args.push("-an");
        else args.push("-c:a", opts.format === "webm" ? "libopus" : "aac");
        args.push(outName);
      }

      const blob = await runFFmpeg({ file: media.file, inName, outName, args, outType, onProgress: (p) => setProgress(p) });
      const url = URL.createObjectURL(blob);
      const ext = outName.split(".").pop();
      const name = `${baseName(media.name)}-nebula.${ext}`;
      setResult({ url, size: blob.size, name, blob, kind });
      addHistory({ id: name + Date.now(), name, kind, size: blob.size });
      toast("Vídeo processado!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao processar o vídeo.", "error");
    } finally {
      setBusy(false); setProgress(null);
    }
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={Video}
          title="Como você quer trabalhar?"
          desc="Edite um vídeo com liberdade total, ou envie vários de uma vez em lote."
          action={<ModeChooser accept="video/*" target="/video" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={() => { setMedia(null); setResult(null); }} />
      <ProcessingOverlay open={busy} progress={progress} title={busyTitle} />
      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-4">
          {cropping && frameImg ? (
            <div className="card p-4 lg:p-6">
              <div className="mb-3 text-sm font-semibold text-white flex items-center gap-2"><Crop className="h-4 w-4 text-brand-300" /> Recortar (vale para todo o vídeo)</div>
              <CropOverlay img={frameImg} initialCrop={opts.crop} onApply={(c) => { patch({ crop: c }); setCropping(false); toast("Corte aplicado ao vídeo.", "success"); }} onCancel={() => setCropping(false)} />
            </div>
          ) : (
          <div className="card p-4">
            <video ref={videoRef} src={media.url} controls onLoadedMetadata={onLoaded} className="w-full rounded-xl max-h-[50vh] bg-black" style={{ filter: cssFilter }} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Peso" value={formatBytes(media.size)} />
              <Stat label="Duração" value={`${dur.toFixed(1)}s`} />
              <Stat label="Corte" value={`${(opts.end - opts.start || 0).toFixed(1)}s`} />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={openCrop} className={`chip flex-1 justify-center ${opts.crop ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}><Crop className="h-3.5 w-3.5" /> {opts.crop ? "Corte ativo" : "Recortar"}</button>
              {opts.crop && <button onClick={() => patch({ crop: null })} className="chip justify-center hover:!text-red-400"><XIcon className="h-3.5 w-3.5" /> Remover</button>}
            </div>
          </div>
          )}

          {(busy || result) && (
            <div className="card p-4">
              <div className="mb-3 text-sm font-semibold text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-300" /> Resultado</div>
              {busy && (
                <div className="py-6">
                  <ProgressBar value={progress} />
                  <p className="mt-3 text-center text-sm text-white/50">{progress != null ? `Processando… ${progress}%` : "Carregando FFmpeg…"}</p>
                </div>
              )}
              {result && !busy && (
                <>
                  <div className="grid place-items-center rounded-xl checkerboard p-3">
                    {result.kind === "video" && <video src={result.url} controls autoPlay loop muted className="max-h-[46vh] rounded-lg" />}
                    {result.kind === "gif" && <img src={result.url} alt="" className="max-h-[46vh] rounded-lg" />}
                    {result.kind === "audio" && <audio src={result.url} controls className="w-full" />}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label="Novo peso" value={formatBytes(result.size)} accent={result.size < media.size ? "text-emerald-400" : "text-amber-300"} />
                    <Stat label="Economia" value={`${Math.max(0, Math.round((1 - result.size / media.size) * 100))}%`} accent="text-emerald-400" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={async () => { await saveMedia({ name: result.name, kind: result.kind, type: result.blob.type, blob: result.blob }); toast("Salvo na biblioteca!", "success"); }} className="btn-ghost flex-1"><Save className="h-4 w-4" /> Salvar</button>
                    <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary flex-[1.4]"><Download className="h-4 w-4" /> Baixar</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Cortar" icon={Scissors}>
            <Slider label="Início" value={+opts.start.toFixed(1)} min={0} max={Math.max(0.1, dur)} step={0.1} unit="s" onChange={(v) => patch({ start: Math.min(v, opts.end) })} />
            <Slider label="Fim" value={+opts.end.toFixed(1)} min={0} max={Math.max(0.1, dur)} step={0.1} unit="s" onChange={(v) => patch({ end: Math.max(v, opts.start) })} />
          </Panel>

          <Panel title="Cor (todos os frames)" icon={Gauge}>
            <Slider label="Brilho" value={opts.brightness} min={0} max={200} unit="%" onChange={(v) => patch({ brightness: v })} onReset={() => patch({ brightness: 100 })} />
            <Slider label="Contraste" value={opts.contrast} min={0} max={200} unit="%" onChange={(v) => patch({ contrast: v })} onReset={() => patch({ contrast: 100 })} />
            <Slider label="Saturação" value={opts.saturation} min={0} max={300} unit="%" onChange={(v) => patch({ saturation: v })} onReset={() => patch({ saturation: 100 })} />
            <Slider label="Nitidez" value={opts.sharpen} min={0} max={100} onChange={(v) => patch({ sharpen: v })} onReset={() => patch({ sharpen: 0 })} />
            <Slider label="Preto e Branco" value={opts.grayscale} min={0} max={100} unit="%" onChange={(v) => patch({ grayscale: v })} onReset={() => patch({ grayscale: 0 })} />
          </Panel>

          <Panel title="Ajustes do vídeo" icon={Gauge}>
            <Slider label="Resolução (escala)" value={opts.scale} min={20} max={100} unit="%" onChange={(v) => patch({ scale: v })} />
            <Slider label="FPS" value={opts.fps} min={10} max={60} onChange={(v) => patch({ fps: v })} />
            <Slider label="Compressão (CRF)" value={opts.crf} min={18} max={40} onChange={(v) => patch({ crf: v })} />
            <p className="-mt-2 mb-3 text-[11px] text-white/35">CRF menor = melhor qualidade e maior peso.</p>
            <div className="field-label">Rotação</div>
            <Segmented options={[{ value: 0, label: "0°" }, { value: 90, label: "90°" }, { value: 180, label: "180°" }, { value: 270, label: "270°" }]} value={opts.rotate} onChange={(v) => patch({ rotate: v })} />
            <div className="field-label mt-4">Áudio</div>
            <Segmented options={[{ value: "keep", label: "Manter" }, { value: "remove", label: "Remover" }]} value={opts.audio} onChange={(v) => patch({ audio: v })} />
            <div className="field-label mt-4">Formato de saída</div>
            <Segmented options={[{ value: "mp4", label: "MP4" }, { value: "webm", label: "WEBM" }]} value={opts.format} onChange={(v) => patch({ format: v })} />
          </Panel>

          <Panel title="Gerar" icon={Sparkles}>
            <button disabled={busy} onClick={() => run("video")} className="btn-primary w-full mb-2"><Video className="h-4 w-4" /> Exportar vídeo</button>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={busy} onClick={() => run("gif")} className="btn-ghost"><Film className="h-4 w-4" /> Em GIF</button>
              <button disabled={busy} onClick={() => run("audio")} className="btn-ghost"><Volume2 className="h-4 w-4" /> Áudio</button>
            </div>
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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Video className="h-6 w-6 text-brand-300" /> Editor de Vídeos</h1>
        <p className="mt-1 text-sm text-white/45">Corte, comprima, gire, extraia áudio ou gere GIFs e banners animados.</p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0"><Video className="h-4 w-4" /> Novo vídeo</button>}
    </div>
  );
}
