// Shared helpers used across editors.

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes < 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function baseName(name = "arquivo") {
  return name.replace(/\.[^/.]+$/, "");
}

export function extFromType(mime) {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return map[mime] || "png";
}

// Discord + social presets (width x height in px).
export const SIZE_PRESETS = [
  { id: "discord-avatar", label: "Avatar / Ícone Discord", w: 512, h: 512, group: "Discord" },
  { id: "discord-banner", label: "Banner Discord", w: 600, h: 240, group: "Discord" },
  { id: "discord-profile", label: "Banner Perfil Discord", w: 680, h: 240, group: "Discord" },
  { id: "instagram", label: "Instagram Post", w: 1080, h: 1080, group: "Social" },
  { id: "story-vertical", label: "Story / Reels / TikTok", w: 1080, h: 1920, group: "Social" },
  { id: "youtube", label: "YouTube Thumb", w: 1280, h: 720, group: "Social" },
  { id: "facebook", label: "Facebook Capa", w: 820, h: 312, group: "Social" },
  { id: "twitter", label: "Twitter/X Header", w: 1500, h: 500, group: "Social" },
];

// Discord upload budgets (bytes).
export const DISCORD_LIMITS = [
  { id: "discord-8", label: "Discord 8MB", bytes: 8 * 1024 * 1024 },
  { id: "discord-10", label: "Discord 10MB", bytes: 10 * 1024 * 1024 },
  { id: "discord-25", label: "Discord 25MB", bytes: 25 * 1024 * 1024 },
  { id: "discord-nitro", label: "Discord Nitro (500MB)", bytes: 500 * 1024 * 1024 },
];

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// >>> TROQUE pelo convite real do seu servidor do Discord (ex.: https://discord.gg/abc123)
export const DISCORD_INVITE = "https://discord.gg/gifs";
export const SITE_NAME = "Gif Edition";
export const SITE_VERSION = "1.2.0";
