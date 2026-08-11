// Histórico de versões mostrado na página /atualizacoes.
// Mantido em sincronia com CHANGELOG.md (usado pelo notify-update).
export const CHANGELOG = [
  {
    version: "2.1.0",
    date: "11/08/2026",
    added: [
      "Logs do Discord totalmente reformulados — embeds bonitos com localização, dispositivo, navegador, tela, idioma e sessão",
      "Contexto completo em cada log: referrer, resolução de tela, contador de visitas",
    ],
    improved: [
      "Processamento simplificado — sem overlay travando, agora usa toast direto de sucesso/erro",
      "FFmpeg com timeout de 5 minutos e validação de arquivo de saída",
      "Rate limit de segurança com alerta automático no Discord",
    ],
    fixed: [
      "Processamento que ficava travado infinitamente nos editores de GIF, vídeo, converter, otimizar e emoji",
      "Overlay de processamento removido (causava bugs e travamentos)",
    ],
  },
  {
    version: "2.0.0",
    date: "10/08/2026",
    added: [
      "Página de Parceria com sidebar, cards de benefícios e estatísticas",
      "Sistema de Projetos — salve e retome edições a qualquer momento",
      "Fila de processamento com estados visuais",
      "Editor de GIF v2: rotação, flip horizontal/vertical, trim, dimensão customizada",
      "Recorte (crop) no editor de GIF e Vídeo, aplicado em todos os frames",
      "Botão 'Baixar quadro (PNG)' no editor de GIF/Vídeo",
      "Ajustes de cor no editor de GIF (brilho, contraste, saturação)",
    ],
    improved: [
      "Deploy na Square Cloud com rebuild automático por versão",
      "Memória aumentada para 2048 MB no servidor",
      "Editor de lote agora é um modo dentro do editor de imagem",
      "Tela de processamento animada com progresso real",
      "Segurança reforçada: validação de upload, CSP, metadata, SEO",
    ],
    fixed: [
      "Batch processing: correções massivas de bugs",
      "Landing page: ajustes de tema e cores (vermelho + escuro)",
    ],
  },
  {
    version: "1.2.0",
    date: "02/08/2026",
    added: [
      "Página de Templates com modelos prontos nos tamanhos certos",
      "Modo Arquivo Único × Em Lote ao entrar nos editores",
    ],
    improved: [
      "Menu lateral reorganizado: grupos recolhíveis, busca e favoritos",
      "Painel Admin agora protegido por senha (verificada no servidor)",
      "Grupo Sistema (Atualizações + Configurações) sempre visível",
    ],
    fixed: [
      "Layout do celular corrigido (conteúdo não fica mais espremido)",
    ],
  },
  {
    version: "1.1.0",
    date: "31/07/2026",
    added: [
      "Sistema de Logs por Webhook do Discord",
      "Painel Admin (/admin) com testes e status",
      "Remover fundo por cor e por IA",
      "Marca d'água/Texto, Preto & Branco, filtros e tamanho personalizado",
      "QR Code com logo no centro e paletas de cor",
    ],
    improved: [
      "Segurança reforçada (CSP, HSTS, X-Frame-Options)",
      "Divulgação do Discord em vários cantos",
    ],
    fixed: [
      "Layout do celular corrigido",
      "Barra de abas do editor sem cortar opções",
      "Presets de tamanho duplicados removidos",
    ],
  },
];
