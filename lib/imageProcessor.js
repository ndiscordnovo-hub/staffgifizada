// Canvas-based image rendering pipeline. Pure functions, no React.
// A single render() call is used for both live preview and final export,
// so what you see is exactly what you download.

export const DEFAULT_EDITS = {
  rotate: 0, // 0 | 90 | 180 | 270
  flipH: false,
  flipV: false,
  brightness: 100, // %
  contrast: 100, // %
  saturation: 100, // %
  blur: 0, // px
  sharpen: 0, // 0..100
  grayscale: 0, // 0..100 (%) — preto e branco
  background: "none", // none | white | black | transparent | blur
  crop: null, // { x, y, w, h } in source pixels, or null
  resizeW: null, // target px or null (auto from source/crop)
  resizeH: null,
  format: "png", // png | jpeg | webp
  quality: 0.92, // 0..1 (jpeg/webp)
  // Text / watermark overlay
  textContent: "",
  textSize: 6, // % of output width
  textColor: "#ffffff",
  textOpacity: 90, // %
  textPos: "br", // tl tc tr ml mc mr bl bc br
  textBold: true,
  textShadow: true,
};

// Load a File/Blob/URL into an HTMLImageElement.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
}

// The dimensions of the "source" after cropping (before rotation/resize).
function sourceRect(img, edits) {
  const c = edits.crop;
  if (c) return { sx: c.x, sy: c.y, sw: c.w, sh: c.h };
  return { sx: 0, sy: 0, sw: img.naturalWidth, sh: img.naturalHeight };
}

// Final output width/height, accounting for rotation + resize.
export function outputSize(img, edits) {
  const { sw, sh } = sourceRect(img, edits);
  const rotated = edits.rotate === 90 || edits.rotate === 270;
  const baseW = rotated ? sh : sw;
  const baseH = rotated ? sw : sh;
  let w = edits.resizeW || baseW;
  let h = edits.resizeH || baseH;
  return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
}

// Simple unsharp-mask sharpening via 3x3 convolution.
function applySharpen(ctx, w, h, amount) {
  if (amount <= 0) return;
  const k = amount / 100; // strength
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  const s = src.data;
  const d = dst.data;
  const center = 1 + 4 * k;
  const side = -k;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const idx = i + c;
        let val = s[idx] * center;
        val += (x > 0 ? s[idx - 4] : s[idx]) * side;
        val += (x < w - 1 ? s[idx + 4] : s[idx]) * side;
        val += (y > 0 ? s[idx - w * 4] : s[idx]) * side;
        val += (y < h - 1 ? s[idx + w * 4] : s[idx]) * side;
        d[idx] = val < 0 ? 0 : val > 255 ? 255 : val;
      }
      d[i + 3] = s[i + 3];
    }
  }
  ctx.putImageData(dst, 0, 0);
}

// Render edits onto a target canvas. Returns { w, h }.
export function render(img, edits, canvas) {
  const e = { ...DEFAULT_EDITS, ...edits };
  const { sx, sy, sw, sh } = sourceRect(img, e);
  const { w, h } = outputSize(img, e);

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Background fill.
  if (e.background === "white") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  } else if (e.background === "black") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
  } else if (e.background === "blur") {
    // Cover the frame with a heavily blurred copy of the image.
    ctx.save();
    ctx.filter = "blur(24px) brightness(0.7)";
    const scale = Math.max(w / sw, h / sh) * 1.15;
    const bw = sw * scale;
    const bh = sh * scale;
    ctx.drawImage(img, sx, sy, sw, sh, (w - bw) / 2, (h - bh) / 2, bw, bh);
    ctx.restore();
  }
  // "transparent" / "none" => leave as-is (PNG/WEBP preserve alpha).

  // Main image with color filters + transforms.
  ctx.save();
  const filters = [
    `brightness(${e.brightness}%)`,
    `contrast(${e.contrast}%)`,
    `saturate(${e.saturation}%)`,
  ];
  if (e.blur > 0) filters.push(`blur(${e.blur}px)`);
  if (e.grayscale > 0) filters.push(`grayscale(${e.grayscale}%)`);
  ctx.filter = filters.join(" ");

  ctx.translate(w / 2, h / 2);
  ctx.rotate((e.rotate * Math.PI) / 180);
  ctx.scale(e.flipH ? -1 : 1, e.flipV ? -1 : 1);

  const rotated = e.rotate === 90 || e.rotate === 270;
  const drawW = rotated ? h : w;
  const drawH = rotated ? w : h;
  ctx.drawImage(img, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  applySharpen(ctx, w, h, e.sharpen);
  drawText(ctx, w, h, e);
  return { w, h };
}

// Draw the text / watermark overlay at the chosen anchor position.
function drawText(ctx, w, h, e) {
  const content = (e.textContent || "").trim();
  if (!content) return;
  const fontSize = Math.max(8, (e.textSize / 100) * w);
  const pad = fontSize * 0.5;
  ctx.save();
  ctx.font = `${e.textBold ? "bold " : ""}${fontSize}px Inter, system-ui, Arial, sans-serif`;
  ctx.globalAlpha = Math.min(1, Math.max(0, e.textOpacity / 100));
  ctx.fillStyle = e.textColor;
  if (e.textShadow) {
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = fontSize * 0.22;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = fontSize * 0.06;
  }
  const pos = e.textPos || "br";
  const vert = pos[0]; // t | m | b
  const horiz = pos[1]; // l | c | r
  let x, y;
  if (horiz === "l") { ctx.textAlign = "left"; x = pad; }
  else if (horiz === "c") { ctx.textAlign = "center"; x = w / 2; }
  else { ctx.textAlign = "right"; x = w - pad; }
  if (vert === "t") { ctx.textBaseline = "top"; y = pad; }
  else if (vert === "m") { ctx.textBaseline = "middle"; y = h / 2; }
  else { ctx.textBaseline = "alphabetic"; y = h - pad; }
  ctx.fillText(content, x, y);
  ctx.restore();
}

// Export the current edits to a Blob.
export function toBlob(img, edits, canvas) {
  const e = { ...DEFAULT_EDITS, ...edits };
  render(img, e, canvas);
  const mime =
    e.format === "jpeg" ? "image/jpeg" : e.format === "webp" ? "image/webp" : "image/png";
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, e.format === "png" ? undefined : e.quality);
  });
}

// Binary-search quality to hit a target byte budget (for smart optimize).
export async function compressToTarget(img, edits, canvas, targetBytes) {
  const e = { ...DEFAULT_EDITS, ...edits };
  // PNG can't trade quality; fall back to webp for budget hunting.
  const fmt = e.format === "png" ? "webp" : e.format;
  let lo = 0.1, hi = 0.98, best = null, bestBlob = null;
  for (let i = 0; i < 8; i++) {
    const q = (lo + hi) / 2;
    render(img, { ...e, format: fmt, quality: q }, canvas);
    const mime = fmt === "jpeg" ? "image/jpeg" : "image/webp";
    // eslint-disable-next-line no-await-in-loop
    const blob = await new Promise((r) => canvas.toBlob(r, mime, q));
    if (!blob) break;
    if (blob.size <= targetBytes) {
      best = q;
      bestBlob = blob;
      lo = q; // try higher quality
    } else {
      hi = q; // need smaller
    }
  }
  if (!bestBlob) {
    render(img, { ...e, format: fmt, quality: lo }, canvas);
    const mime = fmt === "jpeg" ? "image/jpeg" : "image/webp";
    bestBlob = await new Promise((r) => canvas.toBlob(r, mime, lo));
    best = lo;
  }
  return { blob: bestBlob, quality: best, format: fmt };
}
