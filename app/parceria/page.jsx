"use client";
import { Handshake, ExternalLink, Eye, Users, Heart, Award, Gift, ChevronRight, HelpCircle, Tag, Sparkles, ShoppingBag, Settings, Layers } from "lucide-react";
import { DISCORD_INVITE } from "@/lib/utils";

const PARTNERS = [
  {
    name: "Canva",
    logo: null,
    category: "Design & Criação",
    categoryIcon: Sparkles,
    categoryColor: "#8b5cf6",
    desc: "Plataforma de design gráfico que ajuda criadores a transformar ideias em visuais incríveis com facilidade.",
    url: "https://canva.com",
  },
  {
    name: "Discord",
    logo: null,
    category: "Comunidade",
    categoryIcon: ShoppingBag,
    categoryColor: "#5865F2",
    desc: "A plataforma de comunicação completa para comunidades, gamers e criadores de conteúdo.",
    url: "https://discord.com",
  },
  {
    name: "Tenor",
    logo: null,
    category: "GIFs & Mídia",
    categoryIcon: Settings,
    categoryColor: "#e63946",
    desc: "Biblioteca de GIFs que integra criação e compartilhamento de conteúdo animado em todo lugar.",
    url: "https://tenor.com",
  },
];

const BENEFITS = [
  { icon: Eye, title: "Visibilidade", desc: "Destaque da sua marca nos canais oficiais da GifEdition e em campanhas exclusivas." },
  { icon: Users, title: "Alcance da Comunidade", desc: "Acesso à nossa comunidade engajada de criadores, editores e entusiastas de mídia." },
  { icon: Tag, title: "Cupons Exclusivos", desc: "Ofereça benefícios e descontos especiais para nossa base de usuários." },
  { icon: Award, title: "Selo de Parceiro Oficial", desc: "Ganhe o selo oficial da GifEdition e fortaleça a credibilidade da sua marca." },
];

const STATS = [
  { icon: Users, value: "25+", label: "Parceiros\nOficiais" },
  { icon: Eye, value: "1.2M+", label: "Alcance\nMensal" },
  { icon: Gift, value: "150K+", label: "Presentes\nCriados" },
  { icon: Heart, value: "98%", label: "Satisfação dos\nClientes" },
];

