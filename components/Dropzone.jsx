"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UploadCloud, ImageIcon, Film, Video } from "lucide-react";
import { useMedia } from "./MediaContext";

// Routes a dropped file to the correct editor by mime type.
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

  const handle = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      if (onFiles) return onFiles(files);
      const file = files[0];
      setMedia(file);
      const dest = target || routeFor(file.type);
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
        ${drag ? "border-brand-400 bg-brand-500/10 scale-[1.01]" : "border-white/12 hover:border-brand-400/50 hover:bg-white/[0.03]"}
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
      {/* shimmer sheen on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          animate={{ y: drag ? -6 : 0 }}
          className={`mb-4 grid ${compact ? "h-14 w-14" : "h-20 w-20"} place-items-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-brand-700/20 border border-white/10 ${drag ? "shadow-glow" : ""}`}
        >
          <UploadCloud className={`${compact ? "h-7 w-7" : "h-10 w-10"} text-brand-200`} />
        </motion.div>
        <h3 className={`font-bold text-white ${compact ? "text-base" : "text-xl sm:text-2xl"}`}>
          Arraste ou clique para enviar arquivos
        </h3>
        {!compact && (
          <>
            <p className="mt-2 text-sm text-white/50 max-w-md">
              Suporta imagens, GIFs e vídeos. Tudo é processado localmente — nada sai do seu dispositivo.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-white/45">
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
