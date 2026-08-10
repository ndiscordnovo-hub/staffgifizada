"use client";
import { useEffect, useState } from "react";
import { Settings, Save, ShieldCheck, Info } from "lucide-react";
import { Panel, Segmented } from "@/components/ui";
import { getSettings, saveSettings, clearHistory } from "@/lib/history";
import { useMedia } from "@/components/MediaContext";

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-line/50 last:border-0">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        {desc && <div className="text-xs text-subtle">{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? "bg-brand-500" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useMedia();
  const [s, setS] = useState(null);
  useEffect(() => { setS(getSettings()); }, []);
  if (!s) return null;
  const patch = (p) => setS((x) => ({ ...x, ...p }));

  const save = () => { saveSettings(s); toast("Configurações salvas", "success"); };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2"><Settings className="h-6 w-6 text-brand-500" /> Configurações</h1>
        <p className="mt-1 text-sm text-subtle">Preferências padrão para novas edições.</p>
      </div>

      <Panel title="Exportação padrão" icon={Save}>
        <div className="field-label">Formato padrão</div>
        <Segmented options={[{ value: "png", label: "PNG" }, { value: "jpeg", label: "JPG" }, { value: "webp", label: "WEBP" }]} value={s.defaultFormat} onChange={(v) => patch({ defaultFormat: v })} />
        <div className="field-label mt-4">Qualidade padrão: <span className="text-muted">{Math.round(s.defaultQuality * 100)}%</span></div>
        <input type="range" className="range" min={10} max={100} value={Math.round(s.defaultQuality * 100)} onChange={(e) => patch({ defaultQuality: +e.target.value / 100 })} />
      </Panel>

      <Panel title="Privacidade & dados" icon={ShieldCheck}>
        <Toggle label="Salvar histórico local" desc="Guarda os últimos arquivos exportados neste navegador." value={s.keepHistory} onChange={(v) => patch({ keepHistory: v })} />
        <Toggle label="Remover metadados" desc="Descarta EXIF/localização ao exportar." value={s.autoStripMeta} onChange={(v) => patch({ autoStripMeta: v })} />
        <button onClick={() => { clearHistory(); toast("Histórico apagado", "info"); }} className="btn-ghost mt-4">Apagar histórico agora</button>
      </Panel>

      <div className="card p-4 flex gap-3">
        <Info className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted">
          Todo o processamento acontece no seu navegador. Nenhuma imagem, GIF ou vídeo é enviado para servidores — por isso é grátis e privado.
        </p>
      </div>

      <button onClick={save} className="btn-primary"><Save className="h-4 w-4" /> Salvar configurações</button>
    </div>
  );
}
