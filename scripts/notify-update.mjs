// Envia o bloco mais recente do CHANGELOG.md pro canal de Atualizações do Discord,
// passando pelo endpoint seguro do site (/api/log, categoria "update").
// Uso:  node scripts/notify-update.mjs [urlDoSite]
// Ex.:  node scripts/notify-update.mjs https://staffgifizada.vercel.app
import fs from "node:fs";
import path from "node:path";

const SITE = process.argv[2] || process.env.SITE_URL || "https://staffgifizada.vercel.app";

const md = fs.readFileSync(path.join(process.cwd(), "CHANGELOG.md"), "utf8");

// Pega o primeiro bloco "## [versão] - data" até o próximo "## ["
const m = md.match(/##\s*\[([^\]]+)\]\s*-\s*([^\n]+)\n([\s\S]*?)(?=\n##\s*\[|$)/);
if (!m) {
  console.error("Nenhuma versão encontrada no CHANGELOG.md");
  process.exit(1);
}
const [, version, date, bodyRaw] = m;

// Extrai as seções (### Título) e seus bullets
function section(title) {
  const re = new RegExp(`###\\s*${title}\\s*\\n([\\s\\S]*?)(?=\\n###\\s|$)`, "i");
  const s = bodyRaw.match(re);
  if (!s) return null;
  const items = s[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-"))
    .map((l) => "• " + l.replace(/^-\s*/, "").replace(/\*\*/g, ""));
  return items.length ? items.join("\n").slice(0, 1024) : null;
}

const fields = [];
const add = section("Adicionado");
const imp = section("Melhorias");
const fix = section("Correções|Correcoes|Correções de bugs");
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