function PartnerCard({ partner }) {
  const CatIcon = partner.categoryIcon;
  return (
    <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Logo area */}
      <div className="h-[120px] flex items-center justify-center bg-[#f8f8f8] border-b border-[#eee]">
        {partner.logo ? (
          <img src={partner.logo} alt={partner.name} className="h-10 object-contain" />
        ) : (
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 grid place-items-center">
            <Layers className="h-6 w-6 text-brand-500" />
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Category tag */}
        <div className="mb-3">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: partner.categoryColor, background: `${partner.categoryColor}12` }}
          >
            <CatIcon className="h-3 w-3" />
            {partner.category}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-1.5">{partner.name}</h3>
        <p className="text-[13px] text-[#666] leading-relaxed mb-5 line-clamp-3">{partner.desc}</p>

        {/* CTA button */}
        <a
          href={partner.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold border border-[#e0e0e0] text-[#e63946] hover:bg-[#fff5f5] hover:border-[#e63946]/30 transition-all duration-200"
        >
          Ver parceria <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function ParceriaPage() {
  return (
    <div className="space-y-6">
      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* ═══════ LEFT COLUMN ═══════ */}
        <div className="space-y-6">

          {/* ── Hero ── */}
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden relative">
            <div className="p-8 pr-[180px] min-h-[200px]">
              {/* Decorative illustration placeholder */}
              <div className="absolute right-4 top-4 bottom-4 w-[160px] flex items-center justify-center opacity-[0.07] pointer-events-none">
                <Gift className="h-40 w-40 text-[#e63946]" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Handshake className="h-4 w-4 text-[#e63946]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#e63946]">Parcerias</span>
              </div>

              <h1 className="text-[42px] font-extrabold text-[#1a1a1a] leading-[1.1] mb-4 tracking-tight">
                Parcerias
              </h1>

              <p className="text-[14px] text-[#666] leading-relaxed max-w-[480px]">
                Conheça nossos parceiros oficiais, os benefícios de colaborar com a GifEdition e as oportunidades de parceria disponíveis.
              </p>
            </div>
          </div>

          {/* ── Partner cards ── */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {PARTNERS.map((p) => (
              <PartnerCard key={p.name} partner={p} />
            ))}
          </div>

          {/* ── View all link ── */}
          <div className="flex justify-center py-1">
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#1a1a1a] transition-colors font-medium"
            >
              Ver todos os parceiros <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* ── CTA Banner ── */}
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
            <div
              className="flex flex-col sm:flex-row items-center gap-5 p-6"
              style={{ background: "linear-gradient(135deg, rgba(243,24,69,0.03) 0%, rgba(243,24,69,0.08) 100%)" }}
            >
              {/* Icon */}
              <div className="shrink-0">
                <div
                  className="h-[64px] w-[64px] rounded-full grid place-items-center relative"
                  style={{ background: "linear-gradient(135deg, #FF5E7C, #F31845)" }}
                >
                  <Handshake className="h-7 w-7 text-white" />
                  {/* Small decorative dots */}
                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#e63946]/20" />
                  <div className="absolute -top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#e63946]/15" />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-[17px] font-bold text-[#1a1a1a]">Seja um parceiro da GifEdition</h3>
                <p className="text-[13px] text-[#666] mt-1 leading-relaxed">
                  Junte-se a marcas incríveis e faça parte de uma rede que valoriza criatividade, empreendedorismo e experiências memoráveis.
                </p>
              </div>

              {/* Buttons */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <a
                  href={DISCORD_INVITE}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #FF5E7C, #F31845)", boxShadow: "0 2px 12px rgba(243,24,69,0.2)" }}
                >
                  Quero ser parceiro <ChevronRight className="h-4 w-4" />
                </a>
                <a
                  href={DISCORD_INVITE}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#999] hover:text-[#666] transition-colors"
                >
                  Saiba como funciona <HelpCircle className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ RIGHT SIDEBAR ═══════ */}
        <div className="space-y-5">

          {/* ── Benefits ── */}
          <div className="bg-white rounded-2xl border border-[#eee] p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#999] mb-5">
              Benefícios de Ser Parceiro
            </h2>

            <div className="space-y-6">
              {BENEFITS.map((b, i) => (
                <div key={b.title} className="flex gap-4">
                  <div className="shrink-0">
                    <div
                      className="h-[44px] w-[44px] rounded-xl grid place-items-center"
                      style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.1)" }}
                    >
                      <b.icon className="h-5 w-5 text-[#e63946]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#1a1a1a] mb-0.5">{b.title}</h3>
                    <p className="text-[12px] text-[#888] leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Stats card ── */}
          <div
            className="rounded-2xl overflow-hidden text-white"
            style={{ background: "linear-gradient(135deg, #e63946 0%, #c1121f 100%)" }}
          >
            <div className="p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 mb-5">
                Nossa Rede em Números
              </h2>

              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                {STATS.map((s) => (
                  <div key={s.label} className="text-center">
                    <s.icon className="h-5 w-5 text-white/50 mx-auto mb-2" />
                    <div className="text-[26px] font-extrabold leading-none tabular-nums">{s.value}</div>
                    <div className="text-[11px] text-white/60 mt-1 whitespace-pre-line leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Contact ── */}
          <a
            href="mailto:parcerias@gifedition.com.br"
            className="bg-white rounded-2xl border border-[#eee] p-5 flex items-center gap-4 hover:shadow-md transition-shadow group cursor-pointer block"
          >
            <div className="h-[42px] w-[42px] rounded-xl bg-[#f5f5f5] grid place-items-center shrink-0">
              <HelpCircle className="h-5 w-5 text-[#999]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-[#1a1a1a]">Dúvidas sobre parcerias?</h3>
              <p className="text-[11px] text-[#999]">Fale com nosso time: parcerias@gifedition.com.br</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#ccc] group-hover:text-[#666] transition-colors shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}
