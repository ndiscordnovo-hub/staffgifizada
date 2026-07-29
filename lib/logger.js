// Global in-memory log bus. Survives client-side route changes (module scope).
// Any part of the app can push lines; the /logs terminal subscribes to them.

let logs = [];
let counter = 0;
const CAP = 400;

export const LEVELS = ["cmd", "info", "success", "warn", "error", "ffmpeg"];

export function logEvent(level, message) {
  if (typeof window === "undefined") return;
  const entry = {
    id: ++counter,
    level: LEVELS.includes(level) ? level : "info",
    message: String(message),
    at: Date.now(),
  };
  logs.push(entry);
  if (logs.length > CAP) logs = logs.slice(-CAP);
  window.dispatchEvent(new CustomEvent("nebula:log", { detail: entry }));
}

export const getLogs = () => logs;

export function clearLogs() {
  logs = [];
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nebula:log:clear"));
}

// Convenience helpers.
export const log = {
  cmd: (m) => logEvent("cmd", m),
  info: (m) => logEvent("info", m),
  success: (m) => logEvent("success", m),
  warn: (m) => logEvent("warn", m),
  error: (m) => logEvent("error", m),
  ffmpeg: (m) => logEvent("ffmpeg", m),
};
