"use client";
import { useEffect, useRef, useState } from "react";
import { QrCode, Download, Save } from "lucide-react";
import { Panel, Slider, Segmented, Stat } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";
import { downloadBlob, DISCORD_INVITE } from "@/lib/utils";
import { saveMedia } from "@/lib/storage";

export default function QrCodePage() {
  const { toast } = useMedia();
  const canvasRef = useRef(null);
  const [text, setText] = useState(DISCORD_INVITE);
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [dark, setDark] = useState("#000000");
  const [light, setLight] = useState("#ffffff");
  const [ecc, setEcc] = useState("M");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!canvasRef.current) return;
      const QRCode = (await import("qrcode")).default;
      try {
        await QRCode.toCanvas(canvasRef.current, text || " ", {
          width: size, margin, errorCorrectionLevel: ecc,
          color: { dark, light },
        });
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [text, size, margin, dark, light, ecc]);

  const getBlob = () => new Promise((res) => canvasRef.current.toBlob(res, "image/png"));

  const download = async () => {
    const blob = await getBlob();
    downloadBlob(blob, "qrcode-gifedition.png");
    toast("QR Code baixado!", "success");
  };
  const save = async () => {
    const blob = await getBlob();
    await saveMedia({ name: "qrcode.png", kind: "image", type: "image/png", blob, w: size, h: size });
    toast("Salvo na biblioteca!", "success");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><QrCode className="h-6 w-6 text-brand-300" /> Gerador de QR Code</h1>
        <p className="mt-1 text-sm text-white/45">Crie um QR Code do convite do servidor ou de qualquer link. Baixe e divulgue.</p>
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
            <Slider label="Tamanho" value={size} min={128} max={1024} step={32} unit="px" onChange={setSize} />
            <Slider label="Margem" value={margin} min={0} max={8} onChange={setMargin} />
            <div className="grid grid-cols-2 gap-3 mt-1 mb-3">
              <label className="flex items-center justify-between gap-2">
                <span className="field-label !mb-0">Cor</span>
                <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-8 w-12 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="field-label !mb-0">Fundo</span>
                <input type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-8 w-12 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
              </label>
            </div>
            <div className="field-label">Nível de correção (resistência a dano)</div>
            <Segmented options={[{ value: "L", label: "Baixo" }, { value: "M", label: "Médio" }, { value: "Q", label: "Alto" }, { value: "H", label: "Máx" }]} value={ecc} onChange={setEcc} />
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
