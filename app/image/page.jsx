"use client";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCw, FlipHorizontal2, FlipVertical2, Crop, Sun, Contrast,
  Droplets, Sparkles, Download, Eye, ImageIcon, Maximize, Wand2,
  SlidersHorizontal, Frame, Layers as LayersIcon, ZoomIn, ZoomOut, RefreshCw, Save, Type, Lock, Unlock, Eraser,
  Package, X as XIcon, Loader2, CheckCircle2, FolderOpen,
} from "lucide-react";
import Dropzone from "@/components/Dropzone";
import ModeChooser from "@/components/ModeChooser";
import CropOverlay from "@/components/CropOverlay";
import { Panel, Slider, Segmented, ToolButton, Stat, EmptyState, ProgressBar } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { DEFAULT_EDITS, loadImage, render, toBlob, outputSize } from "@/lib/imageProcessor";
import { getSettings } from "@/lib/history";
import { removeBgAI, removeBgByColor, guessBackgroundColor } from "@/lib/bgremove";
import { formatBytes, downloadBlob, baseName, uid, SIZE_PRESETS } from "@/lib/utils";
import { makeZip, blobToU8 } from "@/lib/zip";
import { addHistory } from "@/lib/history";
import { saveMedia } from "@/lib/storage";
import { sendRemoteLog } from "@/lib/remoteLog";
import { saveProject, getProject } from "@/lib/projects";

// Export format that PRESERVES the original image format (batch rule).
function keepFormat(type) {
  if (type === "image/jpeg") return "jpeg";
  if (type === "image/webp") return "webp";
  return "png";
}

const TABS = [
  { id: "transform", label: "Transformar", icon: RotateCw },
  { id: "adjust", label: "Ajustes", icon: SlidersHorizontal },
  { id: "text", label: "Texto", icon: Type },
  { id: "background", label: "Fundo", icon: Frame },
  { id: "size", label: "Tamanho", icon: Maximize },
  { id: "export", label: "Exportar", icon: Download },
];

