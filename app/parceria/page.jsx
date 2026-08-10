"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Handshake, ExternalLink, Mail, Shield, Zap, Users, Star, ArrowRight, MessageCircle } from "lucide-react";
import { DISCORD_INVITE } from "@/lib/utils";

const PARTNERS = [
  // Adicione parceiros aqui no formato:
  // { name: "Nome", logo: "/logo.png", url: "https://...", desc: "Descrição curta", benefits: ["Benefício 1", "Benefício 2"] },
];

function PartnerCard({ partner, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="card group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-50 to-transparent rounded-bl-[60px] opacity-60" />
      <div className="relative p-6">
        <div className="flex items-start gap-4 mb-4">
          {partner.logo ? (
            <img src={partner.logo} alt={partner.name} className="h-14 w-14 rounded-2xl object-contain border border-line bg-white p-1.5 shadow-sm" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 border border-brand-200 grid place-items-center shadow-sm">
              <Handshake className="h-6 w-6 text-brand-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-ink">{partner.name}</h3>
            <p className="text-sm text-muted mt-0.5 line-clamp-2">{partner.desc}</p>
          </div>
        </div>

        {partner.benefits?.length > 0 && (
          <div className="space-y-2 mb-4">
            {partner.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted">
                <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        )}

        {partner.url && (
          <a href={partner.url} target="_blank" rel="noreferrer"
            className="btn-primary w-full justify-center !py-2.5 text-sm">
            Visitar <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function ParceriaPage() {
  const [formSent, setFormSent] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2.5">
          <Handshake className="h-7 w-7 text-brand-500" /> Parcerias
        </h1>
        <p className="mt-1.5 text-sm text-muted max-w-lg">
          Trabalhamos com empresas e projetos que compartilham a nossa missão de criar ferramentas incríveis para a comunidade.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Usuários ativos", value: "5.000+" },
          { icon: Zap, label: "Processamentos/mês", value: "50.000+" },
          { icon: Shield, label: "Privacidade", value: "100%" },
          { icon: Star, label: "Avaliação", value: "4.9/5" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4 text-center"
          >
            <s.icon className="h-5 w-5 text-brand-500 mx-auto mb-2" />
            <div className="text-xl font-extrabold text-ink tabular-nums">{s.value}</div>
            <div className="text-[11px] text-subtle mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Partners grid */}
      {PARTNERS.length > 0 ? (
        <>
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">Nossos Parceiros</h2>
            <p className="text-sm text-muted">Empresas e projetos que confiam no Gif Edition.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNERS.map((p, i) => (
              <PartnerCard key={p.name} partner={p} index={i} />
            ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 grid place-items-center">
            <Handshake className="h-8 w-8 text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-ink">Em breve</h3>
          <p className="mt-1.5 text-sm text-muted max-w-sm mx-auto">
            Estamos fechando parcerias incríveis. Em breve nossos parceiros oficiais aparecerão aqui.
          </p>
        </motion.div>
      )}

      {/* Benefits of partnering */}
      <div>
        <h2 className="text-lg font-bold text-ink mb-4">Por que ser parceiro?</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Users, title: "Audiência engajada", desc: "Acesso a milhares de criadores de conteúdo e comunidades Discord ativas." },
            { icon: Zap, title: "Integração fácil", desc: "Integramos seu serviço diretamente no fluxo de edição dos usuários." },
            { icon: Shield, title: "Marca de confiança", desc: "Associe sua marca a uma ferramenta 100% gratuita, privada e sem anúncios." },
            { icon: Star, title: "Destaque visual", desc: "Seu logo e benefícios aparecem na página de parceiros e no site." },
            { icon: MessageCircle, title: "Comunidade Discord", desc: "Canal exclusivo para parceiros no nosso servidor com suporte prioritário." },
            { icon: ArrowRight, title: "Crescimento mútuo", desc: "Divulgação cruzada — promovemos seu serviço e você promove o nosso." },
          ].map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="card p-5"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 grid place-items-center mb-3">
                <b.icon className="h-5 w-5 text-brand-500" />
              </div>
              <h3 className="text-sm font-bold text-ink">{b.title}</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card overflow-hidden"
      >
        <div className="relative p-8 text-center"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(243,24,69,0.08), transparent 60%)",
          }}>
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl grid place-items-center shadow-glow"
            style={{ background: "linear-gradient(135deg, #FF5E7C, #F31845, #D70D35)" }}>
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-ink">Quer ser nosso parceiro?</h2>
          <p className="mt-2 text-sm text-muted max-w-md mx-auto">
            Entre em contato pelo Discord ou envie uma mensagem. Estamos abertos a parcerias com empresas, bots e projetos da comunidade.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn-primary !py-3 !px-6 justify-center">
              <MessageCircle className="h-4 w-4" /> Falar no Discord
            </a>
          </div>
          <p className="mt-4 text-[11px] text-subtle">Respondemos em até 24 horas.</p>
        </div>
      </motion.div>
    </div>
  );
}
