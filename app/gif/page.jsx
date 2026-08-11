"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Film, Download, Play, Gauge, Repeat, RotateCcw, Sparkles, Package, Loader2, X as XIcon, CheckCircle2, Image as ImageIcon, Crop, Save, FlipHorizontal2, FlipVertical2, RotateCw, Scissors, Maximize2, FolderOpen } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import ModeChooser from "@/components/ModeChooser";
import CropOverlay from "@/components/CropOverlay";
import { Panel, Slider, Segmented, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { runFFmpeg } from "@/lib/ffmpeg";
import { loadImage } from "@/lib/imageProcessor";
import { formatBytes, downloadBlob, baseName, uid } from "@/lib/utils";
import { makeZip, blobToU8 } from "@/lib/zip";
import { addHistory } from "@/lib/history";
import { saveMedia } from "@/lib/storage";
import { saveProject, getProject } from "@/lib/projects";

const isVideoFile = (type, name) =>
  type?.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi"].includes((name.split(".").pop() || "").toLowerCase());

export default function GifPage() {
  const { media, setMedia, toast } = useMedia();
  const [opts, setOpts] = useState({
    scale: 100, fps: 15, speed: 1, colors: 128, reverse: false, loop: true,
    brightness: 100, contrast: 100, saturation: 100, sharpen: 0, grayscale: 0,
    crop: null, rotate: 0, flipH: false, flipV: false,
    trimStart: 0, trimEnd: 0, useCustomSize: false, customW: 0, customH: 0,
  });
  const [frameImg, setFrameImg] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [duration, setDuration] = useState(0);
  const [batch, setBatch] = useState([]);
  const [batchOuts, setBatchOuts] = useState({});
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchReport, setBatchReport] = useState(null);
  const [savingProject, setSavingProject] = useState(false);
  const patch = (p) => setOpts((o) => ({ ...o, ...p }));

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const isVideo = media?.type?.startsWith("video/");

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
      toast("Projeto salvo! Acesse em Projetos.", "success");
    } catch (e) {
      console.error(e);
      toast("Erro ao salvar projeto.", "error");
    } finally {
      setSavingProject(false);
    }
  };

  const openCrop = async () => {
    if (!media) return;
    try {
      let im;
      if (isVideo) {
        const v = document.querySelector("video");
        if (!v || !v.videoWidth) return toast("Aguarde o vídeo carregar.", "warn");
        const c = document.createElement("canvas");
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        im = await loadImage(c.toDataURL("image/png"));
      } else {
        im = await loadImage(media.url);
      }
      setFrameImg(im);
      setCropping(true);
    } catch { toast("Não foi possível abrir o corte.", "error"); }
  };

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

  const colorFilters = () => {
    const out = [];
    const b = (opts.brightness - 100) / 100;
    const c = opts.contrast / 100;
    let s = opts.saturation / 100;
    if (opts.grayscale) s *= 1 - opts.grayscale / 100;
    if (b !== 0 || c !== 1 || s !== 1) out.push(`eq=brightness=${b.toFixed(3)}:contrast=${c.toFixed(3)}:saturation=${s.toFixed(3)}`);
    if (opts.sharpen > 0) out.push(`unsharp=5:5:${(opts.sharpen / 100 * 1.5).toFixed(2)}:5:5:0`);
    return out;
  };

  const cropFilter = () => (opts.crop ? [`crop=${opts.crop.w}:${opts.crop.h}:${opts.crop.x}:${opts.crop.y}`] : []);

  const transformFilters = () => {
    const out = [];
    if (opts.rotate === 90) out.push("transpose=1");
    else if (opts.rotate === 180) out.push("transpose=1,transpose=1");
    else if (opts.rotate === 270) out.push("transpose=2");
    if (opts.flipH) out.push("hflip");
    if (opts.flipV) out.push("vflip");
    return out;
  };

  const sizeFilters = () => {
    if (opts.useCustomSize && opts.customW > 0 && opts.customH > 0) {
      return [`scale=${Math.round(opts.customW / 2) * 2}:${Math.round(opts.customH / 2) * 2}`];
    }
    if (opts.scale !== 100) return [`scale=trunc(iw*${opts.scale / 100}/2)*2:-2`];
    return [];
  };

  const buildArgs = (inName, it) => {
    const vf = [...cropFilter(), ...transformFilters(), ...colorFilters(), ...sizeFilters()];
    if (opts.speed !== 1) vf.push(`setpts=${(1 / opts.speed).toFixed(3)}*PTS`);
    if (opts.reverse) vf.push("reverse");

    const inputArgs = ["-i", inName];
    if (isVideoFile(it.type, it.name) && opts.trimStart > 0) inputArgs.unshift("-ss", `${opts.trimStart}`);
    if (isVideoFile(it.type, it.name) && opts.trimEnd > 0 && opts.trimEnd < duration) inputArgs.push("-t", `${opts.trimEnd - (opts.trimStart || 0)}`);

    if (isVideoFile(it.type, it.name)) {
      const isWebm = (it.name.split(".").pop() || "").toLowerCase() === "webm";
      const outExt = isWebm ? "webm" : "mp4";
      const outName = `out.${outExt}`;
      const args = [...inputArgs];
      if (vf.length) args.push("-vf", vf.join(","));
      args.push("-r", `${opts.fps}`);
      if (isWebm) args.push("-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus");
      else args.push("-c:v", "libx264", "-crf", "24", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "faststart", "-c:a", "aac");
      args.push(outName);
      return { args, outName, outType: isWebm ? "video/webm" : "video/mp4", ext: outExt };
    }
    const filter = [`fps=${opts.fps}`, ...vf].join(",");
    return {
      args: [...inputArgs, "-vf", `${filter},split[s0][s1];[s0]palettegen=max_colors=${opts.colors}[p];[s1][p]paletteuse=dither=bayer`, "-loop", opts.loop ? "0" : "-1", "out.gif"],
      outName: "out.gif", outType: "image/gif", ext: "gif",
    };
  };

  const startBatch = async (files) => {
    const list = (files || []).slice(0, 15);
    if (list.length < 2) { toast("Escolha de 2 a 15 arquivos para o lote.", "warn"); return; }
    setBatch(list.map((f) => ({ id: uid(), file: f, name: f.name, size: f.size, type: f.type, progress: 0 })));
    setBatchOuts({}); setBatchReport(null);
    setMedia(list[0]); setResult(null);
    toast(`Modo lote: ${list.length} arquivos. Ajuste e clique em "Aplicar a todos".`, "info");
  };
  const removeBatch = (id) => setBatch((b) => b.filter((x) => x.id !== id));
  const exitBatch = () => { setBatch([]); setBatchOuts({}); setBatchReport(null); setMedia(null); setResult(null); };
  const setItemProg = (id, p) => setBatch((b) => b.map((x) => (x.id === id ? { ...x, progress: p } : x)));

  const applyToAll = async () => {
    if (!batch.length) return;
    setBatchBusy(true); setBatchReport(null);
    const outs = {}; const errors = []; let ok = 0;
    try {
      for (const it of batch) {
        try {
          const inExt = (it.name.split(".").pop() || "gif").toLowerCase();
          const inName = `in.${inExt}`;
          const { args, outName, outType, ext } = buildArgs(inName, it);
          const blob = await runFFmpeg({ file: it.file, inName, outName, outType, onProgress: (p) => setItemProg(it.id, p), args });
          outs[it.id] = { blob, size: blob.size, name: `${baseName(it.name)}.${ext}` };
          ok++;
        } catch (e) {
          console.error(e);
          errors.push(it.name);
          outs[it.id] = { error: e?.message || "Falha ao processar" };
        }
        setBatchOuts({ ...outs });
      }
    } finally {
      setBatchBusy(false);
      setBatchReport({ ok, err: errors.length, errors });
      const msg = errors.length
        ? `Lote: ${ok} ok, ${errors.length} erro(s): ${errors.join(", ")}`
        : `Lote aplicado: ${ok} arquivo(s) com sucesso!`;
      toast(msg, errors.length ? "warn" : "success");
    }
  };

  const downloadBatchZip = async () => {
    const list = batch.map((it) => batchOuts[it.id]).filter((o) => o?.blob);
    if (!list.length) return;
    const entries = await Promise.all(list.map(async (f) => ({ name: f.name, data: await blobToU8(f.blob) })));
    downloadBlob(await makeZip(entries), "gifedition-lote.zip");
    toast("ZIP do lote gerado!", "success");
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
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.filter = cssFilter;
      ctx.drawImage(src, 0, 0, w, h);
      const blob = await new Promise((r) => c.toBlob(r, "image/png"));
      downloadBlob(blob, `${baseName(media.name)}.png`);
      toast("Quadro exportado em PNG!", "success");
    } catch (e) { console.error(e); toast("Falha ao exportar PNG.", "error"); }
  };

  const handleSave = async () => {
    if (!result?.blob || saving) return;
    setSaving(true);
    try {
      await saveMedia({ name: result.name, kind: result.name.endsWith(".mp4") ? "video" : "gif", type: result.blob.type, blob: result.blob });
      toast("Salvo na biblioteca!", "success");
    } catch (e) {
      console.error(e);
      toast("Erro ao salvar. Tente novamente.", "error");
    } finally {
      setSaving(false);
    }
  };

  const run = async (mode) => {
    if (!media) return;
    setBusy(true); setProgress(0); setResult(null);
    try {
      const inExt = media.name.split(".").pop() || (isVideo ? "mp4" : "gif");
      const inName = `in.${inExt}`;
      let outName, outType, args, kind;

      const vf = [...cropFilter(), ...transformFilters(), ...colorFilters(), ...sizeFilters()];
      if (opts.speed !== 1) vf.push(`setpts=${(1 / opts.speed).toFixed(3)}*PTS`);
      if (opts.reverse) vf.push("reverse");

      const inputArgs = ["-i", inName];
      if (isVideo && opts.trimStart > 0) inputArgs.unshift("-ss", `${opts.trimStart}`);
      if (isVideo && opts.trimEnd > 0 && opts.trimEnd < duration) inputArgs.push("-t", `${opts.trimEnd - (opts.trimStart || 0)}`);

      if (mode === "to-video") {
        outName = "out.mp4"; outType = "video/mp4"; kind = "video";
        args = [...inputArgs, "-c:v", "libx264", "-crf", "23", "-preset", "veryfast", "-movflags", "faststart", "-pix_fmt", "yuv420p"];
        if (vf.length) args.push("-vf", vf.join(","));
        args.push(outName);
      } else {
        outName = "out.gif"; outType = "image/gif"; kind = "gif";
        const filter = [`fps=${opts.fps}`, ...vf].join(",");
        args = [
          ...inputArgs,
          "-vf", `${filter},split[s0][s1];[s0]palettegen=max_colors=${opts.colors}[p];[s1][p]paletteuse=dither=bayer`,
          "-loop", opts.loop ? "0" : "-1",
          outName,
        ];
      }

      const blob = await runFFmpeg({
        file: media.file, inName, outName, args, outType,
        onProgress: (p) => {
          setProgress(p);
        },
      });

      const url = URL.createObjectURL(blob);
      const name = `${baseName(media.name)}-nebula.${kind === "video" ? "mp4" : "gif"}`;
      setResult({ url, size: blob.size, name, blob });
      addHistory({ id: name + Date.now(), name, kind, size: blob.size, thumb: null });
      setBusy(false); setProgress(null);
    } catch (e) {
      console.error(e);
      toast("Falha ao processar. Tente um arquivo menor.", "error");
      setBusy(false); setProgress(null);
    }
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={Film}
          title="Como você quer trabalhar?"
          desc="Edite um GIF/vídeo com liberdade total, ou vários de uma vez em lote (mesmos ajustes em todos)."
          action={<ModeChooser accept="image/gif,video/*" target="/gif" onBatch={startBatch} />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={exitBatch} batchCount={batch.length} />
      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-4">
          {cropping && frameImg ? (
            <div className="card p-4 lg:p-6">
              <div className="mb-3 text-sm font-semibold text-ink flex items-center gap-2"><Crop className="h-4 w-4 text-brand-500" /> Recortar (vale para todos os quadros)</div>
              <CropOverlay
                img={frameImg}
                initialCrop={opts.crop}
                onApply={(c) => { patch({ crop: c }); setCropping(false); toast("Corte aplicado — vale para todos os quadros.", "success"); }}
                onCancel={() => setCropping(false)}
              />
            </div>
          ) : (
          <div className="card p-4">
            <div className="mb-3 text-sm font-semibold text-ink flex items-center gap-2"><Play className="h-4 w-4 text-brand-500" /> {batch.length > 0 ? "Preview (1º do lote)" : "Original"}</div>
            <div className="grid place-items-center rounded-xl checkerboard p-4 min-h-[220px]">
              {isVideo ? (
                <video src={media.url} controls autoPlay loop muted className="max-h-[46vh] rounded-lg" style={{ filter: cssFilter, transform: cssTransform }} />
              ) : (
                <img src={media.url} alt="" className="max-h-[46vh] rounded-lg" style={{ filter: cssFilter, transform: cssTransform }} />
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Arquivo" value={formatBytes(media.size)} />
              <Stat label="Tipo" value={isVideo ? "Vídeo" : "GIF"} />
              <Stat label="Nome" value={media.name.slice(0, 12) + (media.name.length > 12 ? "…" : "")} />
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={openCrop} className={`chip flex-1 justify-center ${opts.crop ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}><Crop className="h-3.5 w-3.5" /> {opts.crop ? "Corte ativo" : "Recortar"}</button>
              {opts.crop && <button onClick={() => patch({ crop: null })} className="chip justify-center hover:!text-red-500"><XIcon className="h-3.5 w-3.5" /> Remover corte</button>}
            </div>
          </div>
          )}

          {batch.length > 0 && (
            <div className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-ink flex items-center gap-2"><Package className="h-4 w-4 text-brand-500" /> Lote · {batch.length} arquivo(s)</div>
                {batchReport && <div className="text-xs"><span className="text-emerald-500">{batchReport.ok} ok</span>{batchReport.err ? <span className="text-red-500"> · {batchReport.err} erro</span> : null}</div>}
              </div>
              <p className="mb-3 text-[11px] text-amber-600">Os ajustes atuais valem para todos. Formato preservado (GIF→GIF, vídeo→vídeo).</p>
              <div className="space-y-2 max-h-[42vh] overflow-auto pr-1">
                {batch.map((it) => {
                  const out = batchOuts[it.id];
                  return (
                    <div key={it.id} className="rounded-xl bg-[#F6F5F6] border border-line p-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 shrink-0 grid place-items-center rounded-lg ${out?.error ? "bg-red-50 text-red-500" : out ? "bg-emerald-50 text-emerald-500" : "bg-brand-50 text-brand-500"}`}>
                          {out?.error ? <XIcon className="h-4 w-4" /> : out ? <CheckCircle2 className="h-4 w-4" /> : batchBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-ink">{it.name}</div>
                          <div className="text-[11px] text-subtle">
                            {out?.error
                              ? <span className="text-red-500">{out.error}</span>
                              : <>
                                  {(it.type.split("/")[1] || it.name.split(".").pop() || "?").toUpperCase()} · {formatBytes(it.size)}
                                  {out && <span className="text-emerald-500"> → {formatBytes(out.size)}</span>}
                                </>
                            }
                          </div>
                        </div>
                        {out?.blob ? (
                          <button onClick={() => downloadBlob(out.blob, out.name)} className="btn-soft !p-2 shrink-0" title="Baixar"><Download className="h-4 w-4" /></button>
                        ) : (
                          !batchBusy && !out?.error && <button onClick={() => removeBatch(it.id)} className="btn-soft !p-2 shrink-0 hover:!text-red-500" title="Remover"><XIcon className="h-4 w-4" /></button>
                        )}
                      </div>
                      {batchBusy && !out && it.progress > 0 && <div className="mt-2"><ProgressBar value={it.progress} /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!batch.length && (busy || result) && (
            <div className="card p-4">
              <div className="mb-3 text-sm font-semibold text-ink flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-500" /> Resultado</div>
              {busy && (
                <div className="py-6">
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
                      <video src={result.url} controls autoPlay loop muted className="max-h-[46vh] rounded-lg" />
                    ) : (
                      <img src={result.url} alt="" className="max-h-[46vh] rounded-lg" />
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label="Novo peso" value={formatBytes(result.size)} accent={result.size < media.size ? "text-emerald-500" : "text-amber-500"} />
                    <Stat label="Economia" value={`${Math.max(0, Math.round((1 - result.size / media.size) * 100))}%`} accent="text-emerald-500" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSave} disabled={saving} className="btn-ghost flex-1">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? "Salvando…" : "Salvar"}
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
          <Panel title="Cor (todos os frames)" icon={Gauge}>
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

          <Panel title="Ajustes do GIF" icon={Gauge}>
            <Slider label="FPS" value={opts.fps} min={5} max={30} onChange={(v) => patch({ fps: v })} />
            <Slider label="Velocidade" value={opts.speed} min={0.25} max={3} step={0.25} unit="×" onChange={(v) => patch({ speed: v })} />
            <Slider label="Cores (qualidade)" value={opts.colors} min={16} max={256} step={16} onChange={(v) => patch({ colors: v })} />
            <div className="flex gap-2 mt-1">
              <button onClick={() => patch({ reverse: !opts.reverse })} className={`chip flex-1 justify-center ${opts.reverse ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}><Repeat className="h-3.5 w-3.5" /> Inverter</button>
              <button onClick={() => patch({ loop: !opts.loop })} className={`chip flex-1 justify-center ${opts.loop ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}><RotateCcw className="h-3.5 w-3.5" /> Loop infinito</button>
            </div>
          </Panel>

          {isVideo && duration > 0 && (
            <Panel title="Cortar trecho" icon={Scissors}>
              <Slider label="Início" value={opts.trimStart} min={0} max={Math.max(0, (opts.trimEnd || duration) - 1)} unit="s" onChange={(v) => patch({ trimStart: v })} />
              <Slider label="Fim" value={opts.trimEnd} min={Math.min(opts.trimStart + 1, duration)} max={duration} unit="s" onChange={(v) => patch({ trimEnd: v })} />
              <p className="text-[11px] text-subtle mt-1">Duração: {opts.trimEnd - opts.trimStart}s (de {duration}s)</p>
            </Panel>
          )}

          {batch.length > 0 ? (
            <Panel title="Aplicar em lote" icon={Package}>
              <button onClick={applyToAll} disabled={batchBusy || batch.length < 2} className="btn-primary w-full mb-2">
                {batchBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Aplicando…</> : <><CheckCircle2 className="h-4 w-4" /> Aplicar a todos ({batch.length})</>}
              </button>
              <div className="flex gap-2">
                <button onClick={exitBatch} className="btn-ghost flex-1"><Film className="h-4 w-4" /> Sair</button>
                <button onClick={downloadBatchZip} disabled={!Object.keys(batchOuts).length} className="btn-ghost flex-[1.4]"><Package className="h-4 w-4" /> Baixar ZIP</button>
              </div>
              <p className="mt-3 text-xs text-subtle">Cada arquivo mantém seu formato. FFmpeg baixa ~30&nbsp;MB na 1ª vez.</p>
            </Panel>
          ) : (
            <Panel title="Gerar" icon={Sparkles}>
              <button disabled={busy} onClick={() => run("to-gif")} className="btn-primary w-full mb-2">
                <Film className="h-4 w-4" /> {isVideo ? "Converter em GIF" : "Otimizar GIF"}
              </button>
              <button disabled={busy} onClick={() => run("to-video")} className="btn-ghost w-full mb-2">
                <Play className="h-4 w-4" /> Converter em vídeo (MP4)
              </button>
              <button disabled={busy} onClick={exportFramePng} className="btn-ghost w-full mb-2">
                <ImageIcon className="h-4 w-4" /> Baixar quadro (PNG)
              </button>
              <button onClick={handleSaveProject} disabled={savingProject} className="btn-ghost w-full">
                {savingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                {savingProject ? "Salvando…" : "Salvar projeto"}
              </button>
              <p className="mt-3 text-xs text-subtle">FFmpeg baixa ~30&nbsp;MB na 1ª vez.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ onNew, batchCount }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Film className="h-6 w-6 text-brand-500" /> Editor de GIF
          {batchCount > 0 && <span className="rounded-lg bg-brand-50 border border-brand-200 px-2 py-0.5 text-xs text-brand-500">Lote · {batchCount}</span>}
        </h1>
        <p className="mt-1 text-sm text-subtle">{batchCount > 0 ? "Ajuste e aplique os mesmos parâmetros a todos os arquivos." : "Converta, otimize e ajuste GIFs direto no navegador."}</p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0"><Film className="h-4 w-4" /> {batchCount > 0 ? "Sair do lote" : "Novo arquivo"}</button>}
    </div>
  );
}
