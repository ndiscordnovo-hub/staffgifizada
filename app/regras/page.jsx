"use client";
import { useState } from "react";
import { ShieldCheck, ScrollText, Lock, Eye, AlertTriangle, Scale, Server, MessageSquare, Cookie, Globe, Bug, Ban, Gem, CreditCard, RefreshCw, Users, Gavel, Clock, Pencil, Baby, Mail } from "lucide-react";
import { SITE_NAME, DISCORD_INVITE } from "@/lib/utils";

const SECTIONS = [
  { id: "sobre", label: "Sobre o GifEdition", icon: Gem },
  { id: "regras", label: "Regras de uso", icon: Scale },
  { id: "conteudo", label: "Conteúdo e arquivos", icon: ScrollText },
  { id: "processamento", label: "Processamento temporário", icon: Server },
  { id: "limites", label: "Formatos e limites", icon: AlertTriangle },
  { id: "falhas", label: "Falhas de processamento", icon: RefreshCw },
  { id: "resultado", label: "Resultado das edições", icon: Eye },
  { id: "creditos", label: "Créditos", icon: CreditCard },
  { id: "falha-creditos", label: "Falha após créditos", icon: RefreshCw },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
  { id: "reembolso", label: "Cancelamento e reembolso", icon: RefreshCw },
  { id: "privacidade", label: "Privacidade e dados", icon: Lock },
  { id: "finalidade", label: "Finalidade dos dados", icon: Eye },
  { id: "lgpd", label: "LGPD", icon: ShieldCheck },
  { id: "seguranca", label: "Segurança", icon: ShieldCheck },
  { id: "logs", label: "Logs e prevenção de fraude", icon: Bug },
  { id: "cookies", label: "Cookies", icon: Cookie },
  { id: "terceiros", label: "Serviços de terceiros", icon: Globe },
  { id: "discord", label: "Discord e integrações", icon: MessageSquare },
  { id: "api", label: "API", icon: Server },
  { id: "vulnerabilidades", label: "Bugs e vulnerabilidades", icon: Bug },
  { id: "restricao", label: "Restrição de acesso", icon: Ban },
  { id: "propriedade", label: "Propriedade intelectual", icon: Gavel },
  { id: "disponibilidade", label: "Disponibilidade", icon: Clock },
  { id: "alteracoes", label: "Alterações nas regras", icon: Pencil },
  { id: "criancas", label: "Crianças e adolescentes", icon: Baby },
  { id: "contato", label: "Contato e suporte", icon: Mail },
  { id: "aceitacao", label: "Aceitação", icon: ShieldCheck },
];

