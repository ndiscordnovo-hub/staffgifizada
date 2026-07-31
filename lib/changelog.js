// Histórico de versões mostrado na página /atualizacoes.
// Mantido em sincronia com CHANGELOG.md (usado pelo notify-update).
export const CHANGELOG = [
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
