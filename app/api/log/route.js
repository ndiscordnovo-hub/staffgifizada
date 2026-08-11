export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = {
  access:     { env: "WEBHOOK_ACCESS",     color: 0x5865f2, emoji: "👤", name: "Acesso" },
  upload:     { env: "WEBHOOK_UPLOAD",     color: 0x3498db, emoji: "📦", name: "Upload" },
  process:    { env: "WEBHOOK_PROCESS",    color: 0x2ecc71, emoji: "⚙️", name: "Processamento" },
  error:      { env: "WEBHOOK_ERROR",      color: 0xe74c3c, emoji: "🚨", name: "Erro" },
  security:   { env: "WEBHOOK_SECURITY",   color: 0xe67e22, emoji: "🛡️", name: "Segurança" },
  admin:      { env: "WEBHOOK_ADMIN",      color: 0x9b59b6, emoji: "👑", name: "Admin" },
  suggestion: { env: "WEBHOOK_SUGGESTION", color: 0xf1c40f, emoji: "💡", name: "Sugestão" },
  update:     { env: "WEBHOOK_UPDATE",     color: 0x1abc9c, emoji: "🔄", name: "Atualização" },
};

function webhookFor(category) {
  const c = CATEGORIES[category];
  return (c && process.env[c.env]) || process.env.WEBHOOK_DEFAULT || null;
}

const HITS = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const flagged = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}

async function sendToDiscord(url, embed) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Gif Edition",
      avatar_url: "https://gifediton.com.br/favicon.ico",
      embeds: [embed],
    }),
  });
}

function deviceEmoji(device) {
  if (device === "Mobile") return "📱";
  if (device === "Tablet") return "📲";
  return "🖥️";
}

function browserEmoji(browser) {
  if (browser === "Chrome") return "<:chrome:🌐>";
  if (browser === "Firefox") return "🦊";
  if (browser === "Safari") return "🧭";
  if (browser === "Edge") return "🌊";
  return "🌐";
}

export async function POST(request) {
  const origin = request.headers.get("origin") || "";
  const host = request.headers.get("host") || "";
  if (origin && !origin.includes(host.split(":")[0])) {
    return Response.json({ ok: false, reason: "origin_mismatch" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }

  const category = String(body.category || "access");
  const cat = CATEGORIES[category] || CATEGORIES.access;
  const h = request.headers;
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "desconhecido";

  const country = h.get("cf-ipcountry") || h.get("x-country") || null;
  const region = h.get("x-region") || null;
  const city = h.get("x-city") ? decodeURIComponent(h.get("x-city")) : null;
  const geo = [city, region, country].filter(Boolean).join(", ") || null;

  if (rateLimited(ip)) {
    const secUrl = process.env.WEBHOOK_SECURITY || process.env.WEBHOOK_DEFAULT;
    const last = flagged.get(ip) || 0;
    if (secUrl && Date.now() - last > WINDOW_MS) {
      flagged.set(ip, Date.now());
      sendToDiscord(secUrl, {
        title: "🚨 Rate Limit Atingido",
        description: `Mais de ${MAX_PER_WINDOW} requisições em 1 minuto.`,
        color: 0xe67e22,
        fields: [
          { name: "🌍 Origem", value: geo || "Desconhecido", inline: true },
          { name: "🔒 IP", value: "||" + ip + "||", inline: true },
        ],
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }
    return Response.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  const url = webhookFor(category);
  if (!url) return Response.json({ ok: false, reason: "not_configured" }, { status: 200 });

  const ctx = body.context || {};

  const fields = Array.isArray(body.fields)
    ? body.fields.slice(0, 20).map((f) => ({
        name: String(f.name || "-").slice(0, 256),
        value: String(f.value ?? "-").slice(0, 1024) || "-",
        inline: !!f.inline,
      }))
    : [];

  if (geo) fields.push({ name: "🌍 Localização", value: geo, inline: true });
  if (ctx.page && ctx.page !== "/") fields.push({ name: "📄 Página", value: ctx.page, inline: true });
  if (ctx.session) fields.push({ name: "🔑 Sessão", value: `\`${ctx.session}\``, inline: true });

  const deviceLine = [
    ctx.device ? `${deviceEmoji(ctx.device)} ${ctx.device}` : null,
    ctx.browser || null,
    ctx.os || null,
  ].filter(Boolean).join(" · ");

  const extraLine = [
    ctx.screen ? `🖥️ ${ctx.screen}` : null,
    ctx.lang ? `🗣️ ${ctx.lang}` : null,
  ].filter(Boolean).join(" · ");

  let description = body.description ? String(body.description).slice(0, 3000) : "";
  if (deviceLine) description += (description ? "\n" : "") + `> ${deviceLine}`;
  if (extraLine) description += `\n> ${extraLine}`;
  if (ctx.referrer) description += `\n> 🔗 Ref: ${ctx.referrer.slice(0, 100)}`;

  const embed = {
    title: String(body.title || `${cat.emoji} ${cat.name}`).slice(0, 256),
    description: description || undefined,
    color: cat.color,
    fields,
    footer: {
      text: `Gif Edition · ${cat.name} · IP: ${ip}`,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await sendToDiscord(url, embed);
    if (!res.ok) return Response.json({ ok: false, reason: "discord_" + res.status }, { status: 502 });
  } catch {
    return Response.json({ ok: false, reason: "fetch_failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}

export async function GET() {
  const configured = {};
  for (const [key, c] of Object.entries(CATEGORIES)) {
    configured[key] = Boolean(process.env[c.env] || process.env.WEBHOOK_DEFAULT);
  }
  return Response.json({ configured, hasDefault: Boolean(process.env.WEBHOOK_DEFAULT) });
}
