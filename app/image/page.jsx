"use client";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCw, FlipHorizontal2, FlipVertical2, Crop, Sun, Contrast,
  Droplets, Sparkles, Download, Eye, ImageIcon, Maximize, Wand2,
  SlidersHorizontal, Frame, Layers as LayersIcon, ZoomIn, ZoomOut, RefreshCw, Save,
} from "lucide-react";
import Dropzone from "@/components/Dropzone";
import CropOverlay from "@/components/CropOverlay";
import { Panel, Slider, Segmented, ToolButton, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { DEFAULT_EDITS, loadImage, render, toBlob, outputSize } from "@/lib/imageProcessor";
import { formatBytes, downloadBlob, baseName, SIZE_PRESETS } from "@/lib/utils";
import { addHistory } from "@/lib/history";
import { saveMedia } from "@/lib/storage";

const TABS = [
  { id: "transform", label: "Transformar", icon: RotateCw },
  { id: "adjust", label: "Ajustes", icon: SlidersHorizontal },
  { id: "background", label: "Fundo", icon: Frame },
  { id: "size", label: "Tamanho", icon: Maximize },
  { id: "export", label: "Exportar", icon: Download },
];

function ImageEditorInner() {
  const { media, setMedia, toast } = useMedia();
  const params = useSearchParams();
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [edits, setEdits] = useState(DEFAULT_EDITS);
  const [tab, setTab] = useState("transform");
  const [cropping, setCropping] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [outBytes, setOutBytes] = useState(null);

  const patch = (p) => setEdits((e) => ({ ...e, ...p }));

  // Load the image element whenever the media source changes.
  useEffect(() => {
    let revoked = false;
    if (!media) { setImg(null); return; }
    loadImage(media.url).then((im) => {
      if (!revoked) {
        setImg(im);
        setEdits(DEFAULT_EDITS);
        setZoom(1);
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
    render(img, edits, canvasRef.current);
    // Estimate output size (debounced-ish via microtask).
    const c = canvasRef.current;
    const mime = edits.format === "jpeg" ? "image/jpeg" : edits.format === "webp" ? "image/webp" : "image/png";
    c.toBlob((b) => b && setOutBytes(b.size), mime, edits.format === "png" ? undefined : edits.quality);
  }, [img, edits, cropping]);

  const size = useMemo(() => (img ? outputSize(img, edits) : { w: 0, h: 0 }), [img, edits]);

  const handleDownload = async () => {
    if (!img) return;
    const blob = await toBlob(img, edits, canvasRef.current);
    const name = `${baseName(media.name)}-nebula.${edits.format === "jpeg" ? "jpg" : edits.format}`;
    downloadBlob(blob, name);
    addHistory({
      id: name + Date.now(), name, kind: "image", size: blob.size,
      w: size.w, h: size.h, format: edits.format,
      thumb: canvasRef.current.toDataURL("image/jpeg", 0.5),
    });
    toast("Imagem exportada!", "success");
  };

  const handleSave = async () => {
    if (!img) return;
    const blob = await toBlob(img, edits, canvasRef.current);
    const name = `${baseName(media.name)}-nebula.${edits.format === "jpeg" ? "jpg" : edits.format}`;
    await saveMedia({ name, kind: "image", type: blob.type, blob, w: size.w, h: size.h });
    toast("Salvo na sua biblioteca!", "success");
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={ImageIcon}
          title="Nenhuma imagem carregada"
          desc="Envie uma imagem para começar a editar. Redimensione, ajuste cores, corte e exporte."
          action={<div className="w-full max-w-md"><Dropzone accept="image/*" target="/image" compact /></div>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={() => setMedia(null)} />

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
                  <span className="text-xs text-white/50 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
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
                <Stat label="Estimado" value={outBytes ? formatBytes(outBytes) : "…"} accent={outBytes && outBytes < media.size ? "text-emerald-400" : "text-amber-300"} />
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
              options={TABS.map((t) => ({ value: t.id, label: t.label }))}
              value={tab}
              onChange={setTab}
              className="flex-wrap"
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
                  <p className="mt-3 text-xs text-white/40">Rotação atual: {edits.rotate}°</p>
                </Panel>
              )}

              {tab === "adjust" && (
                <Panel title="Ajustes de cor" icon={SlidersHorizontal}>
                  <Slider label="Brilho" value={edits.brightness} min={0} max={200} unit="%" onChange={(v) => patch({ brightness: v })} onReset={() => patch({ brightness: 100 })} />
                  <Slider label="Contraste" value={edits.contrast} min={0} max={200} unit="%" onChange={(v) => patch({ contrast: v })} onReset={() => patch({ contrast: 100 })} />
                  <Slider label="Saturação" value={edits.saturation} min={0} max={300} unit="%" onChange={(v) => patch({ saturation: v })} onReset={() => patch({ saturation: 100 })} />
                  <Slider label="Nitidez" value={edits.sharpen} min={0} max={100} onChange={(v) => patch({ sharpen: v })} onReset={() => patch({ sharpen: 0 })} />
                  <Slider label="Desfoque" value={edits.blur} min={0} max={20} unit="px" onChange={(v) => patch({ blur: v })} onReset={() => patch({ blur: 0 })} />
                  <button onClick={() => patch({ brightness: 100, contrast: 100, saturation: 100, sharpen: 0, blur: 0 })} className="btn-soft mt-1 w-full text-xs">Redefinir ajustes</button>
                </Panel>
              )}

              {tab === "background" && (
                <Panel title="Fundo" icon={Frame}>
                  <p className="mb-3 text-xs text-white/45">Ideal para imagens com transparência ou banners.</p>
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
                        className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${edits.background === b.v ? "bg-brand-500/20 border-brand-400/50 text-white" : "bg-white/[0.03] border-white/10 text-white/60 hover:text-white"}`}
                      >
                        {b.l}
                      </button>
                    ))}
                  </div>
                  {edits.background === "transparent" && (
                    <p className="mt-3 text-xs text-amber-300/80">Dica: exporte em PNG ou WEBP para manter a transparência.</p>
                  )}
                </Panel>
              )}

              {tab === "size" && (
                <Panel title="Tamanho & presets" icon={Maximize}>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <label className="block">
                      <span className="field-label">Largura</span>
                      <input type="number" className="input" value={edits.resizeW ?? size.w}
                        onChange={(e) => patch({ resizeW: e.target.value ? +e.target.value : null })} />
                    </label>
                    <label className="block">
                      <span className="field-label">Altura</span>
                      <input type="number" className="input" value={edits.resizeH ?? size.h}
                        onChange={(e) => patch({ resizeH: e.target.value ? +e.target.value : null })} />
                    </label>
                  </div>
                  <button onClick={() => patch({ resizeW: null, resizeH: null })} className="btn-soft w-full text-xs mb-4">Tamanho original</button>
                  <div className="field-label mb-2">Tamanhos rápidos</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZE_PRESETS.map((p) => (
                      <button key={p.id} onClick={() => patch({ resizeW: p.w, resizeH: p.h })}
                        className={`chip ${edits.resizeW === p.w && edits.resizeH === p.h ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}>
                        {p.label} <span className="text-white/30">{p.w}×{p.h}</span>
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
                    <Stat label="Peso final" value={outBytes ? formatBytes(outBytes) : "…"} accent={outBytes && outBytes < media.size ? "text-emerald-400" : undefined} />
                    <Stat label="Economia" value={outBytes ? `${Math.max(0, Math.round((1 - outBytes / media.size) * 100))}%` : "…"} accent="text-emerald-400" />
                  </div>
                  <button onClick={handleDownload} className="btn-primary w-full mt-4">
                    <Download className="h-4 w-4" /> Baixar imagem
                  </button>
                </Panel>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Always-visible action bar */}
          <div className="card p-3 flex gap-2 sticky bottom-4">
            <button onClick={handleSave} className="btn-ghost flex-1">
              <Save className="h-4 w-4" /> Salvar
            </button>
            <button onClick={handleDownload} className="btn-primary flex-[1.4]">
              <Download className="h-4 w-4" /> Baixar imagem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ onNew }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-brand-300" /> Editor de Imagens
        </h1>
        <p className="mt-1 text-sm text-white/45">Corte, ajuste, redimensione e exporte com pré-visualização em tempo real.</p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0"><ImageIcon className="h-4 w-4" /> Nova imagem</button>}
    </div>
  );
}

export default function ImageEditorPage() {
  return (
    <Suspense fallback={<div className="text-white/50">Carregando…</div>}>
      <ImageEditorInner />
    </Suspense>
  );
}
