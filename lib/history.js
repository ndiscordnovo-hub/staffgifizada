// LocalStorage-backed history + favorites (client only).
const KEY = "nebula.history";
const FAV = "nebula.favorites";
const SETTINGS = "nebula.settings";

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded – ignore */
  }
}

export function getHistory() {
  return read(KEY, []);
}

export function addHistory(entry) {
  const list = getHistory();
  list.unshift({ ...entry, at: Date.now() });
  write(KEY, list.slice(0, 40)); // cap
  window.dispatchEvent(new Event("nebula:history"));
}

export function clearHistory() {
  write(KEY, []);
  window.dispatchEvent(new Event("nebula:history"));
}

export function getFavorites() {
  return read(FAV, []);
}
export function toggleFavorite(entry) {
  const list = getFavorites();
  const i = list.findIndex((f) => f.id === entry.id);
  if (i >= 0) list.splice(i, 1);
  else list.unshift(entry);
  write(FAV, list.slice(0, 40));
  window.dispatchEvent(new Event("nebula:history"));
  return i < 0;
}

export function getSettings() {
  return read(SETTINGS, {
    defaultFormat: "png",
    defaultQuality: 0.92,
    theme: "dark",
    keepHistory: true,
    autoStripMeta: true,
  });
}
export function saveSettings(s) {
  write(SETTINGS, s);
  window.dispatchEvent(new Event("nebula:settings"));
}