function SectionBlock({ id, title, icon: Icon, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-ink font-semibold mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-500 shrink-0" /> {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default function RegrasPage() {
  const [active, setActive] = useState("sobre");

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand-500" /> Regras, Termos e Privacidade
        </h1>
        <p className="mt-1 text-sm text-subtle">Última atualização: 16/08/2026</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-5 items-start">
        {/* Sidebar nav */}
        <nav className="hidden lg:block sticky top-4 card p-3 max-h-[85vh] overflow-y-auto">
          <div className="space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition-all ${active === s.id ? "bg-brand-50 text-brand-500 font-semibold" : "text-muted hover:text-ink hover:bg-[#F6F5F6]"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="lg:hidden card p-3">
          <select
            value={active}
            onChange={(e) => scrollTo(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="card p-6 space-y-8 text-sm leading-relaxed text-muted">

          <SectionBlock id="sobre" title="1. Sobre o GifEdition" icon={Gem}>
            <p>
              O {SITE_NAME} é uma plataforma online para edição de imagens, GIFs e vídeos.
              As funcionalidades incluem:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Edição de imagens (corte, redimensionamento, filtros, marca d'água, remoção de fundo)</li>
              <li>Edição de GIFs (velocidade, FPS, cores, rotação, espelhamento, recorte, compressão)</li>
              <li>Edição de vídeos (corte temporal, crop, resolução, compressão, extração de áudio)</li>
              <li>Conversão entre formatos (PNG, JPG, WEBP, GIF, MP4, WEBM, MP3)</li>
              <li>Otimização e compressão para limites do Discord e redes sociais</li>
              <li>Processamento em lote (múltiplos arquivos de uma vez)</li>
              <li>Presets de tamanho para Discord, redes sociais e design</li>
              <li>Criação de emojis e stickers para Discord</li>
              <li>Gerador de QR Code personalizado</li>
            </ul>
            <p>
              O processamento principal é feito diretamente no navegador do usuário, sem envio
              obrigatório de arquivos para servidores externos.
            </p>
          </SectionBlock>

          <SectionBlock id="regras" title="2. Regras gerais de uso" icon={Scale}>
            <p>Ao utilizar o {SITE_NAME}, você concorda em não utilizar a plataforma para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prejudicar outros usuários ou a infraestrutura do serviço</li>
              <li>Sobrecarregar ou tentar derrubar servidores</li>
              <li>Explorar vulnerabilidades de segurança</li>
              <li>Burlar limites técnicos ou de uso</li>
              <li>Manipular créditos ou saldos indevidamente</li>
              <li>Enviar arquivos maliciosos (vírus, malware, scripts prejudiciais)</li>
              <li>Realizar qualquer tipo de fraude</li>
              <li>Executar ataques (DDoS, injeção, brute force ou similares)</li>
              <li>Fazer spam de requisições ou uso automatizado abusivo</li>
              <li>Tentar acessar áreas administrativas ou dados de terceiros sem autorização</li>
            </ul>
            <p>
              Em caso de violação, o {SITE_NAME} poderá restringir ou bloquear o acesso do
              responsável, conforme descrito na seção de Restrição de acesso.
            </p>
          </SectionBlock>

          <SectionBlock id="conteudo" title="3. Conteúdo e arquivos enviados" icon={ScrollText}>
            <p>
              O usuário é responsável pelos arquivos que envia para processamento e deve possuir
              autorização para utilizá-los. Não é permitido enviar arquivos:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ilegais ou que violem a legislação aplicável</li>
              <li>Maliciosos, contendo vírus, malware ou código prejudicial</li>
              <li>Destinados a fraude, ataques ou atividades ilícitas</li>
              <li>Que violem direitos autorais, de imagem, marca ou propriedade intelectual de terceiros</li>
              <li>Utilizados sem autorização do titular dos direitos</li>
            </ul>
            <p>
              O {SITE_NAME} não adquire propriedade sobre o conteúdo enviado. Os arquivos são
              utilizados exclusivamente para realizar o processamento solicitado pelo usuário.
            </p>
          </SectionBlock>

          <SectionBlock id="processamento" title="4. Processamento temporário" icon={Server}>
            <p>
              Os arquivos podem permanecer temporariamente na infraestrutura do {SITE_NAME} durante
              o fluxo de processamento:
            </p>
            <p className="pl-4 border-l-2 border-brand-200 text-ink">
              Upload → Processamento → Conversão/Otimização → Resultado → Download
            </p>
            <p>
              Arquivos temporários podem ser removidos automaticamente quando não forem mais
              necessários para o processamento.
            </p>
            <p>
              Recomendamos que o usuário mantenha uma cópia do arquivo original antes de
              realizar qualquer edição. O {SITE_NAME} não deve ser tratado como serviço
              permanente de armazenamento ou backup.
            </p>
          </SectionBlock>

          <SectionBlock id="limites" title="5. Formatos e limites" icon={AlertTriangle}>
            <p>As ferramentas do {SITE_NAME} podem possuir limites técnicos, incluindo:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tamanho máximo do arquivo</li>
              <li>Duração máxima (para vídeos e GIFs)</li>
              <li>Resolução máxima</li>
              <li>Quantidade de frames (GIFs)</li>
              <li>Quantidade de arquivos em processamento simultâneo ou em lote</li>
              <li>Formatos aceitos por cada ferramenta</li>
              <li>Quantidade de requisições por período</li>
              <li>Limites de CPU, RAM e outros recursos técnicos</li>
            </ul>
            <p>
              Esses limites podem ser ajustados conforme a plataforma evolui, sem aviso prévio
              individual, mas sempre buscando manter a qualidade e estabilidade do serviço.
            </p>
          </SectionBlock>

          <SectionBlock id="falhas" title="6. Falhas de processamento" icon={RefreshCw}>
            <p>Um processamento pode falhar por diversos motivos, incluindo:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Arquivo corrompido ou em formato incompatível</li>
              <li>Problema de conexão com a internet</li>
              <li>Limite de tamanho, resolução ou duração excedido</li>
              <li>Indisponibilidade temporária do serviço</li>
              <li>Erro interno no motor de processamento</li>
              <li>Falta de recurso (memória, processamento)</li>
              <li>Problema em serviço externo utilizado pelo {SITE_NAME}</li>
            </ul>
            <p>
              Quando houver falha, o sistema exibirá uma mensagem clara indicando o problema e,
              quando possível, permitirá nova tentativa. O {SITE_NAME} não deixará o usuário
              preso em carregamento infinito — toda operação terá um tempo limite definido.
            </p>
          </SectionBlock>

          <SectionBlock id="resultado" title="7. Resultado das edições" icon={Eye}>
            <p>
              Quando uma operação for concluída com sucesso, o resultado será disponibilizado
              para visualização e download, de acordo com as configurações escolhidas pelo usuário.
            </p>
            <p>
              Características como qualidade, tamanho, resolução, FPS, bitrate, duração ou número
              de cores podem sofrer alterações em relação ao arquivo original, dependendo do formato
              de saída e das configurações selecionadas. Isso é esperado e faz parte do processamento.
            </p>
          </SectionBlock>

          <SectionBlock id="creditos" title="8. Créditos" icon={CreditCard}>
            <p>
              Se o sistema de créditos estiver ativo no {SITE_NAME}, as seguintes regras se aplicam:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>O custo da operação será informado antes do processamento, quando aplicável</li>
              <li>Não é permitido manipular saldo de créditos de nenhuma forma</li>
              <li>Não é permitido explorar bugs ou falhas para obter créditos indevidos</li>
              <li>Não é permitido duplicar transações ou manipular o sistema de cobrança</li>
              <li>Créditos obtidos de forma irregular podem ser removidos sem aviso</li>
            </ul>
          </SectionBlock>

          <SectionBlock id="falha-creditos" title="9. Falha após consumo de créditos" icon={RefreshCw}>
            <p>
              O {SITE_NAME} busca evitar cobrança indevida quando uma operação falha sem
              entregar o resultado esperado.
            </p>
            <p>
              Quando houver desconto ou reserva de créditos e o erro for causado pelo sistema
              (e não pelo arquivo ou ação do usuário), o {SITE_NAME} permitirá correção ou
              restituição conforme o mecanismo utilizado pela plataforma.
            </p>
          </SectionBlock>

          <SectionBlock id="pagamentos" title="10. Pagamentos" icon={CreditCard}>
            <p>Se houver compra avulsa de créditos ou planos:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>O valor e a quantidade serão exibidos antes da confirmação</li>
              <li>Créditos serão adicionados somente após confirmação válida do pagamento pelo gateway</li>
              <li>A confirmação do pagamento nunca será baseada exclusivamente no frontend</li>
              <li>Pagamentos duplicados, cobranças incorretas e créditos não adicionados serão tratados pelo suporte</li>
            </ul>
          </SectionBlock>

          <SectionBlock id="reembolso" title="11. Cancelamento e reembolso" icon={RefreshCw}>
            <p>
              Pedidos de cancelamento ou reembolso serão tratados conforme a legislação aplicável
              (incluindo o Código de Defesa do Consumidor, quando cabível) e conforme a situação
              da operação.
            </p>
            <p>
              O {SITE_NAME} não possui cláusulas que retirem direitos obrigatórios do consumidor.
            </p>
          </SectionBlock>

          <SectionBlock id="privacidade" title="12. Privacidade e dados" icon={Lock}>
            <p>
              O {SITE_NAME} atualmente não possui sistema de criação de conta, login, senha ou
              autenticação de usuário. Os dados que podem existir incluem:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Arquivos enviados para processamento (temporários)</li>
              <li>Registros técnicos de requisições (logs)</li>
              <li>Informações necessárias para processamento de pagamento (quando aplicável)</li>
              <li>Informações técnicas do navegador e dispositivo, quando efetivamente utilizadas</li>
              <li>Logs de segurança e diagnóstico</li>
            </ul>
            <p>
              Dados armazenados localmente no navegador (como histórico, preferências e arquivos
              salvos) ficam exclusivamente no dispositivo do usuário e não são acessíveis pelo {SITE_NAME}.
            </p>
          </SectionBlock>

          <SectionBlock id="finalidade" title="13. Finalidade dos dados" icon={Eye}>
            <p>Os dados coletados ou processados podem ser utilizados para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Executar os processamentos solicitados pelo usuário</li>
              <li>Entregar os arquivos resultantes</li>
              <li>Controlar e gerenciar créditos (quando aplicável)</li>
              <li>Confirmar pagamentos junto ao gateway</li>
              <li>Melhorar a estabilidade e desempenho da plataforma</li>
              <li>Prevenir abuso, fraude e uso indevido</li>
              <li>Detectar e corrigir erros técnicos</li>
              <li>Fornecer suporte ao usuário</li>
              <li>Cumprir obrigações legais aplicáveis</li>
            </ul>
          </SectionBlock>

          <SectionBlock id="lgpd" title="14. LGPD — Lei Geral de Proteção de Dados" icon={ShieldCheck}>
            <p>
              Os dados pessoais eventualmente tratados pelo {SITE_NAME} serão geridos de acordo
              com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais legislações
              aplicáveis.
            </p>
            <p>Quando cabível, o usuário poderá solicitar:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos dados tratados</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade</li>
              <li>Informações sobre entidades com as quais dados foram compartilhados</li>
              <li>Revogação de consentimento, quando o tratamento for baseado nessa base legal</li>
            </ul>
            <p>
              Solicitações podem ser encaminhadas pelos canais de contato indicados na seção
              de Contato e suporte.
            </p>
          </SectionBlock>

          <SectionBlock id="seguranca" title="15. Segurança" icon={ShieldCheck}>
            <p>
              O {SITE_NAME} busca utilizar medidas técnicas e administrativas para proteger dados
              contra:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acesso não autorizado</li>
              <li>Alteração indevida</li>
              <li>Perda acidental ou intencional</li>
              <li>Destruição</li>
              <li>Vazamento</li>
              <li>Tratamento inadequado</li>
            </ul>
            <p>
              Nenhum sistema é 100% seguro. O {SITE_NAME} não promete segurança absoluta, mas
              se compromete a adotar práticas razoáveis de proteção.
            </p>
          </SectionBlock>

          <SectionBlock id="logs" title="16. Logs e prevenção de fraude" icon={Bug}>
            <p>
              O {SITE_NAME} pode manter registros técnicos necessários para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Segurança da plataforma</li>
              <li>Diagnóstico e correção de erros</li>
              <li>Investigação de abuso ou uso indevido</li>
              <li>Prevenção de fraude</li>
              <li>Estabilidade e desempenho</li>
              <li>Cumprimento de obrigações legais</li>
            </ul>
            <p>
              Informações sensíveis como senhas, tokens, API keys e chaves privadas nunca são
              registradas em logs comuns.
            </p>
          </SectionBlock>

          <SectionBlock id="cookies" title="17. Cookies e tecnologias semelhantes" icon={Cookie}>
            <p>
              O {SITE_NAME} pode utilizar cookies e tecnologias semelhantes (localStorage,
              sessionStorage, IndexedDB) para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Funcionamento técnico da plataforma</li>
              <li>Segurança e prevenção de abuso</li>
              <li>Armazenamento de preferências do usuário</li>
              <li>Métricas de uso e desempenho</li>
              <li>Melhoria da experiência de uso</li>
            </ul>
            <p>
              Controles de consentimento serão disponibilizados quando necessário, conforme a
              legislação aplicável.
            </p>
          </SectionBlock>

          <SectionBlock id="terceiros" title="18. Serviços de terceiros" icon={Globe}>
            <p>
              O {SITE_NAME} pode utilizar serviços externos para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hospedagem e infraestrutura (servidores, CDN)</li>
              <li>Banco de dados</li>
              <li>Processamento e distribuição de conteúdo</li>
              <li>Processamento de pagamentos</li>
              <li>Monitoramento e métricas</li>
              <li>Armazenamento temporário de arquivos</li>
            </ul>
            <p>
              Esses serviços possuem suas próprias políticas de privacidade e segurança.
            </p>
          </SectionBlock>

          <SectionBlock id="discord" title="19. Discord e integrações" icon={MessageSquare}>
            <p>
              Ao utilizar integrações do {SITE_NAME} com o Discord (bot, comandos, componentes),
              não é permitido:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Abusar de comandos ou funcionalidades do bot</li>
              <li>Enviar spam através de interações com o bot</li>
              <li>Explorar componentes ou funcionalidades de forma não intencional</li>
              <li>Reportar bugs falsos em massa de forma proposital</li>
              <li>Enviar sugestões repetidas propositalmente para sobrecarregar o sistema</li>
              <li>Tentar acessar funcionalidades administrativas sem autorização</li>
              <li>Explorar a API do bot para uso não autorizado</li>
              <li>Tentar descobrir tokens, chaves ou credenciais do serviço</li>
            </ul>
          </SectionBlock>

          <SectionBlock id="api" title="20. API" icon={Server}>
            <p>
              Caso o {SITE_NAME} disponibilize API (pública ou privada), não é permitido:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar endpoints privados sem autorização</li>
              <li>Ultrapassar rate limits propositalmente</li>
              <li>Compartilhar chaves de acesso privadas</li>
              <li>Explorar vulnerabilidades na API</li>
              <li>Utilizar a API para prejudicar o serviço ou outros usuários</li>
            </ul>
          </SectionBlock>

          <SectionBlock id="vulnerabilidades" title="21. Bugs e vulnerabilidades" icon={Bug}>
            <p>
              Caso encontre um bug ou vulnerabilidade no {SITE_NAME}, pedimos que reporte à equipe
              pelos canais de contato oficiais.
            </p>
            <p>Não é permitido utilizar vulnerabilidades para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Obter créditos ou benefícios indevidos</li>
              <li>Coletar dados de outros usuários</li>
              <li>Prejudicar o serviço ou seus usuários</li>
              <li>Derrubar ou desestabilizar servidores</li>
              <li>Obter qualquer tipo de vantagem indevida</li>
              <li>Divulgar informações privadas do serviço ou de terceiros</li>
            </ul>
          </SectionBlock>

          <SectionBlock id="restricao" title="22. Restrição de acesso" icon={Ban}>
            <p>
              O {SITE_NAME} pode limitar ou bloquear o acesso de um usuário em casos de:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fraude ou tentativa de fraude</li>
              <li>Ataques técnicos contra a plataforma</li>
              <li>Exploração de vulnerabilidades</li>
              <li>Manipulação de créditos ou sistema de cobrança</li>
              <li>Abuso de recursos (requisições excessivas, uso automatizado não autorizado)</li>
              <li>Tentativa de invasão ou acesso não autorizado</li>
              <li>Atividades ilegais realizadas através da plataforma</li>
              <li>Violação repetida destas regras</li>
            </ul>
            <p>
              A restrição pode ser temporária ou permanente, dependendo da gravidade da violação.
            </p>
          </SectionBlock>

          <SectionBlock id="propriedade" title="23. Propriedade intelectual" icon={Gavel}>
            <p>
              O nome, identidade visual, interface, código-fonte e demais elementos próprios do
              {" "}{SITE_NAME} pertencem aos seus respectivos titulares e não podem ser copiados,
              vendidos, redistribuídos ou utilizados sem autorização, salvo nas hipóteses
              permitidas por lei.
            </p>
            <p>
              Os direitos que o usuário possui sobre seus próprios arquivos continuam pertencendo
              ao usuário ou aos respectivos titulares. O {SITE_NAME} não reivindica nenhum
              direito sobre o conteúdo enviado para processamento.
            </p>
          </SectionBlock>

          <SectionBlock id="disponibilidade" title="24. Disponibilidade" icon={Clock}>
            <p>O {SITE_NAME} pode passar por:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manutenções programadas ou emergenciais</li>
              <li>Atualizações de funcionalidades e correções</li>
              <li>Instabilidades temporárias</li>
              <li>Falhas de infraestrutura</li>
              <li>Problemas de rede ou conectividade</li>
              <li>Interrupção ou alteração de fornecedores externos</li>
            </ul>
            <p>
              O {SITE_NAME} não garante disponibilidade de 100% e não se responsabiliza por
              perdas decorrentes de indisponibilidade temporária do serviço.
            </p>
          </SectionBlock>

          <SectionBlock id="alteracoes" title="25. Alterações nas regras" icon={Pencil}>
            <p>
              Estas regras podem ser atualizadas quando houver:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Novas funcionalidades adicionadas à plataforma</li>
              <li>Alterações técnicas relevantes</li>
              <li>Mudanças de segurança</li>
              <li>Mudanças comerciais (créditos, planos, pagamentos)</li>
              <li>Exigências legais ou regulatórias</li>
            </ul>
            <p>
              A data da última atualização será sempre mantida visível no topo desta página.
              O uso contínuo do serviço após alterações implica concordância com a versão vigente.
            </p>
          </SectionBlock>

          <SectionBlock id="criancas" title="26. Crianças e adolescentes" icon={Baby}>
            <p>
              Quando houver tratamento de dados pessoais de crianças ou adolescentes, serão
              observadas as regras específicas aplicáveis, incluindo as disposições do Estatuto
              da Criança e do Adolescente (ECA) e da LGPD referentes a esse público.
            </p>
          </SectionBlock>

          <SectionBlock id="contato" title="27. Contato e suporte" icon={Mail}>
            <p>
              Para questões relacionadas a créditos, pagamentos, privacidade, segurança, bugs,
              solicitações sobre dados pessoais ou denúncias, entre em contato através de:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-ink">Site oficial:</strong> gifediton.com.br</li>
              <li><strong className="text-ink">Discord oficial:</strong>{" "}
                <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="text-brand-500 underline hover:text-brand-600">
                  Servidor do GifEdition
                </a>
              </li>
            </ul>
          </SectionBlock>

          <SectionBlock id="aceitacao" title="28. Aceitação" icon={ShieldCheck}>
            <p className="text-ink font-medium">
              Ao utilizar o {SITE_NAME}, você declara que teve acesso a estas regras e concorda
              em utilizar a plataforma de acordo com elas.
            </p>
          </SectionBlock>

        </div>
      </div>
    </div>
  );
}
