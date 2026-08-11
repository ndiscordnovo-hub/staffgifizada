"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Send, RefreshCw, CheckCircle2, XCircle, Webhook, Info, KeyRound, Lock } from "lucide-react";
import { Panel } from "@/components/ui";
import { useMedia } from "@/components/MediaContext";

const ADMIN_FLAG = "gifedition.admin";

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
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [authing, setAuthing] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(ADMIN_FLAG) === "1");
  }, []);

  const submitPw = async (e) => {
    e.preventDefault();
    setAuthing(true);
    try {
      const r = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (r.ok) {
        sessionStorage.setItem(ADMIN_FLAG, "1");
        setUnlocked(true);
        window.dispatchEvent(new Event("gifedition:admin"));
        toast("Acesso administrativo liberado.", "success");
      } else {
        toast("Senha incorreta.", "error");
      }
    } catch {
      toast("Não foi possível verificar a senha.", "error");
    } finally {
      setAuthing(false);
    }
  };

  const lock = () => {
    sessionStorage.removeItem(ADMIN_FLAG);
    setUnlocked(false);
    window.dispatchEvent(new Event("gifedition:admin"));
  };

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

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="card p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/25 to-brand-700/10 border border-line">
            <Lock className="h-7 w-7 text-brand-500" />
          </div>
          <h1 className="text-xl font-bold text-ink">Área restrita</h1>
          <p className="mt-1.5 text-sm text-muted">Digite a senha de administrador para acessar o painel.</p>
          <form onSubmit={submitPw} className="mt-5 space-y-3">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
                placeholder="Senha de administrador"
                className="w-full rounded-xl bg-[#F6F5F6] border border-line pl-9 pr-3 py-2.5 text-sm text-ink placeholder-subtle focus:outline-none focus:border-brand-200 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <button type="submit" disabled={authing || !pw} className="btn-primary w-full">
              {authing ? "Verificando…" : "Entrar"}
            </button>
          </form>
          <p className="mt-4 text-[11px] text-subtle">A senha é verificada no servidor e nunca fica exposta no site.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-500" /> Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-subtle">Logs do site enviados pro Discord por Webhook (um canal por categoria).</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load} className="btn-ghost"><RefreshCw className="h-4 w-4" /> Atualizar</button>
          <button onClick={lock} className="btn-soft"><Lock className="h-4 w-4" /> Bloquear</button>
        </div>
      </div>

      <Panel title="Webhooks por categoria" icon={Webhook}>
        {loading ? (
          <p className="text-sm text-subtle">Verificando…</p>
        ) : (
          <div className="space-y-2">
            {CATS.map((c) => {
              const on = status?.[c.id];
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl bg-[#F6F5F6] border border-line px-3 py-2.5">
                  {on ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <XCircle className="h-5 w-5 text-subtle shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">{c.label} {on ? <span className="text-emerald-500 text-xs">· ativo</span> : <span className="text-subtle text-xs">· não configurado</span>}</div>
                    <div className="text-xs text-subtle truncate">{c.desc}</div>
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
        <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Info className="h-4 w-4 text-brand-500" /> Como configurar (seguro)</div>
        <p className="text-sm text-muted">
          Os links de webhook ficam <strong className="text-ink">secretos no servidor</strong> (não aparecem no site). Pra ativar cada categoria:
        </p>
        <ol className="text-sm text-muted list-decimal pl-5 space-y-1.5">
          <li>No Discord: <em>Configurações do canal → Integrações → Webhooks → Novo Webhook → Copiar URL</em>.</li>
          <li>No painel da hospedagem: adicione as variáveis de ambiente do projeto.</li>
          <li>Adicione a variável com o nome da categoria e cole a URL. Ex.:</li>
        </ol>
        <div className="rounded-lg bg-black/40 border border-line p-3 font-mono text-xs text-muted overflow-x-auto">
          {CATS.map((c) => <div key={c.id}><span className="text-brand-500">{c.env}</span>=https://discord.com/api/webhooks/…</div>)}
          <div className="mt-1.5 text-subtle">WEBHOOK_DEFAULT=…  <span className="text-subtle"># (opcional) usado quando a categoria não tem webhook próprio)</span></div>
        </div>
        <p className="text-xs text-subtle">Depois de salvar as variáveis, faça um novo deploy e use os botões &ldquo;Testar&rdquo; acima.</p>
      </div>
    </div>
  );
}
