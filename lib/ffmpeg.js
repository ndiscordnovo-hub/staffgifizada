// Lazy singleton wrapper around FFmpeg.wasm (single-threaded core loaded from CDN).
"use client";
import { log } from "@/lib/logger";
import { sendRemoteLog } from "@/lib/remoteLog";
import { formatBytes } from "@/lib/utils";
let ffmpegPromise = null;

const CDN_URLS = [
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd",
];

export async function getFFmpeg(onProgress) {
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    log.info("Carregando motor FFmpeg (~30 MB, apenas na 1ª vez)…");
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ffmpeg = new FFmpeg();
    if (onProgress) ffmpeg.on("progress", ({ progress }) => onProgress(progress));
    ffmpeg.on("log", ({ message }) => log.ffmpeg(message));
    let loaded = false;
    for (const base of CDN_URLS) {
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
        });
        loaded = true;
        break;
      } catch (e) {
        log.warn(`CDN falhou (${base}), tentando próximo…`);
      }
    }
    if (!loaded) throw new Error("Não foi possível carregar o FFmpeg de nenhum CDN.");
    log.success("FFmpeg pronto.");
    return ffmpeg;
  })().catch((err) => {
    ffmpegPromise = null;
    throw err;
  });
  return ffmpegPromise;
}

// Helper: write a File to FFmpeg FS, run args, read output, return a Blob.
export async function runFFmpeg({ file, inName, outName, args, outType, onProgress, label }) {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  const progressHandler = ({ progress }) => onProgress?.(Math.min(100, Math.round(progress * 100)));
  ffmpeg.on("progress", progressHandler);
  log.cmd(`$ ffmpeg -i ${inName} ${args.filter((a) => a !== inName && a !== "-i").join(" ")}`);
  const started = performance.now();
  const tool = label || outName?.split(".").pop()?.toUpperCase() || "FFmpeg";
  try {
    await ffmpeg.writeFile(inName, await fetchFile(file));
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outName);
    try { await ffmpeg.deleteFile(inName); await ffmpeg.deleteFile(outName); } catch {}
    log.success(`Concluído: ${outName}`);
    const took = ((performance.now() - started) / 1000).toFixed(1);
    const outSize = data.byteLength ?? data.length ?? 0;
    const inSize = file?.size || 0;
    const ratio = inSize ? Math.max(0, Math.round((1 - outSize / inSize) * 100)) : 0;
    sendRemoteLog("process", {
      title: `⚙️ ${tool}`,
      fields: [
        { name: "Status", value: "✅ Sucesso", inline: true },
        { name: "Tempo", value: `${took}s`, inline: true },
        { name: "Peso", value: `${formatBytes(inSize)} → ${formatBytes(outSize)}`, inline: true },
        { name: "Compressão", value: `${ratio}%`, inline: true },
      ],
    });
    return new Blob([data.buffer], { type: outType });
  } catch (err) {
    log.error(`FFmpeg falhou: ${err?.message || err}`);
    sendRemoteLog("process", {
      title: `⚙️ ${tool}`,
      fields: [
        { name: "Status", value: "❌ Erro", inline: true },
        { name: "Detalhe", value: String(err?.message || err).slice(0, 300), inline: false },
      ],
    });
    throw err;
  } finally {
    ffmpeg.off("progress", progressHandler);
  }
}
