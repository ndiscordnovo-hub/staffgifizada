"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UploadCloud, ImageIcon, Film, Video } from "lucide-react";
import { useMedia } from "./MediaContext";
import { sendRemoteLog } from "@/lib/remoteLog";
import { formatBytes } from "@/lib/utils";

function routeFor(type) {
  if (type.startsWith("video/")) return "/video";
  if (type === "image/gif") return "/gif";
  if (type.startsWith("image/")) return "/image";
  return "/image";
}

export default function Dropzone({ accept = "image/*,video/*", target, multiple = false, onFiles, compact = false }) {
  const inputRef = useRef(null);
  const router = useRouter();
  const { setMedia, toast } = useMedia();
  const [drag, setDrag] = useState(false);

  const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
  const ALLOWED = /^(image|video)\//;

  const handle = useCallback(
    (fileList) => {
      let files = Array.from(fileList || []);
      if (!files.length) return;
      const rejected = files.filter((f) => !ALLOWED.test(f.type));
      if (rejected.length) {
        toast(`Formato não suportado: ${rejected.map((f) => f.name).slice(0, 3).join(", ")}`, "error");
        files = files.filter((f) => ALLOWED.test(f.type));
        if (!files.length) return;
      }
      const tooBig = files.filter((f) => f.size > MAX_SIZE);
      if (tooBig.length) {
        toast(`Arquivo muito grande (máx 500 MB): ${tooBig.map((f) => f.name).slice(0, 2).join(", ")}`, "error");
        files = files.filter((f) => f.size <= MAX_SIZE);
        if (!files.length) return;
      }
      if (onFiles) {
        sendRemoteLog("upload", {
          title: "📦 Upload em lote",
          fields: [
            { name: "Arquivos", value: String(files.length), inline: true },
            { name: "Peso total", value: formatBytes(files.reduce((a, b) => a + b.size, 0)), inline: true },
          ],
        });
        return onFiles(files);
      }
      const file = files[0];
      const dest = target || routeFor(file.type);
      sendRemoteLog("upload", {
        title: "⬆️ Novo upload",
        fields: [
          { name: "Arquivo", value: file.name.slice(0, 200), inline: false },
          { name: "Tipo", value: file.type || "?", inline: true },
          { name: "Peso", value: formatBytes(file.size), inline: true },
          { name: "Ferramenta", value: dest.replace("/", "") || "editor", inline: true },
        ],
      });
      setMedia(file);
      toast(`"${file.name}" carregado`, "success");
      router.push(dest);
    },
    [onFiles, setMedia, target, toast, router]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all
        ${drag ? "border-brand-400 bg-brand-50 scale-[1.01]" : "border-line hover:border-brand-300 hover:bg-brand-50/40"}
        ${compact ? "p-6" : "p-10 sm:p-16"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-brand-500/[0.04] to-transparent" />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          animate={{ y: drag ? -6 : 0 }}
          className={`mb-4 grid ${compact ? "h-14 w-14" : "h-20 w-20"} place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 ${drag ? "shadow-glow" : ""}`}
        >
          <UploadCloud className={`${compact ? "h-7 w-7" : "h-10 w-10"} text-brand-500`} />
        </motion.div>
        <h3 className={`font-bold text-ink ${compact ? "text-base" : "text-xl sm:text-2xl"}`}>
          Arraste ou clique para enviar arquivos
        </h3>
        {!compact && (
          <>
            <p className="mt-2 text-sm text-muted max-w-md">
              Suporta imagens, GIFs e vídeos. Tudo é processado localmente — nada sai do seu dispositivo.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
              <span className="chip"><ImageIcon className="h-3.5 w-3.5" /> PNG · JPG · WEBP</span>
              <span className="chip"><Film className="h-3.5 w-3.5" /> GIF</span>
              <span className="chip"><Video className="h-3.5 w-3.5" /> MP4 · MOV · WEBM · MKV</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
