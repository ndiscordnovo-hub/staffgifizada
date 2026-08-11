"use client";
import { useEffect, useRef, useState } from "react";
import { Laugh, Download, Save, ImageIcon } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { Panel, Slider, EmptyState, Stat } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { loadImage } from "@/lib/imageProcessor";
import { downloadBlob } from "@/lib/utils";
import { saveMedia } from "@/lib/storage";

function drawMemeText(ctx, text, x, y, maxW, fontSize) {
  if (!text) return;
  ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(2, fontSize / 12);
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeText(text.toUpperCase(), x, y, maxW);
  ctx.fillText(text.toUpperCase(), x, y, maxW);
}

export default function MemePage() {
  const { toast } = useMedia();
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");
  const [scale, setScale] = useState(10); // % of width

  const onFiles = async (files) => {
    const f = files.find((x) => x.type.startsWith("image/"));
    if (!f) return toast("Envie uma imagem.", "warn");
    const image = await loadImage(f);
    setImg(image);
  };

  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = canvasRef.current; c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const fs = (scale / 100) * w;
    drawMemeText(ctx, top, w / 2, fs * 1.1, w * 0.95, fs);
    drawMemeText(ctx, bottom, w / 2, h - fs * 0.4, w * 0.95, fs);
  }, [img, top, bottom, scale]);

  const getBlob = () => new Promise((res) => canvasRef.current.toBlob(res, "image/png"));

  const download = async () => {
    try {
      const blob = await getBlob();
      downloadBlob(blob, "meme-gifedition.png");
      toast("Meme baixado!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao gerar meme.", "error");
    }
  };

  const save = async () => {
    try {
      const b = await getBlob();
      await saveMedia({ name: "meme.png", kind: "image", type: "image/png", blob: b, w: img.naturalWidth, h: img.naturalHeight });
      toast("Meme salvo!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao salvar.", "error");
    }
  };

  if (!img) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState icon={Laugh} title="Envie uma imagem" desc="Adicione texto no topo e embaixo estilo meme clássico."
          action={<div className="w-full max-w-md"><Dropzone accept="image/*" onFiles={onFiles} compact /></div>} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onNew={() => { setImg(null); setTop(""); setBottom(""); }} />
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="card p-4 grid place-items-center">
          <canvas ref={canvasRef} className="max-w-full h-auto max-h-[62vh] rounded-lg shadow-card" />
        </div>
        <div className="space-y-4">
          <Panel title="Textos" icon={Laugh}>
            <label className="block mb-3">
              <span className="field-label">Texto de cima</span>
              <input className="input" value={top} onChange={(e) => setTop(e.target.value)} placeholder="QUANDO O DEPLOY" />
            </label>
            <label className="block">
              <span className="field-label">Texto de baixo</span>
              <input className="input" value={bottom} onChange={(e) => setBottom(e.target.value)} placeholder="FUNCIONA DE PRIMEIRA" />
            </label>
            <div className="mt-3"><Slider label="Tamanho do texto" value={scale} min={5} max={18} unit="%" onChange={setScale} /></div>
          </Panel>
          <div className="flex gap-2">
            <button onClick={save} className="btn-ghost flex-1"><Save className="h-4 w-4" /> Salvar</button>
            <button onClick={download} className="btn-primary flex-[1.4]"><Download className="h-4 w-4" /> Baixar</button>
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
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2"><Laugh className="h-6 w-6 text-brand-500" /> Gerador de Memes</h1>
        <p className="mt-1 text-sm text-subtle">Texto clássico de meme (fonte Impact com contorno), em tempo real.</p>
      </div>
      {onNew && <button onClick={onNew} className="btn-ghost shrink-0"><ImageIcon className="h-4 w-4" /> Nova imagem</button>}
    </div>
  );
}
