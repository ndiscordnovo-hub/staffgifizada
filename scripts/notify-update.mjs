// Envia o bloco mais recente do CHANGELOG.md pro canal de Atualizações do Discord,
// passando pelo endpoint seguro do site (/api/log, categoria "update").
// Uso:  node scripts/notify-update.mjs [urlDoSite]
// Ex.:  node scripts/notify-update.mjs https://staffgifizada.vercel.app
import fs from "node:fs";
import path from "node:path";

const SITE = process.argv[2] || process.env.SITE_URL || "https://gifediton.squareweb.app";

const md = fs.readFileSync(path.join(process.cwd(), "CHANGELOG.md"), "utf8");

// Pega o primeiro bloco "## [versão] - data" até o próximo "## ["
const m = md.match(/##\s*\[([^\]]+)\]\s*-\s*([^\n]+)\n([\s\S]*?)(?=\n##\s*\[|$)/);
if (!m) {
  console.error("Nenhuma versão encontrada no CHANGELOG.md");
  process.exit(1);
}
const [, version, date, bodyRaw] = m;

// Parse linha a linha: agrupa bullets por seção "### Título".
const sections = {};
let current = null;
for (const raw of bodyRaw.split("\n")) {
  const line = raw.trim();
  const h = line.match(/^###\s+(.*)$/);
  if (h) { current = h[1].toLowerCase(); sections[current] = []; continue; }
  if (current && line.startsWith("-")) {
    sections[current].push("• " + line.replace(/^-\s*/, "").replace(/\*\*/g, ""));
  }
}
const pick = (key) => {
  const k = Object.keys(sections).find((s) => s.includes(key));
  const items = k ? sections[k] : [];
  return items.length ? items.join("\n").slice(0, 1024) : null;
};

const fields = [];
const add = pick("adicionado");
const imp = pick("melhoria");
const fix = pick("correç") || pick("correc");
if (add) fields.push({ name: "✨ Adicionado", value: add });
if (imp) fields.push({ name: "⚡ Melhorias", value: imp });
if (fix) fields.push({ name: "🐛 Correções", value: fix });
fields.push({ name: "📅 Data", value: date.trim(), inline: true });

const payload = {
  category: "update",
  title: `🚀 Atualização v${version.trim()}`,
  description: "Uma nova versão do **Gif Edition** está no ar!",
  fields,
};

const res = await fetch(`${SITE}/api/log`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const j = await res.json().catch(() => ({}));
if (j.ok) console.log(`✔ Atualização v${version.trim()} anunciada no Discord.`);
else console.log(`Resposta do servidor: ${JSON.stringify(j)} (status ${res.status})`);
