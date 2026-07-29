"use client";
import { useEffect, useRef, useState } from "react";
import { TerminalSquare, Trash2, Copy, ArrowDownToLine, Filter } from "lucide-react";
import { getLogs, clearLogs } from "@/lib/logger";
import { useMedia } from "@/components/MediaContext";

// Color + prefix per log level (terminal look).
const STYLE = {
  cmd:     { cls: "text-white",        tag: "»" },
  info:    { cls: "text-sky-300",      tag: "i" },
  success: { cls: "text-emerald-400",  tag: "✓" },
  warn:    { cls: "text-amber-400",    tag: "!" },
  error:   { cls: "text-red-400",      tag: "✕" },
  ffmpeg:  { cls: "text-white/35",     tag: "·" },
};

const FILTERS = [
  { id: "all", label: "Tudo" },
  { id: "important", label: "Importante" },
  { id: "error", label: "Erros" },
];

function ts(at) {
  const d = new Date(at);
  return d.toLocaleTimeString("pt-BR", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

export default function LogsPage() {
  const { toast } = useMedia();
  const [lines, setLines] = useState([]);
  const [filter, setFilter] = useState("all");
  const [autoscroll, setAutoscroll] = useState(true);
  const endRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setLines([...getLogs()]);
    const onLog = (e) => setLines((prev) => [...prev, e.detail]);
    const onClear = () => setLines([]);
    window.addEventListener("nebula:log", onLog);
    window.addEventListener("nebula:log:clear", onClear);
    return () => {
      window.removeEventListener("nebula:log", onLog);
      window.removeEventListener("nebula:log:clear", onClear);
    };
  }, []);

  useEffect(() => {
    if (autoscroll) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, autoscroll]);

  const visible = lines.filter((l) => {
    if (filter === "all") return true;
    if (filter === "error") return l.level === "error" || l.level === "warn";
    return l.level !== "ffmpeg"; // "important" hides verbose ffmpeg output
  });

  const errorCount = lines.filter((l) => l.level === "error").length;

  const copyAll = async () => {
    const text = visible.map((l) => `[${ts(l.at)}] ${l.level.toUpperCase()} ${l.message}`).join("\n");
    try { await navigator.clipboard.writeText(text); toast("Logs copiados", "success"); }
    catch { toast("Não foi possível copiar", "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TerminalSquare className="h-6 w-6 text-brand-300" /> Logs
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Saída em tempo real do processamento. Se algo der errado, aparece aqui.
            {errorCount > 0 && <span className="ml-2 text-red-400 font-medium">{errorCount} erro(s)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyAll} className="btn-ghost"><Copy className="h-4 w-4" /> Copiar</button>
          <button onClick={() => { clearLogs(); setLines([]); }} className="btn-ghost"><Trash2 className="h-4 w-4" /> Limpar</button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-white/40"><Filter className="h-3.5 w-3.5" /> Filtro:</span>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`chip ${filter === f.id ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}>
            {f.label}
          </button>
        ))}
        <button onClick={() => setAutoscroll((v) => !v)}
          className={`chip ml-auto ${autoscroll ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}>
          <ArrowDownToLine className="h-3.5 w-3.5" /> Auto-rolagem
        </button>
      </div>

      {/* Terminal window */}
      <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-card">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 text-xs text-white/40 font-mono">nebula@studio — console</span>
          <span className="ml-auto text-[11px] text-white/30 font-mono">{visible.length} linha(s)</span>
        </div>
        <div ref={boxRef} className="h-[56vh] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed">
          {visible.length === 0 ? (
            <div className="text-white/30">Sem registros ainda. Edite ou converta um arquivo para ver a saída aqui…</div>
          ) : (
            visible.map((l) => {
              const s = STYLE[l.level] || STYLE.info;
              return (
                <div key={l.id} className="flex gap-2 whitespace-pre-wrap break-words">
                  <span className="shrink-0 text-white/25 select-none">{ts(l.at)}</span>
                  <span className={`shrink-0 select-none ${s.cls}`}>{s.tag}</span>
                  <span className={l.level === "ffmpeg" ? "text-white/40" : "text-white/85"}>{l.message}</span>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>
      </div>

      <p className="text-xs text-white/35">
        Dica: use o filtro <span className="text-white/60">Erros</span> para diagnosticar rapidamente. Os logs ficam só no seu navegador.
      </p>
    </div>
  );
}
