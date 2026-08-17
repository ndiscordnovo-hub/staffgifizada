"use client";
import { useEffect, useState } from "react";
import {
  Film, Download, Play, Gauge, Repeat, RotateCcw, Sparkles, Loader2,
  Image as ImageIcon, Crop, Save, FlipHorizontal2, FlipVertical2,
  RotateCw, Scissors, Maximize2, FolderOpen, X as XIcon,
} from "lucide-react";
import Dropzone from "@/components/Dropzone";
import ModeChooser from "@/components/ModeChooser";
import CropOverlay from "@/components/CropOverlay";
import { Panel, Slider, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { runFFmpeg } from "@/lib/ffmpeg";
import { loadImage } from "@/lib/imageProcessor";
import { formatBytes, downloadBlob, baseName } from "@/lib/utils";
import { addHistory } from "@/lib/history";
import { saveMedia } from "@/lib/storage";
import { saveProject, getProject } from "@/lib/projects";

const isVideoFile = (type, name) =>
  type?.startsWith("video/") ||
  ["mp4", "webm", "mov", "mkv", "avi"].includes((name?.split(".").pop() || "").toLowerCase());

export default function GifPage() {
  const { media, setMedia, toast } = useMedia();

  const [opts, setOpts] = useState({
    scale: 100, useCustomSize: false, customW: 0, customH: 0,
    fps: 15, speed: 1, colors: 128, reverse: false, loop: true,
    brightness: 100, contrast: 100, saturation: 100, sharpen: 0, grayscale: 0,
    crop: null, rotate: 0, flipH: false, flipV: false,
    trimStart: 0, trimEnd: 0,
  });

  const [cropping, setCropping] = useState(false);
  const [frameImg, setFrameImg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  const patch = (p) => setOpts((o) => ({ ...o, ...p }));
  const isVideo = media && isVideoFile(media.type, media.name);

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  useEffect(() => {
    if (!media || !isVideo) { setDuration(0); return; }
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const d = Math.floor(v.duration || 0);
      setDuration(d);
      patch({ trimEnd: d });
      URL.revokeObjectURL(v.src);
    };
    v.src = URL.createObjectURL(media.file);
  }, [media?.url]);

  useEffect(() => {
    const pid = sessionStorage.getItem("gifedition.resume-project");
    if (!pid) return;
    sessionStorage.removeItem("gifedition.resume-project");
    getProject(pid).then((p) => {
      if (!p) return;
      const file = new File([p.blob], p.fileName, { type: p.fileType });
      const url = URL.createObjectURL(file);
      setMedia(Object.assign(file, { url, file, name: p.fileName, size: p.fileSize, type: p.fileType }));
      if (p.opts) setOpts((o) => ({ ...o, ...p.opts }));
      toast("Projeto restaurado!", "success");
    }).catch(() => {});
  }, []);

  const cssFilter = [
    `brightness(${opts.brightness}%)`,
    `contrast(${opts.contrast}%)`,
    `saturate(${opts.saturation}%)`,
    `grayscale(${opts.grayscale}%)`,
  ].join(" ");

  const cssTransform = [
    opts.rotate ? `rotate(${opts.rotate}deg)` : "",
    opts.flipH ? "scaleX(-1)" : "",
    opts.flipV ? "scaleY(-1)" : "",
  ].filter(Boolean).join(" ");

  const buildFilters = () => {
    const f = [];
    if (opts.crop) f.push(`crop=${opts.crop.w}:${opts.crop.h}:${opts.crop.x}:${opts.crop.y}`);
    if (opts.rotate === 90) f.push("transpose=1");
    else if (opts.rotate === 180) f.push("transpose=1,transpose=1");
    else if (opts.rotate === 270) f.push("transpose=2");
    if (opts.flipH) f.push("hflip");
    if (opts.flipV) f.push("vflip");
    const b = (opts.brightness - 100) / 100;
    const c = opts.contrast / 100;
    let s = opts.saturation / 100;
    if (opts.grayscale) s *= 1 - opts.grayscale / 100;
    if (b !== 0 || c !== 1 || s !== 1)
      f.push(`eq=brightness=${b.toFixed(3)}:contrast=${c.toFixed(3)}:saturation=${s.toFixed(3)}`);
    if (opts.sharpen > 0)
      f.push(`unsharp=5:5:${(opts.sharpen / 100 * 1.5).toFixed(2)}:5:5:0`);
    if (opts.speed !== 1) f.push(`setpts=${(1 / opts.speed).toFixed(3)}*PTS`);
    if (opts.reverse) f.push("reverse");
    if (opts.useCustomSize && opts.customW > 0 && opts.customH > 0)
      f.push(`scale=${Math.round(opts.customW / 2) * 2}:${Math.round(opts.customH / 2) * 2}`);
    else if (opts.scale !== 100)
      f.push(`scale=trunc(iw*${opts.scale / 100}/2)*2:-2`);
    return f;
  };

  const run = async (outputMode) => {
    if (!media || busy) return;
    setBusy(true);
    setProgress(0);
    setResult(null);

    try {
      const inExt = media.name.split(".").pop() || (isVideo ? "mp4" : "gif");
      const inName = `in.${inExt}`;
      const chain = buildFilters();
      const inputArgs = [];
      if (isVideo && opts.trimStart > 0) inputArgs.push("-ss", `${opts.trimStart}`);
      inputArgs.push("-i", inName);
      if (isVideo && opts.trimEnd > 0 && opts.trimEnd < duration)
        inputArgs.push("-t", `${opts.trimEnd - (opts.trimStart || 0)}`);

      let args, outName, outType, resultExt;

      if (outputMode === "video") {
        outName = "out.mp4";
        outType = "video/mp4";
        resultExt = "mp4";
        args = [...inputArgs];
        if (chain.length) args.push("-vf", chain.join(","));
        args.push("-c:v", "libx264", "-crf", "23", "-preset", "veryfast",
          "-pix_fmt", "yuv420p", "-movflags", "faststart");
        if (isVideo) args.push("-c:a", "aac");
        else args.push("-an");
        args.push(outName);
      } else {
        outName = "out.gif";
        outType = "image/gif";
        resultExt = "gif";
        const gifFilters = [`fps=${opts.fps}`, ...chain];
        const filterStr = `${gifFilters.join(",")},split[s0][s1];[s0]palettegen=max_colors=${opts.colors}[p];[s1][p]paletteuse=dither=bayer`;
        args = [...inputArgs, "-vf", filterStr, "-loop", opts.loop ? "0" : "-1", outName];
      }

      const blob = await runFFmpeg({
        file: media.file, inName, outName, args, outType,
        onProgress: setProgress, label: "Editor GIF",
      });

      const url = URL.createObjectURL(blob);
      const name = `${baseName(media.name)}-gif-edition.${resultExt}`;
      setResult({ url, size: blob.size, name, blob });
      addHistory({ id: name + Date.now(), name, kind: resultExt === "mp4" ? "video" : "gif", size: blob.size });
      toast("Concluído!", "success");
    } catch (e) {
      console.error(e);
      const m = e?.message || "";
      const msg = m.includes("demorou") || m.includes("timeout")
        ? "Timeout: arquivo grande demais ou muitos filtros. Reduza o tamanho ou desative Inverter/Velocidade."
        : m.includes("código") || m.includes("retornou")
        ? "Erro no FFmpeg. Formato não suportado ou filtros incompatíveis."
        : m.includes("ocupado")
        ? "FFmpeg ocupado. Aguarde e tente novamente."
        : m.includes("saída") || m.includes("vazio")
        ? "FFmpeg não gerou resultado. Tente configurações mais simples."
        : "Falha no processamento. Tente um arquivo menor ou menos filtros.";
      toast(msg, "error");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const exportFramePng = async () => {
    if (!media) return;
    try {
      let src, w, h;
      if (isVideo) {
        src = document.querySelector("video");
        if (!src) return toast("Aguarde o vídeo carregar.", "warn");
        w = src.videoWidth || 640; h = src.videoHeight || 360;
      } else {
        src = await loadImage(media.url);
        w = src.naturalWidth; h = src.naturalHeight;
      }
      if (opts.useCustomSize && opts.customW > 0 && opts.customH > 0) { w = opts.customW; h = opts.customH; }
      else if (opts.scale !== 100) { w = Math.round(w * opts.scale / 100); h = Math.round(h * opts.scale / 100); }
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.filter = cssFilter;
      ctx.drawImage(src, 0, 0, w, h);
      const blob = await new Promise((r) => c.toBlob(r, "image/png"));
      downloadBlob(blob, `${baseName(media.name)}.png`);
      toast("Frame exportado!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao exportar PNG.", "error");
    }
  };

  const openCrop = async () => {
    if (!media) return;
    try {
      let im;
      if (isVideo) {
        const v = document.querySelector("video");
        if (!v?.videoWidth) return toast("Aguarde o vídeo carregar.", "warn");
        const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        im = await loadImage(c.toDataURL("image/png"));
      } else {
        im = await loadImage(media.url);
      }
      setFrameImg(im);
      setCropping(true);
    } catch { toast("Não foi possível abrir o recorte.", "error"); }
  };

  const handleSaveProject = async () => {
    if (!media || savingProject) return;
    setSavingProject(true);
    try {
      let thumbnail = null;
      try {
        if (isVideo) {
          const v = document.querySelector("video");
          if (v?.videoWidth) {
            const c = document.createElement("canvas");
            c.width = 120; c.height = Math.round(120 * v.videoHeight / v.videoWidth);
            c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
            thumbnail = c.toDataURL("image/jpeg", 0.6);
          }
        } else {
          const img = document.querySelector(".checkerboard img");
          if (img) {
            const c = document.createElement("canvas");
            c.width = 120; c.height = Math.round(120 * img.naturalHeight / img.naturalWidth);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            thumbnail = c.toDataURL("image/jpeg", 0.6);
          }
        }
      } catch {}
      await saveProject({ name: media.name, editor: "gif", file: media.file, opts, thumbnail });
      toast("Projeto salvo!", "success");
    } catch (e) {
      console.error(e);
      toast("Erro ao salvar projeto.", "error");
    } finally {
      setSavingProject(false);
    }
  };

  const handleSave = async () => {
    if (!result?.blob || saving) return;
    setSaving(true);
    try {
      await saveMedia({ name: result.name, kind: result.name.endsWith(".mp4") ? "video" : "gif", type: result.blob.type, blob: result.blob });
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
    setCropping(false);
    setFrameImg(null);
    setDuration(0);
    setOpts({
      scale: 100, useCustomSize: false, customW: 0, customH: 0,
      fps: 15, speed: 1, colors: 128, reverse: false, loop: true,
      brightness: 100, contrast: 100, saturation: 100, sharpen: 0, grayscale: 0,
      crop: null, rotate: 0, flipH: false, flipV: false, trimStart: 0, trimEnd: 0,
    });
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={Film}
          title="Editor de GIF"
          desc="Envie um GIF ou vídeo para editar. Ajuste cores, tamanho, velocidade e muito mais."
          action={<ModeChooser accept="image/gif,video/*" target="/gif" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={reset} />

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-4">
          {cropping && frameImg ? (
            <div className="card p-4 lg:p-6">
              <div className="mb-3 text-sm font-semibold text-ink flex items-center gap-2">
                <Crop className="h-4 w-4 text-brand-500" /> Recortar
              </div>
              <CropOverlay
                img={frameImg}
                initialCrop={opts.crop}
                onApply={(c) => { patch({ crop: c }); setCropping(false); toast("Corte aplicado!", "success"); }}
                onCancel={() => setCropping(false)}
              />
            </div>
          ) : (
            <div className="card p-4">
              <div className="mb-3 text-sm font-semibold text-ink flex items-center gap-2">
                <Play className="h-4 w-4 text-brand-500" /> Original
              </div>
              <div className="grid place-items-center rounded-xl checkerboard p-4 min-h-[200px]">
                {isVideo ? (
                  <video src={media.url} controls autoPlay loop muted className="max-h-[42vh] rounded-lg" style={{ filter: cssFilter, transform: cssTransform }} />
                ) : (
                  <img src={media.url} alt="" className="max-h-[42vh] rounded-lg" style={{ filter: cssFilter, transform: cssTransform }} />
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat label="Arquivo" value={formatBytes(media.size)} />
                <Stat label="Tipo" value={isVideo ? "Vídeo" : "GIF"} />
                <Stat label="Nome" value={media.name.length > 14 ? media.name.slice(0, 12) + "…" : media.name} />
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <button onClick={openCrop} className={`chip flex-1 justify-center ${opts.crop ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}>
                  <Crop className="h-3.5 w-3.5" /> {opts.crop ? "Corte ativo" : "Recortar"}
                </button>
                {opts.crop && (
                  <button onClick={() => patch({ crop: null })} className="chip justify-center hover:!text-red-500">
                    <XIcon className="h-3.5 w-3.5" /> Remover corte
                  </button>
                )}
              </div>
            </div>
          )}

          {(busy || result) && (
            <div className="card p-4">
              <div className="mb-3 text-sm font-semibold text-ink flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" /> Resultado
              </div>
              {busy && (
                <div className="py-8">
                  <ProgressBar value={progress} />
                  <p className="mt-3 text-center text-sm text-muted">
                    {progress != null ? `Processando… ${progress}%` : "Carregando FFmpeg…"}
                  </p>
                </div>
              )}
              {result && !busy && (
                <>
                  <div className="grid place-items-center rounded-xl checkerboard p-4">
                    {result.name.endsWith(".mp4") ? (
                      <video src={result.url} controls autoPlay loop muted className="max-h-[42vh] rounded-lg" />
                    ) : (
                      <img src={result.url} alt="" className="max-h-[42vh] rounded-lg" />
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Stat label="Antes" value={formatBytes(media.size)} />
                    <Stat label="Depois" value={formatBytes(result.size)} accent={result.size < media.size ? "text-emerald-500" : "text-amber-500"} />
                    <Stat label="Redução" value={`${Math.max(0, Math.round((1 - result.size / media.size) * 100))}%`} accent="text-emerald-500" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSave} disabled={saving} className="btn-ghost flex-1">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? "Salvando…" : "Salvar"}
                    </button>
                    <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary flex-[1.4]">
                      <Download className="h-4 w-4" /> Baixar {result.name.endsWith(".mp4") ? "MP4" : "GIF"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Tamanho" icon={Maximize2}>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => patch({ useCustomSize: false })} className={`chip flex-1 justify-center text-xs ${!opts.useCustomSize ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}>Escala %</button>
                <button onClick={() => patch({ useCustomSize: true })} className={`chip flex-1 justify-center text-xs ${opts.useCustomSize ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}>Dimensão px</button>
              </div>
              {opts.useCustomSize ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-subtle">Largura</label>
                    <input type="number" min={16} max={4096} value={opts.customW || ""} onChange={(e) => patch({ customW: +e.target.value })} placeholder="px" className="mt-0.5 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink focus:border-brand-300 focus:ring-1 focus:ring-brand-200 outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] text-subtle">Altura</label>
                    <input type="number" min={16} max={4096} value={opts.customH || ""} onChange={(e) => patch({ customH: +e.target.value })} placeholder="px" className="mt-0.5 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink focus:border-brand-300 focus:ring-1 focus:ring-brand-200 outline-none" />
                  </div>
                </div>
              ) : (
                <Slider label="Escala" value={opts.scale} min={10} max={100} unit="%" onChange={(v) => patch({ scale: v })} />
              )}
            </div>
          </Panel>

          <Panel title="Cor" icon={Gauge}>
            <Slider label="Brilho" value={opts.brightness} min={0} max={200} unit="%" onChange={(v) => patch({ brightness: v })} onReset={() => patch({ brightness: 100 })} />
            <Slider label="Contraste" value={opts.contrast} min={0} max={200} unit="%" onChange={(v) => patch({ contrast: v })} onReset={() => patch({ contrast: 100 })} />
            <Slider label="Saturação" value={opts.saturation} min={0} max={300} unit="%" onChange={(v) => patch({ saturation: v })} onReset={() => patch({ saturation: 100 })} />
            <Slider label="Nitidez" value={opts.sharpen} min={0} max={100} onChange={(v) => patch({ sharpen: v })} onReset={() => patch({ sharpen: 0 })} />
            <Slider label="Preto e Branco" value={opts.grayscale} min={0} max={100} unit="%" onChange={(v) => patch({ grayscale: v })} onReset={() => patch({ grayscale: 0 })} />
          </Panel>

          <Panel title="Transformar" icon={RotateCw}>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-subtle mb-1.5">Rotação</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 90, 180, 270].map((deg) => (
                    <button key={deg} onClick={() => patch({ rotate: deg })} className={`chip justify-center text-xs ${opts.rotate === deg ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}>{deg}°</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => patch({ flipH: !opts.flipH })} className={`chip flex-1 justify-center ${opts.flipH ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}><FlipHorizontal2 className="h-3.5 w-3.5" /> Flip H</button>
                <button onClick={() => patch({ flipV: !opts.flipV })} className={`chip flex-1 justify-center ${opts.flipV ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}><FlipVertical2 className="h-3.5 w-3.5" /> Flip V</button>
              </div>
            </div>
          </Panel>

          <Panel title="Ajustes do GIF" icon={Film}>
            <Slider label="FPS" value={opts.fps} min={5} max={30} onChange={(v) => patch({ fps: v })} />
            <Slider label="Velocidade" value={opts.speed} min={0.25} max={3} step={0.25} unit="×" onChange={(v) => patch({ speed: v })} />
            <Slider label="Cores" value={opts.colors} min={16} max={256} step={16} onChange={(v) => patch({ colors: v })} />
            <div className="flex gap-2 mt-1">
              <button onClick={() => patch({ reverse: !opts.reverse })} className={`chip flex-1 justify-center ${opts.reverse ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}><Repeat className="h-3.5 w-3.5" /> Inverter</button>
              <button onClick={() => patch({ loop: !opts.loop })} className={`chip flex-1 justify-center ${opts.loop ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}><RotateCcw className="h-3.5 w-3.5" /> Loop</button>
            </div>
          </Panel>

          {isVideo && duration > 0 && (
            <Panel title="Cortar trecho" icon={Scissors}>
              <Slider label="Início" value={opts.trimStart} min={0} max={Math.max(0, (opts.trimEnd || duration) - 1)} unit="s" onChange={(v) => patch({ trimStart: v })} />
              <Slider label="Fim" value={opts.trimEnd} min={Math.min(opts.trimStart + 1, duration)} max={duration} unit="s" onChange={(v) => patch({ trimEnd: v })} />
              <p className="text-[11px] text-subtle mt-1">Duração: {opts.trimEnd - opts.trimStart}s (de {duration}s)</p>
            </Panel>
          )}

          <Panel title="Gerar" icon={Sparkles}>
            <button disabled={busy} onClick={() => run("gif")} className="btn-primary w-full mb-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {busy ? "Processando…" : isVideo ? "Converter para GIF" : "Gerar GIF"}
            </button>
            <button disabled={busy} onClick={() => run("video")} className="btn-ghost w-full mb-2">
              <Play className="h-4 w-4" /> Converter para MP4
            </button>
            <button disabled={busy} onClick={exportFramePng} className="btn-ghost w-full mb-2">
              <ImageIcon className="h-4 w-4" /> Exportar frame (PNG)
            </button>
            <button onClick={handleSaveProject} disabled={savingProject || busy} className="btn-ghost w-full">
              {savingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
              {savingProject ? "Salvando…" : "Salvar projeto"}
            </button>
            <p className="mt-3 text-[11px] text-subtle text-center">FFmpeg carrega ~31 MB na primeira execução.</p>
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
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Film className="h-6 w-6 text-brand-500" /> Editor de GIF
        </h1>
        <p className="mt-1 text-sm text-subtle">Edite, otimize e converta GIFs e vídeos direto no navegador.</p>
      </div>
      {onNew && (
        <button onClick={onNew} className="btn-ghost shrink-0">
          <Film className="h-4 w-4" /> Novo arquivo
        </button>
      )}
    </div>
  );
}
