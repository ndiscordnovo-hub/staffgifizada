"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Check, X } from "lucide-react";

const ASPECTS = [
  { id: "free", label: "Livre", ratio: null },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "5:2", label: "Banner 5:2", ratio: 5 / 2 },
  { id: "9:16", label: "9:16", ratio: 9 / 16 },
];

const MAX_W = 680;
const MAX_H = 460;

export default function CropOverlay({ img, initialCrop, onApply, onCancel }) {
  const nW = img.naturalWidth;
  const nH = img.naturalHeight;
  const scale = Math.min(MAX_W / nW, MAX_H / nH, 1);
  const dispW = nW * scale;
  const dispH = nH * scale;

  const [aspect, setAspect] = useState(null);
  const toDisp = useCallback((c) => ({ x: c.x * scale, y: c.y * scale, w: c.w * scale, h: c.h * scale }), [scale]);

  const [box, setBox] = useState(() =>
    initialCrop ? toDisp(initialCrop) : { x: dispW * 0.1, y: dispH * 0.1, w: dispW * 0.8, h: dispH * 0.8 }
  );
  const drag = useRef(null);

  const clampBox = useCallback((b) => {
    let { x, y, w, h } = b;
    w = Math.max(20, w);
    h = Math.max(20, h);
    x = Math.max(0, Math.min(x, dispW - w));
    y = Math.max(0, Math.min(y, dispH - h));
    if (x + w > dispW) w = dispW - x;
    if (y + h > dispH) h = dispH - y;
    return { x, y, w, h };
  }, [dispW, dispH]);

  const onPointerDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { mode, startX: e.clientX, startY: e.clientY, box: { ...box } };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = useCallback((e) => {
    if (!drag.current) return;
    const { mode, startX, startY, box: b0 } = drag.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let nb = { ...b0 };
    if (mode === "move") {
      nb.x = b0.x + dx;
      nb.y = b0.y + dy;
    } else {
      // corner resize: mode is one of nw, ne, sw, se
      if (mode.includes("e")) nb.w = b0.w + dx;
      if (mode.includes("s")) nb.h = b0.h + dy;
      if (mode.includes("w")) { nb.x = b0.x + dx; nb.w = b0.w - dx; }
      if (mode.includes("n")) { nb.y = b0.y + dy; nb.h = b0.h - dy; }
      if (aspect) {
        // keep ratio driven by width
        nb.h = nb.w / aspect;
        if (mode.includes("n")) nb.y = b0.y + b0.h - nb.h;
      }
    }
    setBox(clampBox(nb));
  }, [aspect, clampBox]);

  const onPointerUp = useCallback(() => {
    drag.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  useEffect(() => () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove, onPointerUp]);

  const applyAspect = (r) => {
    setAspect(r);
    if (r) {
      let w = box.w;
      let h = w / r;
      if (h > dispH) { h = dispH; w = h * r; }
      setBox(clampBox({ ...box, w, h }));
    }
  };

  const handleApply = () => {
    onApply({
      x: Math.round(box.x / scale),
      y: Math.round(box.y / scale),
      w: Math.round(box.w / scale),
      h: Math.round(box.h / scale),
    });
  };

  const handles = ["nw", "ne", "sw", "se"];
  const hpos = {
    nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
    ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
    sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
    se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {ASPECTS.map((a) => (
          <button
            key={a.id}
            onClick={() => applyAspect(a.ratio)}
            className={`chip ${aspect === a.ratio ? "!border-brand-400/60 !bg-brand-500/20 !text-white" : ""}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="relative select-none touch-none" style={{ width: dispW, height: dispH }}>
        <img src={img.src} alt="" className="absolute inset-0 h-full w-full rounded-lg" draggable={false} />
        {/* Crop box with darkened surroundings via huge shadow */}
        <div
          onPointerDown={(e) => onPointerDown(e, "move")}
          className="absolute cursor-move border border-brand-300/90"
          style={{
            left: box.x, top: box.y, width: box.w, height: box.h,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        >
          {/* rule-of-thirds guides */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-white/25" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-white/25" />
            <div className="absolute top-1/3 left-0 w-full h-px bg-white/25" />
            <div className="absolute top-2/3 left-0 w-full h-px bg-white/25" />
          </div>
          {handles.map((h) => (
            <div
              key={h}
              onPointerDown={(e) => onPointerDown(e, h)}
              className={`absolute h-3.5 w-3.5 rounded-full bg-brand-300 border-2 border-ink-900 ${hpos[h]}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="btn-ghost"><X className="h-4 w-4" /> Cancelar</button>
        <button onClick={handleApply} className="btn-primary"><Check className="h-4 w-4" /> Aplicar corte</button>
      </div>
    </div>
  );
}
