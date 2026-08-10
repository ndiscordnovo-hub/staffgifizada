"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutTemplate, Wand2 } from "lucide-react";
import { useMedia } from "@/components/MediaContext";

// Each template is a ready-made background (at a Discord/social size) that opens
// in the image editor, so the user only adds text/logo. Generated on the fly.
const TEMPLATES = [
  { id: "banner-discord", name: "Banner Discord", w: 600, h: 240, style: "grad", from: "#e63946", to: "#7a1a1f" },
  { id: "banner-perfil", name: "Banner Perfil", w: 680, h: 240, style: "grad", from: "#1a1214", to: "#0b0709" },
  { id: "avatar", name: "Avatar / Ícone", w: 512, h: 512, style: "grad", from: "#f76167", to: "#8f1720" },
  { id: "story", name: "Story / Reels", w: 1080, h: 1920, style: "grad", from: "#0b0709", to: "#3a0d12" },
  { id: "youtube", name: "YouTube Thumb", w: 1280, h: 720, style: "grad", from: "#d21f2c", to: "#0b0709" },
  { id: "twitter", name: "Twitter/X Header", w: 1500, h: 500, style: "grad", from: "#1a1214", to: "#e63946" },
  { id: "solido-preto", name: "Fundo Preto", w: 1080, h: 1080, style: "solid", from: "#0b0709", to: "#0b0709" },
  { id: "solido-vermelho", name: "Fundo Vermelho", w: 1080, h: 1080, style: "solid", from: "#e63946", to: "#e63946" },
];

function makeCanvas(t) {
  const c = document.createElement("canvas");
  c.width = t.w; c.height = t.h;
  const ctx = c.getContext("2d");
  if (t.style === "grad") {
    const g = ctx.createLinearGradient(0, 0, t.w, t.h);
    g.addColorStop(0, t.from); g.addColorStop(1, t.to);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = t.from;
  }
  ctx.fillRect(0, 0, t.w, t.h);
  return c;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { setMedia, toast } = useMedia();

  const use = (t) => {
    const c = makeCanvas(t);
    c.toBlob((blob) => {
      const file = new File([blob], `template-${t.id}.png`, { type: "image/png" });
      setMedia(file);
      toast(`Template "${t.name}" aberto no editor`, "success");
      router.push("/image");
    }, "image/png");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-brand-500" /> Templates
        </h1>
        <p className="mt-1 text-sm text-subtle">
          Modelos prontos nos tamanhos certos. Escolha um, abra no editor e adicione seu texto e logo.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {TEMPLATES.map((t) => (
          <motion.button
            key={t.id}
            whileHover={{ y: -4 }}
            onClick={() => use(t)}
            className="group card overflow-hidden text-left hover:border-brand-200 transition-all"
          >
            <div className="relative aspect-video w-full overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background: t.style === "grad"
                    ? `linear-gradient(135deg, ${t.from}, ${t.to})`
                    : t.from,
                }}
              />
              <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <span className="btn-primary !py-2"><Wand2 className="h-4 w-4" /> Usar</span>
              </div>
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-ink">{t.name}</div>
              <div className="text-xs text-subtle">{t.w}×{t.h}</div>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-xs text-subtle">
        Dica: depois de abrir, use a aba <span className="text-muted">Texto</span> para escrever e o <span className="text-muted">Fundo</span> para trocar/remover.
      </p>
    </div>
  );
}