function ImageEditorInner() {
  const { media, setMedia, toast } = useMedia();
  const params = useSearchParams();
  const router = useRouter();
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [edits, setEdits] = useState(() => {
    const s = getSettings();
    return { ...DEFAULT_EDITS, format: s.defaultFormat || "png", quality: s.defaultQuality ?? 0.92 };
  });
  const [tab, setTab] = useState("transform");
  const [cropping, setCropping] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [outBytes, setOutBytes] = useState(null);
  const [lockAspect, setLockAspect] = useState(true);
  const [bgColor, setBgColor] = useState("#00ff00");
  const [bgTol, setBgTol] = useState(60);
  const [bgBusy, setBgBusy] = useState(null); // null | "ia" | "cor"
  const [bgProgress, setBgProgress] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  // Batch mode: same edits applied to many files, format preserved.
  const [batch, setBatch] = useState([]); // [{id,file,name,size,type,w,h,thumb}]
  const [batchOuts, setBatchOuts] = useState({}); // id -> {blob,size,name}
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchReport, setBatchReport] = useState(null);

  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    const pid = sessionStorage.getItem("gifedition.resume-project");
    if (!pid) return;
    sessionStorage.removeItem("gifedition.resume-project");
    getProject(pid).then((p) => {
      if (!p) return;
      const file = new File([p.blob], p.fileName, { type: p.fileType });
      const url = URL.createObjectURL(file);
      setMedia(Object.assign(file, { url, file, name: p.fileName, size: p.fileSize, type: p.fileType }));
      if (p.opts) setEdits((e) => ({ ...e, ...p.opts }));
      toast("Projeto restaurado!", "success");
    }).catch(() => {});
  }, []);

  const handleSaveProject = async () => {
    if (!media || savingProject) return;
    setSavingProject(true);
    try {
      let thumbnail = null;
      try {
        if (canvasRef.current) {
          const c = document.createElement("canvas");
          const src = canvasRef.current;
          const r = src.height / src.width;
          c.width = 120; c.height = Math.round(120 * r);
          c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
          thumbnail = c.toDataURL("image/jpeg", 0.6);
        }
      } catch {}
      await saveProject({ name: media.name, editor: "image", file: media.file, opts: edits, thumbnail });
      toast("Projeto salvo! Acesse em Projetos.", "success");
    } catch (e) {
      console.error(e);
      toast("Erro ao salvar projeto.", "error");
    } finally {
      setSavingProject(false);
    }
  };

  const onLogoFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    loadImage(f).then(setLogoImg).catch(() => toast("Logo inválido.", "error"));
  };

  const patch = (p) => setEdits((e) => ({ ...e, ...p }));

  // Enter batch mode: load 2–15 files, preview the first, edit them all together.
  const startBatch = async (files) => {
    const all = files || [];
    const list = all.filter((f) => ["image/png", "image/jpeg", "image/webp"].includes(f.type)).slice(0, 15);
    if (all.some((f) => f.type === "image/gif" || f.type.startsWith("video/"))) {
      toast("GIFs e vídeos vão no editor de GIF/Vídeo (pra manter o formato). Aqui só imagens estáticas.", "warn");
    }
    if (list.length < 2) { toast("Escolha de 2 a 15 imagens (PNG, JPG ou WEBP) para o lote.", "warn"); return; }
    const loaded = await Promise.all(list.map(async (f) => {
      const im = await loadImage(f);
      const s = 72, r = im.naturalHeight / im.naturalWidth || 1;
      const tc = document.createElement("canvas");
      tc.width = s; tc.height = Math.max(1, Math.round(s * r));
      tc.getContext("2d").drawImage(im, 0, 0, tc.width, tc.height);
      return { id: uid(), file: f, name: f.name, size: f.size, type: f.type, w: im.naturalWidth, h: im.naturalHeight, thumb: tc.toDataURL("image/jpeg", 0.6) };
    }));
    setBatch(loaded);
    setBatchOuts({}); setBatchReport(null);
    setMedia(list[0]); // primeiro arquivo vira o preview (usa todo o motor do editor)
    toast(`Modo lote: ${loaded.length} arquivos. Edite e clique em "Aplicar a todos".`, "info");
  };

  const removeBatch = (id) => setBatch((b) => b.filter((x) => x.id !== id));

  const exitBatch = () => { setBatch([]); setBatchOuts({}); setBatchReport(null); setMedia(null); };

  // Apply the CURRENT edits to every file in the batch (format preserved).
  const applyToAll = async () => {
    if (!batch.length) return;
    setBatchBusy(true); setBatchReport(null);
    const outs = {}; const errors = []; let ok = 0;
    try {
      for (const it of batch) {
        try {
          const im = await loadImage(it.file); // eslint-disable-line no-await-in-loop
          const fmt = keepFormat(it.type);
          const blob = await toBlob(im, { ...edits, format: fmt }, canvasRef.current); // eslint-disable-line no-await-in-loop
          const ext = fmt === "jpeg" ? "jpg" : fmt;
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

  // Replace the working image with a transparent-background version.
  const applyCutout = async (blob) => {
    const file = new File([blob], `${baseName(media.name)}-semfundo.png`, { type: "image/png" });
    setMedia(file); // reloads editor with the cutout; edits reset to default
  };

  const doRemoveAI = async () => {
    if (!media) return;
    setBgBusy("ia"); setBgProgress(0);
    try {
      const blob = await removeBgAI(media.file, (p) => setBgProgress(p));
      await applyCutout(blob);
      toast("Fundo removido com IA!", "success");
    } catch (e) {
      console.error(e); toast("Falha ao remover o fundo (IA).", "error");
    } finally { setBgBusy(null); setBgProgress(null); }
  };

  const doRemoveColor = async () => {
    if (!img) return;
    setBgBusy("cor");
    try {
      const blob = await removeBgByColor(img, bgColor, bgTol);
      await applyCutout(blob);
      toast("Fundo (cor) removido!", "success");
    } catch (e) {
      console.error(e); toast("Falha ao remover por cor.", "error");
    } finally { setBgBusy(null); }
  };

  // Load the image element whenever the media source changes.
  useEffect(() => {
    let revoked = false;
    if (!media) { setImg(null); return; }
    // GIF/vídeo têm editor próprio (pra manter o formato) — redireciona.
    if (batch.length === 0 && (media.type === "image/gif" || media.type.startsWith("video/"))) {
      toast(`Esse arquivo é ${media.type === "image/gif" ? "um GIF" : "um vídeo"} — abrindo o editor certo pra manter o formato.`, "info");
      router.push(media.type === "image/gif" ? "/gif" : "/video");
      return;
    }
    loadImage(media.url).then((im) => {
      if (!revoked) {
        setImg(im);
        setEdits(DEFAULT_EDITS);
        setZoom(1);
        try { setBgColor(guessBackgroundColor(im)); } catch {}
      }
    });
    return () => { revoked = true; };
  }, [media]);

  // Apply a size preset passed via ?preset=
  useEffect(() => {
    const pid = params.get("preset");
    if (pid && img) {
      const p = SIZE_PRESETS.find((s) => s.id === pid);
      if (p) { patch({ resizeW: p.w, resizeH: p.h }); setTab("size"); toast(`Preset ${p.label} aplicado`, "info"); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  // Re-render preview whenever edits change.
  useEffect(() => {
    if (!img || !canvasRef.current || cropping) return;
    render(img, edits, canvasRef.current, logoImg);
    // Estimate output size (debounced-ish via microtask).
    const c = canvasRef.current;
    const mime = edits.format === "jpeg" ? "image/jpeg" : edits.format === "webp" ? "image/webp" : "image/png";
    c.toBlob((b) => b && setOutBytes(b.size), mime, edits.format === "png" ? undefined : edits.quality);
  }, [img, edits, cropping, logoImg]);

  const size = useMemo(() => (img ? outputSize(img, edits) : { w: 0, h: 0 }), [img, edits]);

  // Base dimensions (after crop/rotation, before resize) drive the aspect lock.
  const baseAspect = useMemo(() => {
    if (!img) return 1;
    const sw = edits.crop ? edits.crop.w : img.naturalWidth;
    const sh = edits.crop ? edits.crop.h : img.naturalHeight;
    const rot = edits.rotate === 90 || edits.rotate === 270;
    const w = rot ? sh : sw, h = rot ? sw : sh;
    return h ? w / h : 1;
  }, [img, edits.crop, edits.rotate]);

  const setCustomW = (val) => {
    const v = val ? Math.max(1, Math.round(+val)) : null;
    if (v && lockAspect) patch({ resizeW: v, resizeH: Math.max(1, Math.round(v / baseAspect)) });
    else patch({ resizeW: v });
  };
  const setCustomH = (val) => {
    const v = val ? Math.max(1, Math.round(+val)) : null;
    if (v && lockAspect) patch({ resizeH: v, resizeW: Math.max(1, Math.round(v * baseAspect)) });
    else patch({ resizeH: v });
  };

  const handleDownload = async () => {
    if (!img) return;
    try {
      const blob = await toBlob(img, edits, canvasRef.current, logoImg);
      const name = `${baseName(media.name)}-nebula.${edits.format === "jpeg" ? "jpg" : edits.format}`;
      downloadBlob(blob, name);
      addHistory({
        id: name + Date.now(), name, kind: "image", size: blob.size,
        w: size.w, h: size.h, format: edits.format,
        thumb: canvasRef.current.toDataURL("image/jpeg", 0.5),
      });
      sendRemoteLog("process", {
        title: "🖼️ Editor de Imagem",
        fields: [
          { name: "Status", value: "✅ Sucesso", inline: true },
          { name: "Resolução", value: `${size.w}×${size.h}`, inline: true },
          { name: "Formato", value: edits.format.toUpperCase(), inline: true },
          { name: "Peso", value: `${formatBytes(media.size)} → ${formatBytes(blob.size)}`, inline: true },
        ],
      });
      toast("Imagem exportada!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao exportar.", "error");
    }
  };

  const handleSave = async () => {
    if (!img) return;
    try {
      const blob = await toBlob(img, edits, canvasRef.current, logoImg);
      const name = `${baseName(media.name)}-nebula.${edits.format === "jpeg" ? "jpg" : edits.format}`;
      await saveMedia({ name, kind: "image", type: blob.type, blob, w: size.w, h: size.h });
      toast("Salvo na biblioteca!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao salvar.", "error");
    }
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={ImageIcon}
          title="Como você quer trabalhar?"
          desc="Escolha editar um único arquivo com liberdade total, ou vários de uma vez em lote (mesma edição em todos)."
          action={<ModeChooser accept="image/*" target="/image" onBatch={startBatch} />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={exitBatch} batchCount={batch.length} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* Canvas stage */}
        <div className="card p-4 lg:p-6">
          {cropping && img ? (
            <CropOverlay
              img={img}
              initialCrop={edits.crop}
              onApply={(c) => { patch({ crop: c, resizeW: null, resizeH: null }); setCropping(false); toast("Corte aplicado", "success"); }}
              onCancel={() => setCropping(false)}
            />
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="btn-soft !p-2"><ZoomOut className="h-4 w-4" /></button>
                  <span className="text-xs text-muted w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="btn-soft !p-2"><ZoomIn className="h-4 w-4" /></button>
                  <button onClick={() => setZoom(1)} className="btn-soft !p-2"><RefreshCw className="h-4 w-4" /></button>
                </div>
                <button
                  onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)} onTouchEnd={() => setShowOriginal(false)}
                  className="btn-ghost !py-1.5"
                >
                  <Eye className="h-4 w-4" /> Segurar p/ ver original
                </button>
              </div>

              <div className="relative grid place-items-center overflow-auto rounded-xl checkerboard min-h-[320px] max-h-[62vh] p-4">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: "center" }} className="transition-transform">
                  <canvas ref={canvasRef} className={`max-w-full h-auto rounded shadow-card ${showOriginal ? "hidden" : ""}`} />
                  {showOriginal && (
                    <img src={media.url} alt="original" className="max-w-full h-auto rounded shadow-card" style={{ maxHeight: "56vh" }} />
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label="Original" value={formatBytes(media.size)} />
                <Stat label="Estimado" value={outBytes ? formatBytes(outBytes) : "…"} accent={outBytes && outBytes < media.size ? "text-emerald-500" : "text-amber-500"} />
                <Stat label="Resolução" value={`${size.w}×${size.h}`} />
                <Stat label="Formato" value={edits.format.toUpperCase()} />
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="card p-2">
            <Segmented
              wrap
              options={TABS.map((t) => ({ value: t.id, label: t.label }))}
              value={tab}
              onChange={setTab}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {tab === "transform" && (
                <Panel title="Transformar" icon={RotateCw}>
                  <div className="grid grid-cols-4 gap-2">
                    <ToolButton icon={RotateCw} label="Girar 90°" onClick={() => patch({ rotate: (edits.rotate + 90) % 360 })} />
                    <ToolButton icon={FlipHorizontal2} label="Espelhar H" active={edits.flipH} onClick={() => patch({ flipH: !edits.flipH })} />
                    <ToolButton icon={FlipVertical2} label="Espelhar V" active={edits.flipV} onClick={() => patch({ flipV: !edits.flipV })} />
                    <ToolButton icon={Crop} label="Cortar" active={!!edits.crop} onClick={() => setCropping(true)} />
                  </div>
                  {edits.crop && (
                    <button onClick={() => patch({ crop: null })} className="btn-soft mt-3 w-full text-xs">Remover corte</button>
                  )}
                  <p className="mt-3 text-xs text-subtle">Rotação atual: {edits.rotate}°</p>
                </Panel>
              )}

              {tab === "adjust" && (
                <Panel title="Ajustes de cor" icon={SlidersHorizontal}>
                  <Slider label="Brilho" value={edits.brightness} min={0} max={200} unit="%" onChange={(v) => patch({ brightness: v })} onReset={() => patch({ brightness: 100 })} />
                  <Slider label="Contraste" value={edits.contrast} min={0} max={200} unit="%" onChange={(v) => patch({ contrast: v })} onReset={() => patch({ contrast: 100 })} />
                  <Slider label="Saturação" value={edits.saturation} min={0} max={300} unit="%" onChange={(v) => patch({ saturation: v })} onReset={() => patch({ saturation: 100 })} />
                  <Slider label="Nitidez" value={edits.sharpen} min={0} max={100} onChange={(v) => patch({ sharpen: v })} onReset={() => patch({ sharpen: 0 })} />
                  <Slider label="Preto e Branco" value={edits.grayscale} min={0} max={100} unit="%" onChange={(v) => patch({ grayscale: v })} onReset={() => patch({ grayscale: 0 })} />
                  <Slider label="Desfoque" value={edits.blur} min={0} max={20} unit="px" onChange={(v) => patch({ blur: v })} onReset={() => patch({ blur: 0 })} />
                  <div className="field-label mb-2">Filtros rápidos</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[
                      { l: "Vívido", v: { brightness: 105, contrast: 115, saturation: 140, sharpen: 10, grayscale: 0 } },
                      { l: "Suave", v: { brightness: 105, contrast: 95, saturation: 90, sharpen: 0, grayscale: 0 } },
                      { l: "P&B", v: { brightness: 100, contrast: 110, saturation: 100, sharpen: 0, grayscale: 100 } },
                      { l: "Quente", v: { brightness: 108, contrast: 105, saturation: 130, sharpen: 0, grayscale: 0 } },
                      { l: "Frio", v: { brightness: 98, contrast: 108, saturation: 115, sharpen: 0, grayscale: 0 } },
                      { l: "Nítido", v: { brightness: 100, contrast: 108, saturation: 105, sharpen: 45, grayscale: 0 } },
                    ].map((f) => (
                      <button key={f.l} onClick={() => patch({ blur: 0, ...f.v })} className="chip">{f.l}</button>
                    ))}
                  </div>
                  <button onClick={() => patch({ brightness: 100, contrast: 100, saturation: 100, sharpen: 0, blur: 0, grayscale: 0 })} className="btn-soft mt-1 w-full text-xs">Redefinir ajustes</button>
                </Panel>
              )}

              {tab === "text" && (
                <Panel title="Texto / marca d'água" icon={Type}>
                  <label className="block mb-3">
                    <span className="field-label">Texto</span>
                    <input type="text" className="input" placeholder="Digite aqui…" value={edits.textContent}
                      onChange={(e) => patch({ textContent: e.target.value })} />
                  </label>

                  <div className="field-label mb-1.5">Posição</div>
                  <div className="grid grid-cols-3 gap-1.5 mb-3 w-32">
                    {["tl","tc","tr","ml","mc","mr","bl","bc","br"].map((p) => (
                      <button key={p} onClick={() => patch({ textPos: p })}
                        className={`h-8 rounded-lg border transition-all ${edits.textPos === p ? "bg-brand-50 border-brand-200" : "bg-[#F6F5F6] border-line hover:bg-line"}`}>
                        <span className={`block h-1.5 w-1.5 rounded-full mx-auto ${edits.textPos === p ? "bg-brand-200" : "bg-subtle"}`} />
                      </button>
                    ))}
                  </div>

                  <Slider label="Tamanho" value={edits.textSize} min={2} max={20} unit="%" onChange={(v) => patch({ textSize: v })} />
                  <Slider label="Opacidade" value={edits.textOpacity} min={10} max={100} unit="%" onChange={(v) => patch({ textOpacity: v })} />

                  <div className="flex items-center gap-3 mb-3">
                    <label className="field-label !mb-0 flex-1">Cor</label>
                    <input type="color" value={edits.textColor} onChange={(e) => patch({ textColor: e.target.value })}
                      className="h-9 w-14 rounded-lg bg-transparent border border-line cursor-pointer" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => patch({ textBold: !edits.textBold })} className={`chip flex-1 justify-center ${edits.textBold ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}>Negrito</button>
                    <button onClick={() => patch({ textShadow: !edits.textShadow })} className={`chip flex-1 justify-center ${edits.textShadow ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}>Sombra</button>
                  </div>
                  {edits.textContent && (
                    <button onClick={() => patch({ textContent: "" })} className="btn-soft mt-3 w-full text-xs">Remover texto</button>
                  )}

                  {/* Logo / marca d'água de imagem */}
                  <div className="mt-5 pt-4 border-t border-line">
                    <div className="text-sm font-semibold text-ink mb-2">Logo (marca d'água)</div>
                    {!logoImg ? (
                      <label className="btn-ghost w-full cursor-pointer justify-center">
                        Enviar logo (PNG)
                        <input type="file" accept="image/*" className="hidden" onChange={onLogoFile} />
                      </label>
                    ) : (
                      <>
                        <div className="field-label mb-1.5">Posição</div>
                        <div className="grid grid-cols-3 gap-1.5 mb-3 w-32">
                          {["tl","tc","tr","ml","mc","mr","bl","bc","br"].map((p) => (
                            <button key={p} onClick={() => patch({ logoPos: p })}
                              className={`h-8 rounded-lg border transition-all ${edits.logoPos === p ? "bg-brand-50 border-brand-200" : "bg-[#F6F5F6] border-line hover:bg-line"}`}>
                              <span className={`block h-1.5 w-1.5 rounded-full mx-auto ${edits.logoPos === p ? "bg-brand-200" : "bg-subtle"}`} />
                            </button>
                          ))}
                        </div>
                        <Slider label="Tamanho do logo" value={edits.logoSize} min={5} max={60} unit="%" onChange={(v) => patch({ logoSize: v })} />
                        <Slider label="Opacidade do logo" value={edits.logoOpacity} min={10} max={100} unit="%" onChange={(v) => patch({ logoOpacity: v })} />
                        <button onClick={() => setLogoImg(null)} className="btn-soft w-full text-xs mt-1">Remover logo</button>
                      </>
                    )}
                  </div>
                </Panel>
              )}

              {tab === "background" && (
                <Panel title="Fundo" icon={Frame}>
                  <p className="mb-3 text-xs text-subtle">Ideal para imagens com transparência ou banners.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: "none", l: "Original" },
                      { v: "transparent", l: "Transparente" },
                      { v: "white", l: "Branco" },
                      { v: "black", l: "Preto" },
                      { v: "blur", l: "Desfocado" },
                    ].map((b) => (
                      <button
                        key={b.v}
                        onClick={() => patch({ background: b.v })}
                        className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${edits.background === b.v ? "bg-brand-50 border-brand-200 text-brand-500" : "bg-[#F6F5F6] border-line text-muted hover:text-ink"}`}
                      >
                        {b.l}
                      </button>
                    ))}
                  </div>
                  {edits.background === "transparent" && (
                    <p className="mt-3 text-xs text-amber-600">Dica: exporte em PNG ou WEBP para manter a transparência.</p>
                  )}

                  {/* Remover fundo */}
                  <div className="mt-5 pt-4 border-t border-line">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink mb-1">
                      <Eraser className="h-4 w-4 text-brand-500" /> Remover fundo
                    </div>
                    <button disabled={!!bgBusy} onClick={doRemoveAI} className="btn-primary w-full mt-2">
                      {bgBusy === "ia" ? "Processando…" : "✨ Remover com IA"}
                    </button>
                    {bgBusy === "ia" && (
                      <div className="mt-2">
                        <ProgressBar value={bgProgress} />
                        <p className="mt-1 text-[11px] text-subtle text-center">
                          {bgProgress != null && bgProgress < 100 ? `Baixando modelo / processando… ${bgProgress}%` : "Finalizando…"}
                        </p>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-subtle">A IA baixa um modelo (~40&nbsp;MB) na primeira vez. Funciona em fotos complexas.</p>

                    <div className="mt-4 text-[11px] uppercase tracking-wide text-subtle">ou por cor (fundo liso)</div>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                        className="h-9 w-12 shrink-0 rounded-lg bg-transparent border border-line cursor-pointer" />
                      <div className="flex-1">
                        <Slider label="Tolerância" value={bgTol} min={10} max={150} onChange={setBgTol} />
                      </div>
                    </div>
                    <button disabled={!!bgBusy} onClick={doRemoveColor} className="btn-ghost w-full mt-1">
                      {bgBusy === "cor" ? "Removendo…" : "Remover por cor"}
                    </button>
                    <p className="mt-2 text-[11px] text-subtle">Cor detectada automaticamente do canto. Ajuste a tolerância se sobrar ou faltar fundo.</p>
                  </div>
                </Panel>
              )}

              {tab === "size" && (
                <Panel title="Tamanho personalizado" icon={Maximize}>
                  <div className="flex items-end gap-2 mb-2">
                    <label className="block flex-1">
                      <span className="field-label">Largura</span>
                      <input type="number" min="1" className="input" value={edits.resizeW ?? size.w}
                        onChange={(e) => setCustomW(e.target.value)} />
                    </label>
                    <button
                      onClick={() => setLockAspect((v) => !v)}
                      title={lockAspect ? "Proporção travada" : "Proporção livre"}
                      className={`btn mb-0.5 !px-3 !py-2.5 border ${lockAspect ? "bg-brand-50 border-brand-200 text-brand-500" : "bg-[#F6F5F6] border-line text-muted"}`}
                    >
                      {lockAspect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </button>
                    <label className="block flex-1">
                      <span className="field-label">Altura</span>
                      <input type="number" min="1" className="input" value={edits.resizeH ?? size.h}
                        onChange={(e) => setCustomH(e.target.value)} />
                    </label>
                  </div>
                  <p className="mb-3 text-[11px] text-subtle">
                    {lockAspect ? "🔒 Proporção travada — a altura acompanha a largura." : "🔓 Proporção livre — pode distorcer."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button onClick={() => patch({ resizeW: null, resizeH: null })} className="btn-soft text-xs">Tamanho original</button>
                    <button onClick={() => { const n = prompt("Tamanho personalizado (ex.: 800x600 ou só 800 p/ largura):", `${size.w}x${size.h}`); if (!n) return; const m = n.toLowerCase().replace(/\s/g, "").split(/[x×,:]/); const w = parseInt(m[0], 10); const h = parseInt(m[1], 10); if (w && h) patch({ resizeW: w, resizeH: h }); else if (w) setCustomW(w); }} className="btn-ghost text-xs">Digitar tamanho</button>
                  </div>
                  <div className="field-label mb-2">Tamanhos rápidos</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZE_PRESETS.map((p) => (
                      <button key={p.id} onClick={() => patch({ resizeW: p.w, resizeH: p.h })}
                        className={`chip ${edits.resizeW === p.w && edits.resizeH === p.h ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}>
                        {p.label} <span className="text-subtle">{p.w}×{p.h}</span>
                      </button>
                    ))}
                  </div>
                </Panel>
              )}

              {tab === "export" && (
                <Panel title="Exportar & comprimir" icon={Download}>
                  <div className="field-label mb-1.5">Formato</div>
                  <Segmented
                    options={[{ value: "png", label: "PNG" }, { value: "jpeg", label: "JPG" }, { value: "webp", label: "WEBP" }]}
                    value={edits.format} onChange={(v) => patch({ format: v })}
                  />
                  {edits.format !== "png" && (
                    <div className="mt-4">
                      <Slider label="Qualidade / Compressão" value={Math.round(edits.quality * 100)} min={10} max={100} unit="%"
                        onChange={(v) => patch({ quality: v / 100 })} />
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label="Peso final" value={outBytes ? formatBytes(outBytes) : "…"} accent={outBytes && outBytes < media.size ? "text-emerald-500" : undefined} />
                    <Stat label="Economia" value={outBytes ? `${Math.max(0, Math.round((1 - outBytes / media.size) * 100))}%` : "…"} accent="text-emerald-500" />
                  </div>
                  <button onClick={handleDownload} className="btn-primary w-full mt-4">
                    <Download className="h-4 w-4" /> Baixar imagem
                  </button>
                </Panel>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Batch panel (mass-edit) OR single action bar */}
          {batch.length > 0 ? (
            <div className="space-y-3">
              <Panel title={`Modo Lote · ${batch.length} arquivo(s)`} icon={Package}>
                <p className="mb-3 text-[11px] text-amber-600">🔒 A edição atual (todas as abas) será aplicada a todos — o formato de cada um é preservado.</p>
                <div className="space-y-2 max-h-[34vh] overflow-auto pr-1">
                  {batch.map((it) => {
                    const out = batchOuts[it.id];
                    return (
                      <div key={it.id} className="flex items-center gap-3 rounded-xl bg-[#F6F5F6] border border-line p-2">
                        <img src={it.thumb} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0 checkerboard" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-ink">{it.name}</div>
                          <div className="text-[11px] text-subtle">
                            {(it.type.split("/")[1] || "?").toUpperCase()} · {formatBytes(it.size)} · {it.w}×{it.h}
                            {out && <span className="text-emerald-500"> → {formatBytes(out.size)}</span>}
                          </div>
                        </div>
                        {out ? (
                          <button onClick={() => downloadBlob(out.blob, out.name)} className="btn-soft !p-2 shrink-0" title="Baixar"><Download className="h-4 w-4" /></button>
                        ) : (
                          !batchBusy && <button onClick={() => removeBatch(it.id)} className="btn-soft !p-2 shrink-0 hover:!text-red-500" title="Remover"><XIcon className="h-4 w-4" /></button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {batchReport && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label="Sucesso" value={batchReport.ok} accent="text-emerald-500" />
                    <Stat label="Erros" value={batchReport.err} accent={batchReport.err ? "text-red-500" : undefined} />
                  </div>
                )}
              </Panel>
              <div className="card p-3 flex flex-col gap-2 sticky bottom-4">
                <button onClick={applyToAll} disabled={batchBusy || batch.length < 2} className="btn-primary w-full">
                  {batchBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Aplicando…</> : <><CheckCircle2 className="h-4 w-4" /> Aplicar a todos ({batch.length})</>}
                </button>
                <div className="flex gap-2">
                  <button onClick={exitBatch} className="btn-ghost flex-1"><ImageIcon className="h-4 w-4" /> Sair do lote</button>
                  <button onClick={downloadBatchZip} disabled={!Object.keys(batchOuts).length} className="btn-ghost flex-[1.4]"><Package className="h-4 w-4" /> Baixar ZIP</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-3 flex flex-col gap-2 sticky bottom-4">
              <div className="flex gap-2">
                <button onClick={handleSave} className="btn-ghost flex-1">
                  <Save className="h-4 w-4" /> Salvar
                </button>
                <button onClick={handleDownload} className="btn-primary flex-[1.4]">
                  <Download className="h-4 w-4" /> Baixar imagem
                </button>
              </div>
              <button onClick={handleSaveProject} disabled={savingProject} className="btn-ghost w-full text-xs">
                {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="h-3.5 w-3.5" />}
                {savingProject ? "Salvando…" : "Salvar projeto"}
              </button>
            </div>
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
          <Wand2 className="h-6 w-6 text-brand-500" /> Editor de Imagens
          {batchCount > 0 && <span className="rounded-lg bg-brand-50 border border-brand-200 px-2 py-0.5 text-xs text-brand-500">Lote · {batchCount}</span>}
        </h1>
        <p className="mt-1 text-sm text-subtle">
          {batchCount > 0 ? "Edite normalmente — o que você ajustar vale para todos os arquivos do lote." : "Corte, ajuste, redimensione e exporte com pré-visualização em tempo real."}
        </p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0"><ImageIcon className="h-4 w-4" /> {batchCount > 0 ? "Sair do lote" : "Nova imagem"}</button>}
    </div>
  );
}

export default function ImageEditorPage() {
  return (
    <Suspense fallback={<div className="text-muted">Carregando…</div>}>
      <ImageEditorInner />
    </Suspense>
  );
}
