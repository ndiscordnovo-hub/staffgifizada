"use client";
import { useEffect, useRef, useState } from "react";
import { Smile, Download, Save, Sparkles } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { Panel, Segmented, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { loadImage } from "@/lib/imageProcessor";
import { runFFmpeg } from "@/lib/ffmpeg";
import { formatBytes, downloadBlob, baseName } from "@/lib/utils";
import { saveMedia } from "@/lib/storage";

const PRESETS = [
  { id: "emoji", label: "Emoji", size: 128, limit: 256 * 1024 },
  { id: "sticker", label: "Sticker", size: 320, limit: 512 * 1024 },
];

// Draw an image into a transparent square, contain or cover.
function toSquare(img, size, fit) {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const ratio = fit === "cover" ? Math.max(size / iw, size / ih) : Math.min(size / iw, size / ih);
  const dw = iw * ratio, dh = ih * ratio;
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return c;
}

export default function EmojiPage() {
  const { media, setMedia, toast } = useMedia();
  const [img, setImg] = useState(null);
  const [preset, setPreset] = useState("emoji");
  const [fit, setFit] = useState("contain");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  const isGif = media?.type === "image/gif";
  const cur = PRESETS.find((p) => p.id === preset);

  const onFiles = (files) => {
    const f = files.find((x) => x.type.startsWith("image/"));
    if (!f) return toast("Envie uma imagem ou GIF.", "warn");
    setMedia(f); setResult(null);
  };

  useEffect(() => {
    if (!media || isGif) { setImg(null); return; }
    loadImage(media.url).then(setImg);
  }, [media, isGif]);

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const generate = async () => {
    if (!media) return;
    setBusy(true); setResult(null); setProgress(null);
    try {
      let blob, name;
      if (isGif) {
        setProgress(0);
        const inExt = media.name.split(".").pop() || "gif";
        blob = await runFFmpeg({
          file: media.file, inName: `in.${inExt}`, outName: "out.gif", outType: "image/gif",
          args: ["-i", `in.${inExt}`, "-vf", `fps=15,scale=${cur.size}:${cur.size}:force_original_aspect_ratio=decrease,split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse`, "-loop", "0", "out.gif"],
          onProgress: setProgress,
        });
        name = `${baseName(media.name)}-${preset}.gif`;
      } else if (img) {
        const canvas = toSquare(img, cur.size, fit);
        blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
        name = `${baseName(media.name)}-${preset}.png`;
      }
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size, name, blob, gif: isGif });
      await saveMedia({ name, kind: isGif ? "gif" : "image", type: blob.type, blob, w: cur.size, h: cur.size });
      toast(`${cur.label} criado e salvo!`, "success");
    } catch (e) {
      console.error(e); toast("Falha ao gerar.", "error");
    } finally { setBusy(false); setProgress(null); }
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState icon={Smile} title="Emoji & Sticker do Discord" desc="Envie uma imagem ou GIF e ajuste automaticamente pros limites do Discord."
          action={<div className="w-full max-w-md"><Dropzone accept="image/*" onFiles={onFiles} compact /></div>} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={() => { setMedia(null); setResult(null); }} />
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="card p-4 grid place-items-center min-h-[260px]">
          <div className="grid place-items-center rounded-xl checkerboard p-6">
            {isGif ? <img src={media.url} alt="" className="max-h-[42vh] rounded" style={{ width: cur.size, height: cur.size, objectFit: fit }} />
                   : <img src={media.url} alt="" className="rounded" style={{ width: cur.size, height: cur.size, objectFit: fit, maxWidth: "100%" }} />}
          </div>
          <p className="mt-3 text-xs text-white/40">Prévia {cur.size}×{cur.size}px ({fit === "cover" ? "preenchido" : "ajustado"})</p>
        </div>

        <div className="space-y-4">
          <Panel title="Formato" icon={Smile}>
            <Segmented options={PRESETS.map((p) => ({ value: p.id, label: `${p.label} ${p.size}px` }))} value={preset} onChange={setPreset} />
            <div className="field-label mt-4">Enquadramento</div>
            <Segmented options={[{ value: "contain", label: "Ajustar" }, { value: "cover", label: "Preencher" }]} value={fit} onChange={setFit} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Alvo" value={`${cur.size}×${cur.size}`} />
              <Stat label="Limite" value={formatBytes(cur.limit)} />
            </div>
            <button disabled={busy} onClick={generate} className="btn-primary w-full mt-4">
              <Sparkles className="h-4 w-4" /> {busy ? "Gerando…" : `Gerar ${cur.label}`}
            </button>
            {isGif && <p className="mt-2 text-[11px] text-white/40">GIF usa o motor FFmpeg (baixa ~30MB na 1ª vez).</p>}
          </Panel>

          {(busy || result) && (
            <Panel title="Resultado">
              {busy ? <div className="py-3"><ProgressBar value={progress} /><p className="mt-2 text-center text-xs text-white/50">{progress != null ? `${progress}%` : "Processando…"}</p></div> : (
                <>
                  <div className="grid place-items-center rounded-xl checkerboard p-4 mb-3">
                    <img src={result.url} alt="" style={{ width: cur.size, height: cur.size, maxWidth: "100%" }} className="rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Stat label="Peso" value={formatBytes(result.size)} accent={result.size <= cur.limit ? "text-emerald-400" : "text-amber-300"} />
                    <Stat label="Cabe?" value={result.size <= cur.limit ? "✓ Sim" : "Acima"} accent={result.size <= cur.limit ? "text-emerald-400" : "text-amber-300"} />
                  </div>
                  <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary w-full"><Download className="h-4 w-4" /> Baixar</button>
                </>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ onNew }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Smile className="h-6 w-6 text-brand-300" /> Emoji & Sticker</h1>
        <p className="mt-1 text-sm text-white/45">Ajuste imagens e GIFs pros tamanhos e limites do Discord.</p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0"><Smile className="h-4 w-4" /> Novo</button>}
    </div>
  );
}
