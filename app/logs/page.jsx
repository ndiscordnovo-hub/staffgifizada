"use client";
import { useEffect, useRef, useState } from "react";
import { TerminalSquare, Trash2, Copy, ArrowDownToLine, Filter } from "lucide-react";
import { getLogs, clearLogs } from "@/lib/logger";
import { useMedia } from "@/components/MediaContext";

// Color + badge per log level (terminal look).
const STYLE = {
  cmd:     { text: "text-white",        badge: "bg-white/10 text-white/80 border-white/15",       label: "CMD" },
  info:    { text: "text-sky-300",      badge: "bg-sky-500/15 text-sky-300 border-sky-400/25",    label: "INFO" },
  success: { text: "text-emerald-300",  badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25", label: "OK" },
  warn:    { text: "text-amber-300",    badge: "bg-amber-500/15 text-amber-300 border-amber-400/25", label: "WARN" },
  error:   { text: "text-red-300",      badge: "bg-red-500/20 text-red-300 border-red-400/30",    label: "ERR" },
  ffmpeg:  { text: "text-white/40",     badge: "bg-white/[0.06] text-white/40 border-white/10",   label: "FFMPEG" },
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
      <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-card ring-1 ring-brand-500/10">
        {/* Title bar */}
        <div className="relative z-10 flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 text-xs font-mono">
            <span className="text-emerald-400">gifedition</span><span className="text-white/40">@studio</span><span className="text-white/25">:~$</span>
          </span>
          <span className="ml-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
          </span>
          <span className="ml-auto flex items-center gap-2 text-[11px] font-mono">
            {errorCount > 0 && <span className="rounded bg-red-500/20 border border-red-400/30 px-1.5 py-0.5 text-red-300">{errorCount} err</span>}
            <span className="text-white/30">{visible.length} ln</span>
          </span>
        </div>

        {/* Console body */}
        <div ref={boxRef} className="term-bg term-scanlines relative h-[56vh] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed">
          <div className="relative z-[2]">
            {visible.length === 0 ? (
              <div className="text-white/30">Aguardando eventos… edite ou converta um arquivo para ver a saída aqui.</div>
            ) : (
              visible.map((l, i) => {
                const s = STYLE[l.level] || STYLE.info;
                return (
                  <div key={l.id} className="group flex items-start gap-2.5 rounded px-1 -mx-1 hover:bg-white/[0.035] transition-colors whitespace-pre-wrap break-words">
                    <span className="shrink-0 w-8 text-right text-white/20 select-none tabular-nums">{i + 1}</span>
                    <span className="shrink-0 text-white/25 select-none tabular-nums">{ts(l.at)}</span>
                    <span className={`shrink-0 select-none rounded border px-1.5 text-[10px] leading-5 font-semibold ${s.badge}`}>{s.label}</span>
                    <span className={s.text}>{l.message}</span>
                  </div>
                );
              })
            )}
            {/* Blinking prompt */}
            <div className="flex items-center gap-2 px-1 -mx-1 mt-1 select-none">
              <span className="w-8" />
              <span className="text-emerald-400">gifedition@studio</span>
              <span className="text-white/25">:~$</span>
              <span className="term-cursor text-brand-300">▊</span>
            </div>
            <div ref={endRef} />
          </div>
        </div>
      </div>

      <p className="text-xs text-white/35">
        Dica: use o filtro <span className="text-white/60">Erros</span> para diagnosticar rapidamente. Os logs ficam só no seu navegador.
      </p>
    </div>
  );
}
