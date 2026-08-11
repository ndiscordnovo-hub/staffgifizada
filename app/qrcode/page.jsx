"use client";
import { useEffect, useRef, useState } from "react";
import { QrCode, Download, Save } from "lucide-react";
import { Panel, Slider, Segmented, Stat } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { downloadBlob, DISCORD_INVITE } from "@/lib/utils";
import { loadImage } from "@/lib/imageProcessor";
import { saveMedia } from "@/lib/storage";

const COLOR_PRESETS = [
  { l: "Clássico", dark: "#000000", light: "#ffffff" },
  { l: "Gif Edition", dark: "#e63946", light: "#0b0709" },
  { l: "Vermelho", dark: "#d21f2c", light: "#ffffff" },
  { l: "Discord", dark: "#5865F2", light: "#ffffff" },
];

export default function QrCodePage() {
  const { toast } = useMedia();
  const canvasRef = useRef(null);
  const [text, setText] = useState(DISCORD_INVITE);
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [dark, setDark] = useState("#000000");
  const [light, setLight] = useState("#ffffff");
  const [ecc, setEcc] = useState("M");
  const [logoImg, setLogoImg] = useState(null); // opcional

  const onLogoFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    loadImage(f).then(setLogoImg).catch(() => toast("Logo inválido.", "error"));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!canvasRef.current) return;
      const QRCode = (await import("qrcode")).default;
      try {
        await QRCode.toCanvas(canvasRef.current, text || " ", {
          width: size, margin, errorCorrectionLevel: logoImg ? "H" : ecc,
          color: { dark, light },
        });
        if (logoImg && !cancelled) {
          const ctx = canvasRef.current.getContext("2d");
          const box = size * 0.24;
          const pad = box * 0.14;
          const x = (size - box) / 2;
          const y = (size - box) / 2;
          ctx.fillStyle = light;
          const r = box * 0.18;
          ctx.beginPath();
          ctx.roundRect(x - pad, y - pad, box + pad * 2, box + pad * 2, r);
          ctx.fill();
          const ar = logoImg.naturalHeight / logoImg.naturalWidth || 1;
          const lw = box, lh = box * ar;
          ctx.drawImage(logoImg, (size - lw) / 2, (size - lh) / 2, lw, lh);
        }
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [text, size, margin, dark, light, ecc, logoImg]);

  const getBlob = () => new Promise((res) => canvasRef.current.toBlob(res, "image/png"));

  const download = async () => {
    try {
      const blob = await getBlob();
      downloadBlob(blob, "qrcode-gifedition.png");
      toast("QR Code baixado!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao gerar QR.", "error");
    }
  };

  const save = async () => {
    try {
      const blob = await getBlob();
      await saveMedia({ name: "qrcode.png", kind: "image", type: "image/png", blob, w: size, h: size });
      toast("QR Code salvo!", "success");
    } catch (e) {
      console.error(e);
      toast("Falha ao salvar.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2"><QrCode className="h-6 w-6 text-brand-500" /> Gerador de QR Code</h1>
        <p className="mt-1 text-sm text-subtle">Crie um QR Code do convite do servidor ou de qualquer link. Baixe e divulgue.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="card p-6 grid place-items-center">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <canvas ref={canvasRef} className="block max-w-full h-auto" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-xs">
            <Stat label="Tamanho" value={`${size}px`} />
            <Stat label="Correção" value={ecc} />
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Conteúdo" icon={QrCode}>
            <label className="block">
              <span className="field-label">Texto ou link</span>
              <textarea className="input min-h-[70px] resize-y" value={text} onChange={(e) => setText(e.target.value)} placeholder="https://discord.gg/…" />
            </label>
            <button onClick={() => setText(DISCORD_INVITE)} className="btn-soft w-full text-xs mt-2">Usar convite do Discord</button>
          </Panel>

          <Panel title="Aparência">
            <div className="field-label mb-1.5">Cores prontas (opcional)</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COLOR_PRESETS.map((p) => (
                <button key={p.l} onClick={() => { setDark(p.dark); setLight(p.light); }}
                  className={`chip ${dark === p.dark && light === p.light ? "!border-brand-200 !bg-brand-50 !text-brand-500" : ""}`}>
                  <span className="h-3 w-3 rounded-full border border-line" style={{ background: p.dark }} /> {p.l}
                </button>
              ))}
            </div>
            <Slider label="Tamanho" value={size} min={128} max={1024} step={32} unit="px" onChange={setSize} />
            <Slider label="Margem" value={margin} min={0} max={8} onChange={setMargin} />
            <div className="grid grid-cols-2 gap-3 mt-1 mb-3">
              <label className="flex items-center justify-between gap-2">
                <span className="field-label !mb-0">Cor</span>
                <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-8 w-12 rounded-lg bg-transparent border border-line cursor-pointer" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="field-label !mb-0">Fundo</span>
                <input type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-8 w-12 rounded-lg bg-transparent border border-line cursor-pointer" />
              </label>
            </div>
            <div className="field-label">Nível de correção (resistência a dano)</div>
            <Segmented options={[{ value: "L", label: "Baixo" }, { value: "M", label: "Médio" }, { value: "Q", label: "Alto" }, { value: "H", label: "Máx" }]} value={ecc} onChange={setEcc} />

            {/* Logo no centro (opcional) */}
            <div className="mt-5 pt-4 border-t border-line">
              <div className="text-sm font-semibold text-ink mb-2">Logo no centro (opcional)</div>
              {!logoImg ? (
                <label className="btn-ghost w-full cursor-pointer justify-center">
                  Enviar logo
                  <input type="file" accept="image/*" className="hidden" onChange={onLogoFile} />
                </label>
              ) : (
                <button onClick={() => setLogoImg(null)} className="btn-soft w-full text-xs">Remover logo</button>
              )}
              {logoImg && <p className="mt-2 text-[11px] text-subtle">Correção máxima ativada automaticamente pro QR continuar escaneável.</p>}
            </div>
          </Panel>

          <div className="flex gap-2">
            <button onClick={save} className="btn-ghost flex-1"><Save className="h-4 w-4" /> Salvar</button>
            <button onClick={download} className="btn-primary flex-[1.4]"><Download className="h-4 w-4" /> Baixar PNG</button>
          </div>
        </div>
      </div>
    </div>
  );
}
