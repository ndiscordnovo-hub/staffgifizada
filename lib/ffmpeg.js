"use client";
import { log } from "@/lib/logger";
import { sendRemoteLog } from "@/lib/remoteLog";
import { formatBytes } from "@/lib/utils";
let ffmpegPromise = null;

const CDN_URLS = [
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd",
];

const EXEC_TIMEOUT = 5 * 60 * 1000;

export async function getFFmpeg() {
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    log.info("Carregando motor FFmpeg (~30 MB, apenas na 1ª vez)…");
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ffmpeg = new FFmpeg();
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

export async function runFFmpeg({ file, inName, outName, args, outType, onProgress, label }) {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  const progressHandler = ({ progress }) => onProgress?.(Math.min(100, Math.round(progress * 100)));
  ffmpeg.on("progress", progressHandler);

  const execArgs = args[0] === "-y" ? args : ["-y", ...args];

  log.cmd(`$ ffmpeg ${execArgs.join(" ")}`);
  const started = performance.now();
  const tool = label || outName?.split(".").pop()?.toUpperCase() || "FFmpeg";
  try {
    try { await ffmpeg.deleteFile(inName); } catch {}
    try { await ffmpeg.deleteFile(outName); } catch {}

    await ffmpeg.writeFile(inName, await fetchFile(file));

    const execPromise = ffmpeg.exec(execArgs);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("FFmpeg demorou demais (timeout 5min). Tente um arquivo menor.")), EXEC_TIMEOUT)
    );
    const ret = await Promise.race([execPromise, timeoutPromise]);

    if (ret !== 0) {
      throw new Error(`FFmpeg retornou código ${ret}. Verifique o formato do arquivo.`);
    }

    let data;
    try {
      data = await ffmpeg.readFile(outName);
    } catch (readErr) {
      throw new Error("FFmpeg não gerou o arquivo de saída. O formato pode não ser suportado.");
    }

    if (!data || (data.byteLength ?? data.length ?? 0) === 0) {
      throw new Error("FFmpeg gerou arquivo vazio. Tente outro formato ou arquivo menor.");
    }

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
    return new Blob([data], { type: outType });
  } catch (err) {
    log.error(`FFmpeg falhou: ${err?.message || err}`);
    sendRemoteLog("process", {
      title: `⚙️ ${tool}`,
      fields: [
        { name: "Status", value: "❌ Erro", inline: true },
        { name: "Detalhe", value: String(err?.message || err).slice(0, 300), inline: false },
      ],
    });
    try { await ffmpeg.deleteFile(inName); } catch {}
    try { await ffmpeg.deleteFile(outName); } catch {}
    throw err;
  } finally {
    ffmpeg.off("progress", progressHandler);
  }
}
