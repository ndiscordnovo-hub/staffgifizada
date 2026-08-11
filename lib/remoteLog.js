"use client";

export function deviceInfo() {
  if (typeof navigator === "undefined") return { device: "?", browser: "?", os: "?", ua: "", screen: "?", lang: "?" };
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

  const screen = `${window.screen?.width || "?"}x${window.screen?.height || "?"}`;
  const lang = navigator.language || "?";

  return { device, browser, os, ua, screen, lang };
}

function getPage() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function getSessionId() {
  if (typeof sessionStorage === "undefined") return null;
  let id = sessionStorage.getItem("gifedition.sid");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem("gifedition.sid", id);
  }
  return id;
}

export function sendRemoteLog(category, { title, description, fields } = {}) {
  try {
    const { device, browser, os, screen, lang } = deviceInfo();
    const payload = JSON.stringify({
      category,
      title,
      description,
      fields,
      context: {
        page: getPage(),
        device,
        browser,
        os,
        screen,
        lang,
        session: getSessionId(),
        referrer: document.referrer || null,
      },
    });
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

export function logAccess() {
  const { device, browser, os, screen, lang } = deviceInfo();
  const visits = parseInt(localStorage.getItem("gifedition.visits") || "0", 10) + 1;
  localStorage.setItem("gifedition.visits", String(visits));
  const firstEver = visits === 1;
  sendRemoteLog("access", {
    title: firstEver ? "🆕 Primeiro acesso" : "👤 Visitante retornou",
    fields: [
      { name: "Dispositivo", value: `${device}`, inline: true },
      { name: "Navegador", value: browser, inline: true },
      { name: "Sistema", value: os, inline: true },
      { name: "Tela", value: screen, inline: true },
      { name: "Idioma", value: lang, inline: true },
      { name: "Visitas", value: String(visits), inline: true },
    ],
  });
}
