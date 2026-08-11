"use client";
import { useState } from "react";
import { Handshake, ExternalLink, Mail, Eye, Users, Heart, Award, Gift, ChevronRight, ArrowRight, HelpCircle, Tag, Sparkles } from "lucide-react";
import { DISCORD_INVITE } from "@/lib/utils";

const PARTNERS = [
  {
    name: "Canva",
    category: "Design & Criação",
    categoryColor: "#8b5cf6",
    desc: "Plataforma de design gráfico que ajuda criadores a transformar ideias em visuais incríveis com facilidade.",
    url: "https://canva.com",
  },
  {
    name: "Discord",
    category: "Comunidade",
    categoryColor: "#5865F2",
    desc: "A plataforma de comunicação completa para comunidades, gamers e criadores de conteúdo.",
    url: "https://discord.com",
  },
  {
    name: "Tenor",
    category: "GIFs & Mídia",
    categoryColor: "#e63946",
    desc: "Biblioteca de GIFs que integra criação e compartilhamento de conteúdo animado em todo lugar.",
    url: "https://tenor.com",
  },
];

const BENEFITS = [
  {
    icon: Eye,
    title: "Visibilidade",
    desc: "Destaque da sua marca nos canais oficiais da GifEdition e em campanhas exclusivas.",
  },
  {
    icon: Users,
    title: "Alcance da Comunidade",
    desc: "Acesso à nossa comunidade engajada de criadores, editores e entusiastas de mídia.",
  },
  {
    icon: Tag,
    title: "Cupons Exclusivos",
    desc: "Ofereça benefícios e descontos especiais para nossa base de usuários.",
  },
  {
    icon: Award,
    title: "Selo de Parceiro Oficial",
    desc: "Ganhe o selo oficial da GifEdition e fortaleça a credibilidade da sua marca.",
  },
];

const STATS = [
  { icon: Users, value: "5K+", label: "Usuários\nAtivos" },
  { icon: Eye, value: "50K+", label: "Alcance\nMensal" },
  { icon: Gift, value: "150K+", label: "Mídias\nCriadas" },
  { icon: Heart, value: "98%", label: "Satisfação dos\nUsuários" },
];

function PartnerCard({ partner }) {
  return (
    <div className="card group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Logo area */}
      <div className="h-28 flex items-center justify-center border-b border-line bg-[#fafafa]">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 grid place-items-center">
          <Handshake className="h-6 w-6 text-brand-500" />
        </div>
      </div>

      <div className="p-5">
        {/* Category tag */}
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              color: partner.categoryColor,
              background: `${partner.categoryColor}10`,
            }}
          >
            <Sparkles className="h-3 w-3" />
            {partner.category}
          </span>
        </div>

        {/* Name & Description */}
        <h3 className="text-base font-bold text-ink mb-1.5">{partner.name}</h3>
        <p className="text-[13px] text-muted leading-relaxed mb-4 line-clamp-3">{partner.desc}</p>

        {/* CTA */}
        {partner.url && (
          <a
            href={partner.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-500"
            style={{ borderColor: "#e5e5e5", color: "#e63946" }}
          >
            Ver parceria <ChevronRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function ParceriaPage() {
  return (
    <div className="space-y-6">
      {/* Main grid: content + sidebar */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-6">
          {/* Hero */}
          <div className="card overflow-hidden">
            <div className="relative p-8 pb-6">
              {/* Background decoration */}
              <div
                className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-[0.07]"
                style={{
                  background: "radial-gradient(circle at 70% 30%, #e63946 0%, transparent 70%)",
                }}
              />

              <div className="flex items-center gap-2 mb-3">
                <Handshake className="h-5 w-5 text-brand-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Parcerias</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-ink mb-3 tracking-tight">
                Parcerias
              </h1>

              <p className="text-sm text-muted max-w-lg leading-relaxed">
                Conheça nossos parceiros oficiais, os benefícios de colaborar com a GifEdition e as oportunidades de parceria disponíveis.
              </p>
            </div>
          </div>

          {/* Partner cards grid */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {PARTNERS.map((p) => (
              <PartnerCard key={p.name} partner={p} />
            ))}
          </div>

          {/* View all link */}
          <div className="flex justify-center">
            <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors">
              Ver todos os parceiros <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* CTA Banner */}
          <div className="card overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6"
              style={{
                background: "linear-gradient(135deg, rgba(243,24,69,0.04) 0%, rgba(243,24,69,0.08) 100%)",
              }}
            >
              {/* Icon */}
              <div className="shrink-0">
                <div className="h-16 w-16 rounded-2xl grid place-items-center"
                  style={{ background: "linear-gradient(135deg, #FF5E7C, #F31845)", boxShadow: "0 4px 20px rgba(243,24,69,0.25)" }}>
                  <Handshake className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-ink">Seja um parceiro da GifEdition</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">
                  Junte-se a marcas incríveis e faça parte de uma rede que valoriza criatividade, comunidade e experiências memoráveis.
                </p>
              </div>

              {/* Button */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #FF5E7C, #F31845)", boxShadow: "0 2px 12px rgba(243,24,69,0.2)" }}>
                  Quero ser parceiro <ChevronRight className="h-4 w-4" />
                </a>
                <a href={DISCORD_INVITE} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors">
                  Saiba como funciona <HelpCircle className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="space-y-5">
          {/* Benefits */}
          <div className="card p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
              Benefícios de Ser Parceiro
            </h2>

            <div className="space-y-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-3.5">
                  <div className="shrink-0 h-11 w-11 rounded-xl grid place-items-center"
                    style={{ background: "rgba(243,24,69,0.06)", border: "1px solid rgba(243,24,69,0.1)" }}>
                    <b.icon className="h-5 w-5 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{b.title}</h3>
                    <p className="text-[12px] text-muted leading-relaxed mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats card */}
          <div className="rounded-2xl overflow-hidden text-white"
            style={{ background: "linear-gradient(135deg, #e63946 0%, #c1121f 100%)" }}>
            <div className="p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/80 mb-4">
                Nossa Rede em Números
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s) => (
                  <div key={s.label} className="text-center">
                    <s.icon className="h-5 w-5 text-white/60 mx-auto mb-1.5" />
                    <div className="text-2xl font-extrabold tabular-nums">{s.value}</div>
                    <div className="text-[11px] text-white/60 mt-0.5 whitespace-pre-line leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <a href={`mailto:parcerias@gifedition.com.br`}
            className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-[#f5f5f5] grid place-items-center shrink-0">
              <HelpCircle className="h-5 w-5 text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-ink">Dúvidas sobre parcerias?</h3>
              <p className="text-[12px] text-muted">Fale com nosso time: parcerias@gifedition.com.br</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted group-hover:text-ink transition-colors shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}
