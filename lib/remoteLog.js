// Client helper that ships events to the /api/log backend (fire-and-forget).
"use client";

export function deviceInfo() {
  if (typeof navigator === "undefined") return { device: "?", browser: "?", os: "?", ua: "" };
  const ua = navigator.userAgent;
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = !isTablet && /Mobi|iPhone|Android|iPod|Windows Phone/i.test(ua);
  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  let browser = "Outro";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "Outro";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { device, browser, os, ua };
}

// category: access | upload | process | error | security | admin | suggestion | update
export function sendRemoteLog(category, { title, description, fields } = {}) {
  try {
    const payload = JSON.stringify({ category, title, description, fields });
    // sendBeacon survives page unloads; fall back to fetch.
    if (navigator.sendBeacon && payload.length < 60000) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/log", blob)) return;
    }
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* logging must never break the app */
  }
}

// Fires an "access" event once per browser session (per tab load).
export function logAccess() {
  const { device, browser, os } = deviceInfo();
  const firstEver = !localStorage.getItem("gifedition.visited");
  if (firstEver) localStorage.setItem("gifedition.visited", "1");
  sendRemoteLog("access", {
    title: firstEver ? "🆕 Primeiro acesso" : "👤 Novo visitante",
    fields: [
      { name: "Dispositivo", value: device, inline: true },
      { name: "Navegador", value: browser, inline: true },
      { name: "Sistema", value: os, inline: true },
    ],
  });
}
