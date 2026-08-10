// Server-side Discord webhook logging endpoint.
// The webhook URLs live ONLY in server env vars — never shipped to the browser.
// The client POSTs lightweight events here; this function adds geo/IP, applies a
// best-effort rate limit, builds a Discord embed and forwards it to the right
// webhook (a different one per category, if configured).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// category -> { env var, embed color, default title }
const CATEGORIES = {
  access:     { env: "WEBHOOK_ACCESS",     color: 0x5865f2, name: "Acesso" },
  upload:     { env: "WEBHOOK_UPLOAD",     color: 0x3498db, name: "Upload" },
  process:    { env: "WEBHOOK_PROCESS",    color: 0x2ecc71, name: "Processamento" },
  error:      { env: "WEBHOOK_ERROR",      color: 0xe74c3c, name: "Erro" },
  security:   { env: "WEBHOOK_SECURITY",   color: 0xe67e22, name: "Segurança" },
  admin:      { env: "WEBHOOK_ADMIN",      color: 0x9b59b6, name: "Admin" },
  suggestion: { env: "WEBHOOK_SUGGESTION", color: 0xf1c40f, name: "Sugestão" },
  update:     { env: "WEBHOOK_UPDATE",     color: 0x1abc9c, name: "Atualização" },
};

function webhookFor(category) {
  const c = CATEGORIES[category];
  return (c && process.env[c.env]) || process.env.WEBHOOK_DEFAULT || null;
}

// Best-effort in-memory rate limit (per warm instance). Robust limiting across
// all instances would need a shared store (KV/Redis) — a future upgrade.
const HITS = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const flagged = new Map(); // ip -> last time we logged a security alert

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
    body: JSON.stringify({ username: "Gif Edition • Logs", embeds: [embed] }),
  });
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

  // Geo + client info (Vercel injects these headers; absent elsewhere).
  const country = h.get("x-vercel-ip-country") || null;
  const region = h.get("x-vercel-ip-country-region") || null;
  const city = h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")) : null;
  const geo = [city, region, country].filter(Boolean).join(", ") || "—";

  // Rate limit / abuse detection.
  if (rateLimited(ip)) {
    const secUrl = process.env.WEBHOOK_SECURITY || process.env.WEBHOOK_DEFAULT;
    const last = flagged.get(ip) || 0;
    if (secUrl && Date.now() - last > WINDOW_MS) {
      flagged.set(ip, Date.now());
      sendToDiscord(secUrl, {
        title: "🚨 Segurança — muitas requisições",
        description: `Rate limit atingido (> ${MAX_PER_WINDOW}/min).`,
        color: 0xe67e22,
        fields: [
          { name: "Origem", value: geo, inline: true },
          { name: "IP", value: "||" + ip + "||", inline: true },
        ],
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }
    return Response.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  const url = webhookFor(category);
  if (!url) return Response.json({ ok: false, reason: "not_configured" }, { status: 200 });

  // Build embed from client-provided fields + server-added context.
  const fields = Array.isArray(body.fields)
    ? body.fields.slice(0, 20).map((f) => ({
        name: String(f.name || "-").slice(0, 256),
        value: String(f.value ?? "-").slice(0, 1024) || "-",
        inline: !!f.inline,
      }))
    : [];
  if (category === "access") fields.push({ name: "Origem", value: geo, inline: true });

  const embed = {
    title: String(body.title || cat.name).slice(0, 256),
    description: body.description ? String(body.description).slice(0, 4000) : undefined,
    color: cat.color,
    fields,
    footer: { text: "Gif Edition" },
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

// Status for the admin panel: which categories have a webhook set (no URLs leaked).
export async function GET() {
  const configured = {};
  for (const [key, c] of Object.entries(CATEGORIES)) {
    configured[key] = Boolean(process.env[c.env] || process.env.WEBHOOK_DEFAULT);
  }
  return Response.json({ configured, hasDefault: Boolean(process.env.WEBHOOK_DEFAULT) });
}
