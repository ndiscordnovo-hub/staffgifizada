// Lazy singleton wrapper around FFmpeg.wasm (single-threaded core loaded from CDN).
"use client";
import { log } from "@/lib/logger";
let ffmpegPromise = null;

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

export async function getFFmpeg(onProgress) {
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    log.info("Carregando motor FFmpeg (~30 MB, apenas na 1ª vez)…");
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ffmpeg = new FFmpeg();
    if (onProgress) ffmpeg.on("progress", ({ progress }) => onProgress(progress));
    ffmpeg.on("log", ({ message }) => log.ffmpeg(message));
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    log.success("FFmpeg pronto.");
    return ffmpeg;
  })();
  return ffmpegPromise;
}

// Helper: write a File to FFmpeg FS, run args, read output, return a Blob.
export async function runFFmpeg({ file, inName, outName, args, outType, onProgress }) {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  const progressHandler = ({ progress }) => onProgress?.(Math.min(100, Math.round(progress * 100)));
  ffmpeg.on("progress", progressHandler);
  log.cmd(`$ ffmpeg -i ${inName} ${args.filter((a) => a !== inName && a !== "-i").join(" ")}`);
  try {
    await ffmpeg.writeFile(inName, await fetchFile(file));
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outName);
    try { await ffmpeg.deleteFile(inName); await ffmpeg.deleteFile(outName); } catch {}
    log.success(`Concluído: ${outName}`);
    return new Blob([data.buffer], { type: outType });
  } catch (err) {
    log.error(`FFmpeg falhou: ${err?.message || err}`);
    throw err;
  } finally {
    ffmpeg.off("progress", progressHandler);
  }
}
