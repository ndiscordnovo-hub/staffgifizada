// Background removal — two flavors, both 100% client-side.
"use client";

// 1) AI removal via @imgly/background-removal (AGPL). Downloads a model
//    (~40 MB) from staticimgly.com on first use, then runs in the browser.
export async function removeBgAI(input, onProgress) {
  const { removeBackground } = await import("@imgly/background-removal");
  const blob = await removeBackground(input, {
    output: { format: "image/png" },
    progress: (key, current, total) => {
      if (onProgress && total) onProgress(Math.min(100, Math.round((current / total) * 100)), key);
    },
  });
  return blob; // PNG with transparent background
}

// 2) Color-key removal — makes pixels near `hexColor` transparent. Great for
//    solid/near-solid backgrounds (logos, avatars). No model, instant.
export async function removeBgByColor(img, hexColor, tolerance = 60) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;

  const tr = parseInt(hexColor.slice(1, 3), 16);
  const tg = parseInt(hexColor.slice(3, 5), 16);
  const tb = parseInt(hexColor.slice(5, 7), 16);
  const hard = tolerance;
  const soft = tolerance * 1.6; // feather zone for smoother edges

  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.sqrt(
      (d[i] - tr) ** 2 + (d[i + 1] - tg) ** 2 + (d[i + 2] - tb) ** 2
    );
    if (dist <= hard) {
      d[i + 3] = 0; // fully transparent
    } else if (dist < soft) {
      // partial transparency near the edge
      d[i + 3] = Math.round(d[i + 3] * ((dist - hard) / (soft - hard)));
    }
  }
  ctx.putImageData(image, 0, 0);
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}

// Sample the average color of the image corners (best guess for background).
export function guessBackgroundColor(img) {
  const canvas = document.createElement("canvas");
  const s = 8;
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, s, s);
  const d = ctx.getImageData(0, 0, s, s).data;
  // average the 4 corner pixels
  const idx = [0, (s - 1) * 4, (s * (s - 1)) * 4, (s * s - 1) * 4];
  let r = 0, g = 0, b = 0;
  idx.forEach((k) => { r += d[k]; g += d[k + 1]; b += d[k + 2]; });
  r = Math.round(r / 4); g = Math.round(g / 4); b = Math.round(b / 4);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
