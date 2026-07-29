"use client";
import { ShieldCheck } from "lucide-react";
import { SITE_NAME } from "@/lib/utils";

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand-300" /> Política de Privacidade
        </h1>
        <p className="mt-1 text-sm text-white/45">Última atualização: 29/07/2026</p>
      </div>

      <div className="card p-6 space-y-5 text-sm leading-relaxed text-white/70">
        <section>
          <h2 className="text-white font-semibold mb-1.5">O ponto principal</h2>
          <p>
            O {SITE_NAME} foi feito para respeitar a sua privacidade ao máximo:
            <strong className="text-white"> seus arquivos nunca saem do seu dispositivo.</strong> Todo
            o trabalho (cortar, converter, comprimir) é feito localmente, dentro do seu navegador.
          </p>
        </section>
        <section>
          <h2 className="text-white font-semibold mb-1.5">O que NÃO coletamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Não enviamos suas imagens, GIFs ou vídeos para servidores.</li>
            <li>Não pedimos cadastro, login, e-mail ou senha.</li>
            <li>Não vendemos nem compartilhamos dados pessoais.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-white font-semibold mb-1.5">O que fica salvo (só no seu navegador)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Histórico e "Salvos":</strong> guardados localmente (localStorage/IndexedDB) apenas no seu dispositivo. Você pode apagar quando quiser em Configurações ou na aba Salvos.</li>
            <li><strong className="text-white">Preferências:</strong> como formato e qualidade padrão.</li>
          </ul>
          <p className="mt-2">Esses dados não são acessíveis por nós — ficam apenas no seu computador/celular.</p>
        </section>
        <section>
          <h2 className="text-white font-semibold mb-1.5">Serviços externos</h2>
          <p>
            Para editar GIFs e vídeos, o site baixa uma vez um componente técnico (FFmpeg) de uma
            rede de distribuição (CDN). Isso não envia seus arquivos — apenas carrega o programa que
            roda no seu navegador.
          </p>
        </section>
        <section>
          <h2 className="text-white font-semibold mb-1.5">Contato</h2>
          <p>Dúvidas sobre privacidade? Fale com a gente no nosso servidor do Discord.</p>
        </section>
      </div>
    </div>
  );
}
