"use client";
import { useEffect, useState } from "react";
import { Check, X, ChevronRight, Loader2 } from "lucide-react";

const STAGE_META = {
  waiting:    { label: "Aguardando" },
  loading:    { label: "Carregando" },
  processing: { label: "Processando" },
  optimizing: { label: "Otimizando" },
  generating: { label: "Gerando" },
  done:       { label: "Concluído" },
  error:      { label: "Erro" },
};

const ACTIVE = new Set(["processing", "loading", "optimizing", "generating"]);

export default function ProcessingOverlay({ open, progress, title = "Processando…", stages, result, onClose }) {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    } else {
      setShow(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  const pct = typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : null;
  const hasStages = stages && stages.length > 0;
  const showResult = result != null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 transition-opacity duration-300"
      style={{ opacity: show ? 1 : 0, pointerEvents: show ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: "rgba(0,0,0,0.95)",
          backdropFilter: show ? "blur(20px)" : "blur(0px)",
        }}
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[360px] transition-all duration-300"
        style={{
          transform: show ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          opacity: show ? 1 : 0,
        }}
      >
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: showResult
                ? "conic-gradient(from var(--border-angle, 0deg), rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.4) 25%, rgba(16,185,129,0.15) 50%, rgba(16,185,129,0.4) 75%)"
                : "conic-gradient(from var(--border-angle, 0deg), transparent 30%, rgba(230,57,70,0.5) 50%, rgba(255,107,129,0.3) 55%, transparent 70%)",
              animation: "overlayBorderSpin 3s linear infinite",
            }}
          />
          <div className="absolute inset-[1px] rounded-[15px]" style={{ background: "#0d0f16" }} />
        </div>

        {/* Inner card content */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "#0d0f16",
            boxShadow: showResult
              ? "0 0 80px rgba(16,185,129,0.08), 0 25px 60px rgba(0,0,0,0.5)"
              : "0 0 80px rgba(230,57,70,0.06), 0 25px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* X close */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-7 w-7 rounded-lg flex items-center justify-center z-10 hover:bg-white/10 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5 text-white/30" />
            </button>
          )}

          {showResult ? (
            /* ───── RESULT VIEW ───── */
            <div className="p-7">
              {/* Success icon */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div
                    className="h-[72px] w-[72px] rounded-full flex items-center justify-center animate-[overlayScaleIn_0.4s_ease-out]"
                    style={{
                      background: "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
                      border: "2px solid rgba(16,185,129,0.2)",
                      boxShadow: "0 0 40px rgba(16,185,129,0.15)",
                    }}
                  >
                    <Check className="h-8 w-8 text-emerald-400 animate-[overlayScaleIn_0.3s_ease-out_0.15s_both]" strokeWidth={2.5} />
                  </div>
                  <div
                    className="absolute inset-0 rounded-full animate-[overlayRipple_0.8s_ease-out_0.2s_both]"
                    style={{ border: "2px solid rgba(16,185,129,0.15)" }}
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-[15px] font-semibold text-white text-center mb-5 animate-[overlayFadeUp_0.3s_ease-out_0.15s_both]">
                {result.title || "Concluído!"}
              </h3>

              {/* Stats */}
              {result.items?.length > 0 && (
                <div className="space-y-2">
                  {result.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 px-4 rounded-xl animate-[overlaySlideIn_0.3s_ease-out_both]"
                      style={{
                        animationDelay: `${0.2 + i * 0.06}s`,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span className="text-[12px] text-white/35 uppercase tracking-wide">{item.label}</span>
                      <span className={`text-[13px] font-semibold ${item.accent || "text-white/90"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="mt-6 w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] animate-[overlayFadeUp_0.3s_ease-out_0.4s_both]"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.2)",
                }}
              >
                Fechar
              </button>
            </div>
          ) : (
            /* ───── PROCESSING VIEW ───── */
            <div className="p-7">
              {/* Title */}
              <h3 className="text-[15px] font-semibold text-white text-center mb-5">{title}</h3>

              {/* Stages */}
              {hasStages ? (
                <div>
                  {stages.map((s, i) => {
                    const isActive = ACTIVE.has(s.status);
                    const isDone = s.status === "done";
                    const isError = s.status === "error";
                    const isWaiting = s.status === "waiting";

                    return (
                      <div key={s.id || i}>
                        {i > 0 && (
                          <div className="ml-[22px] w-[1px] h-2 transition-colors duration-300"
                            style={{ background: isDone || isActive ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)" }}
                          />
                        )}

                        <div
                          className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-300"
                          style={{
                            background: isActive ? "rgba(230,57,70,0.06)" : "transparent",
                            border: isActive ? "1px solid rgba(230,57,70,0.12)" : "1px solid transparent",
                            animation: `overlaySlideIn 0.25s ease-out ${i * 0.05}s both`,
                          }}
                        >
                          <div className="relative flex items-center justify-center h-7 w-7 shrink-0">
                            {isDone && (
                              <div
                                className="h-7 w-7 rounded-full flex items-center justify-center animate-[overlayScaleIn_0.25s_ease-out]"
                                style={{ background: "rgba(16,185,129,0.15)", border: "1.5px solid rgba(16,185,129,0.4)" }}
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                              </div>
                            )}
                            {isError && (
                              <div className="h-7 w-7 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.4)" }}>
                                <X className="h-3.5 w-3.5 text-red-400" strokeWidth={3} />
                              </div>
                            )}
                            {isActive && (
                              <div className="relative h-7 w-7 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(230,57,70,0.1)", border: "1.5px solid rgba(230,57,70,0.3)" }}>
                                <div className="absolute inset-0 rounded-full animate-ping"
                                  style={{ border: "1.5px solid rgba(230,57,70,0.2)", animationDuration: "1.5s" }} />
                                <div className="h-2 w-2 rounded-full bg-[#e63946] animate-pulse" />
                              </div>
                            )}
                            {isWaiting && (
                              <div className="h-7 w-7 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1.5px solid rgba(255,255,255,0.06)" }}>
                                <div className="h-1.5 w-1.5 rounded-full bg-white/15" />
                              </div>
                            )}
                          </div>

                          <span className={`text-[13px] font-medium flex-1 transition-colors duration-300 ${
                            isActive ? "text-white" :
                            isDone ? "text-emerald-400/70" :
                            isError ? "text-red-400/70" :
                            "text-white/20"
                          }`}>
                            {s.label}
                          </span>

                          {s.detail && (
                            <span className="text-[11px] text-white/30 tabular-nums font-mono">{s.detail}</span>
                          )}
                          {isActive && (
                            <ChevronRight className="h-3.5 w-3.5 text-[#e63946]/50 animate-[overlayBounceX_0.8s_ease-in-out_infinite]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 text-[#e63946] animate-spin" />
                  {pct != null && (
                    <div className="w-full">
                      <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: "#1a1d2e" }}>
                        <div
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #e63946, #ff6b81)" }}
                        />
                      </div>
                      <p className="text-[11px] text-white/40 text-center mt-2 tabular-nums font-mono">{Math.round(pct)}%</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @property --border-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes overlayBorderSpin {
          to { --border-angle: 360deg; }
        }
        @keyframes overlayScaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes overlayFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes overlaySlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes overlayRipple {
          from { transform: scale(1); opacity: 0.5; }
          to { transform: scale(1.6); opacity: 0; }
        }
        @keyframes overlayShimmer {
          from { background-position: 0% 0%; }
          to { background-position: 200% 0%; }
        }
        @keyframes overlayBounceX {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}

export { STAGE_META };
