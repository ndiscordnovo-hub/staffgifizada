"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Send, RefreshCw, CheckCircle2, XCircle, Webhook, Info } from "lucide-react";
import { Panel } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";

const CATS = [
  { id: "access", label: "Acessos", env: "WEBHOOK_ACCESS", desc: "Novos visitantes, país, dispositivo" },
  { id: "upload", label: "Uploads", env: "WEBHOOK_UPLOAD", desc: "Arquivos enviados" },
  { id: "process", label: "Processamento", env: "WEBHOOK_PROCESS", desc: "Edições, conversões, compressão" },
  { id: "error", label: "Erros", env: "WEBHOOK_ERROR", desc: "Falhas internas" },
  { id: "security", label: "Segurança", env: "WEBHOOK_SECURITY", desc: "Rate-limit, abuso" },
  { id: "admin", label: "Administrativo", env: "WEBHOOK_ADMIN", desc: "Ações de admin, testes" },
  { id: "suggestion", label: "Sugestões", env: "WEBHOOK_SUGGESTION", desc: "Sugestões enviadas" },
  { id: "update", label: "Atualizações", env: "WEBHOOK_UPDATE", desc: "Novas versões publicadas" },
];

export default function AdminPage() {
  const { toast } = useMedia();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/log", { cache: "no-store" });
      const j = await r.json();
      setStatus(j.configured || {});
    } catch {
      setStatus({});
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const test = async (cat) => {
    setTesting(cat.id);
    try {
      const r = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: cat.id,
          title: `🧪 Teste — ${cat.label}`,
          description: "Mensagem de teste enviada pelo painel administrativo.",
          fields: [{ name: "Categoria", value: cat.label, inline: true }],
        }),
      });
      const j = await r.json();
      if (j.ok) toast(`Teste de "${cat.label}" enviado ao Discord!`, "success");
      else if (j.reason === "not_configured") toast(`"${cat.label}" ainda não tem webhook configurado.`, "warn");
      else toast(`Falha: ${j.reason}`, "error");
    } catch {
      toast("Não foi possível enviar o teste.", "error");
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-300" /> Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-white/45">Logs do site enviados pro Discord por Webhook (um canal por categoria).</p>
        </div>
        <button onClick={load} className="btn-ghost shrink-0"><RefreshCw className="h-4 w-4" /> Atualizar</button>
      </div>

      <Panel title="Webhooks por categoria" icon={Webhook}>
        {loading ? (
          <p className="text-sm text-white/40">Verificando…</p>
        ) : (
          <div className="space-y-2">
            {CATS.map((c) => {
              const on = status?.[c.id];
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5">
                  {on ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <XCircle className="h-5 w-5 text-white/25 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{c.label} {on ? <span className="text-emerald-400 text-xs">· ativo</span> : <span className="text-white/30 text-xs">· não configurado</span>}</div>
                    <div className="text-xs text-white/40 truncate">{c.desc}</div>
                  </div>
                  <button disabled={testing === c.id} onClick={() => test(c)} className="btn-soft !py-1.5 shrink-0">
                    <Send className="h-3.5 w-3.5" /> {testing === c.id ? "…" : "Testar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><Info className="h-4 w-4 text-brand-300" /> Como configurar (seguro)</div>
        <p className="text-sm text-white/60">
          Os links de webhook ficam <strong className="text-white">secretos no servidor</strong> (não aparecem no site). Pra ativar cada categoria:
        </p>
        <ol className="text-sm text-white/60 list-decimal pl-5 space-y-1.5">
          <li>No Discord: <em>Configurações do canal → Integrações → Webhooks → Novo Webhook → Copiar URL</em>.</li>
          <li>Na Vercel: <em>Project → Settings → Environment Variables</em>.</li>
          <li>Adicione a variável com o nome da categoria e cole a URL. Ex.:</li>
        </ol>
        <div className="rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-xs text-white/70 overflow-x-auto">
          {CATS.map((c) => <div key={c.id}><span className="text-brand-300">{c.env}</span>=https://discord.com/api/webhooks/…</div>)}
          <div className="mt-1.5 text-white/40">WEBHOOK_DEFAULT=…  <span className="text-white/30"># (opcional) usado quando a categoria não tem webhook próprio)</span></div>
        </div>
        <p className="text-xs text-white/40">Depois de salvar as variáveis, faça um novo deploy (ou clique em <em>Redeploy</em> na Vercel) e use os botões “Testar” acima.</p>
      </div>
    </div>
  );
}
