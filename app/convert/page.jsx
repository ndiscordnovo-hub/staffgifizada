"use client";
import { useEffect, useRef, useState } from "react";
import { Repeat, Download, ArrowRight } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { Panel, Segmented, ProgressBar, Stat, EmptyState } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { loadImage, toBlob } from "@/lib/imageProcessor";
import { runFFmpeg } from "@/lib/ffmpeg";
import { formatBytes, downloadBlob, baseName } from "@/lib/utils";
import { addHistory } from "@/lib/history";
import { saveMedia } from "@/lib/storage";
import { Save } from "lucide-react";

const TARGETS = {
  image: [{ v: "png", l: "PNG" }, { v: "jpeg", l: "JPG" }, { v: "webp", l: "WEBP" }, { v: "gif", l: "GIF" }],
  gif: [{ v: "mp4", l: "MP4" }, { v: "webm", l: "WEBM" }, { v: "png", l: "PNG (1º quadro)" }],
  video: [{ v: "mp4", l: "MP4" }, { v: "webm", l: "WEBM" }, { v: "gif", l: "GIF" }, { v: "mp3", l: "MP3 (áudio)" }],
};

export default function ConvertPage() {
  const { media, setMedia, toast } = useMedia();
  const canvasRef = useRef(null);
  const [to, setTo] = useState("webp");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  const category = !media ? null : media.type === "image/gif" ? "gif" : media.type.startsWith("video/") ? "video" : "image";

  useEffect(() => {
    if (category) setTo(TARGETS[category][0].v);
  }, [category]);

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const run = async () => {
    setBusy(true); setProgress(null); setResult(null);
    try {
      let blob, ext = to;
      if (category === "image" && to !== "gif") {
        const img = await loadImage(media.url);
        blob = await toBlob(img, { format: to, quality: 0.92 }, canvasRef.current);
        ext = to === "jpeg" ? "jpg" : to;
      } else {
        setProgress(0);
        const inExt = media.name.split(".").pop() || "bin";
        const inName = `in.${inExt}`;
        let outName, outType, args;
        if (to === "gif") {
          outName = "out.gif"; outType = "image/gif"; ext = "gif";
          args = ["-i", inName, "-vf", "fps=15,scale=trunc(iw/2)*2:-2,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", outName];
        } else if (to === "mp3") {
          outName = "out.mp3"; outType = "audio/mpeg"; ext = "mp3"; args = ["-i", inName, "-vn", "-q:a", "2", outName];
        } else if (to === "png") {
          outName = "out.png"; outType = "image/png"; ext = "png"; args = ["-i", inName, "-frames:v", "1", outName];
        } else if (to === "webm") {
          outName = "out.webm"; outType = "video/webm"; ext = "webm";
          args = ["-i", inName, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus", outName];
        } else {
          outName = "out.mp4"; outType = "video/mp4"; ext = "mp4";
          args = ["-i", inName, "-c:v", "libx264", "-crf", "24", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "faststart", "-c:a", "aac", outName];
        }
        blob = await runFFmpeg({ file: media.file, inName, outName, args, outType, onProgress: setProgress });
      }
      const name = `${baseName(media.name)}.${ext}`;
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size, name, blob });
      addHistory({ id: name + Date.now(), name, kind: "convert", size: blob.size });
      toast("Conversão concluída!", "success");
    } catch (e) { console.error(e); toast("Falha na conversão.", "error"); }
    finally { setBusy(false); setProgress(null); }
  };

  if (!media) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState icon={Repeat} title="Conversor universal" desc="Converta entre imagens, GIFs e vídeos: PNG, JPG, WEBP, GIF, MP4, WEBM e MP3."
          action={<div className="w-full max-w-md"><Dropzone compact /></div>} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={() => { setMedia(null); setResult(null); }} />
      <canvas ref={canvasRef} className="hidden" />
      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="card p-4">
          <div className="grid place-items-center rounded-xl checkerboard p-4 min-h-[240px]">
            {category === "video" ? <video src={media.url} controls className="max-h-[48vh] rounded-lg" /> : <img src={media.url} alt="" className="max-h-[48vh] rounded-lg" />}
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-sm text-white/60">
            <span className="chip">{media.type.split("/")[1]?.toUpperCase() || "?"}</span>
            <ArrowRight className="h-4 w-4 text-brand-300" />
            <span className="chip !border-brand-400/60 !bg-brand-500/20 !text-white">{to.toUpperCase()}</span>
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Converter para" icon={Repeat}>
            <div className="grid grid-cols-2 gap-2">
              {TARGETS[category].map((t) => (
                <button key={t.v} onClick={() => setTo(t.v)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${to === t.v ? "bg-brand-500/20 border-brand-400/50 text-white" : "bg-white/[0.03] border-white/10 text-white/60 hover:text-white"}`}>
                  {t.l}
                </button>
              ))}
            </div>
            <button disabled={busy} onClick={run} className="btn-primary w-full mt-4"><Repeat className="h-4 w-4" /> Converter</button>
          </Panel>

          {(busy || result) && (
            <Panel title="Resultado">
              {busy ? <div className="py-4"><ProgressBar value={progress} /><p className="mt-3 text-center text-sm text-white/50">{progress != null ? `${progress}%` : "Processando…"}</p></div> : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Stat label="Peso" value={formatBytes(result.size)} />
                    <Stat label="Formato" value={to.toUpperCase()} accent="text-brand-300" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { const k = ["mp4", "webm"].includes(to) ? "video" : to === "gif" ? "gif" : to === "mp3" ? "audio" : "image"; await saveMedia({ name: result.name, kind: k, type: result.blob.type, blob: result.blob }); toast("Salvo na biblioteca!", "success"); }} className="btn-ghost flex-1"><Save className="h-4 w-4" /> Salvar</button>
                    <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary flex-[1.4]"><Download className="h-4 w-4" /> Baixar</button>
                  </div>
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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Repeat className="h-6 w-6 text-brand-300" /> Conversor</h1>
        <p className="mt-1 text-sm text-white/45">Converta imagens, GIFs e vídeos entre formatos populares.</p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0">Novo arquivo</button>}
    </div>
  );
}
