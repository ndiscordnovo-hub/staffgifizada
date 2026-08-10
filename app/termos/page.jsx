"use client";
import { FileText } from "lucide-react";
import { SITE_NAME } from "@/lib/utils";

export default function TermosPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <FileText className="h-6 w-6 text-brand-500" /> Termos de Uso
        </h1>
        <p className="mt-1 text-sm text-subtle">Última atualização: 29/07/2026</p>
      </div>

      <div className="card p-6 space-y-5 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-ink font-semibold mb-1.5">1. Sobre o serviço</h2>
          <p>
            O {SITE_NAME} é uma ferramenta gratuita para editar, converter e otimizar imagens, GIFs
            e vídeos. Todo o processamento acontece no seu próprio navegador — os arquivos não são
            enviados para nenhum servidor.
          </p>
        </section>
        <section>
          <h2 className="text-ink font-semibold mb-1.5">2. Uso aceitável</h2>
          <p>
            Você é o único responsável pelo conteúdo que edita ou converte. É proibido usar a
            ferramenta para processar material ilegal, que viole direitos de terceiros (direitos
            autorais, imagem, marca) ou que infrinja as regras de plataformas como o Discord.
          </p>
        </section>
        <section>
          <h2 className="text-ink font-semibold mb-1.5">3. Sem garantias</h2>
          <p>
            O serviço é fornecido "como está", sem garantias de qualquer tipo. Não garantimos que
            estará sempre disponível, livre de erros, ou que os resultados atenderão a todas as suas
            necessidades. Faça sempre backup dos seus arquivos originais.
          </p>
        </section>
        <section>
          <h2 className="text-ink font-semibold mb-1.5">4. Limitação de responsabilidade</h2>
          <p>
            Não nos responsabilizamos por perda de arquivos, danos, prejuízos ou qualquer
            consequência decorrente do uso da ferramenta. O uso é por sua conta e risco.
          </p>
        </section>
        <section>
          <h2 className="text-ink font-semibold mb-1.5">5. Propriedade do conteúdo</h2>
          <p>
            Os arquivos que você processa continuam sendo seus. Não reivindicamos nenhum direito
            sobre eles — inclusive porque nunca temos acesso a eles.
          </p>
        </section>
        <section>
          <h2 className="text-ink font-semibold mb-1.5">6. Alterações</h2>
          <p>
            Estes termos podem ser atualizados a qualquer momento. O uso contínuo do serviço após
            mudanças significa que você concorda com a versão vigente.
          </p>
        </section>
      </div>
    </div>
  );
}
