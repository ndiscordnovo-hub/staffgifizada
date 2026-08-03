# Changelog — Gif Edition

Toda atualização com 5+ mudanças é anunciada no canal de **Atualizações** do Discord
(via `scripts/notify-update.mjs`, que envia o bloco mais recente daqui).

## [1.2.0] - 2026-08-02

### Adicionado
- Nova página de **Templates**: modelos prontos nos tamanhos certos (Banner, Avatar, Story, YouTube…) que abrem direto no editor.
- **Modo Arquivo Único × Em Lote** ao entrar nos editores de imagem, GIF e vídeo.

### Melhorias
- **Menu lateral reorganizado**: categorias em grupos recolhíveis, campo de busca e favoritos com estrela.
- **Painel Admin** agora protegido por **senha** (verificada no servidor, nunca exposta no site).
- Grupo **Sistema** (Atualizações + Configurações) sempre visível.

### Correções
- **Layout do celular** corrigido de vez (conteúdo não fica mais espremido na lateral).

## [1.1.0] - 2026-07-31

### Adicionado
- Sistema de **Logs por Webhook do Discord** (backend serverless seguro).
- **Painel Admin** (`/admin`) com status por categoria, teste e instruções.
- **Remover fundo** por cor e por **IA** (roda no navegador).
- **Marca d'água/Texto**, **Preto & Branco**, **filtros rápidos** e **tamanho personalizado** no editor de imagem.
- **QR Code** com logo no centro (opcional) e paletas de cor.

### Melhorias
- **Segurança reforçada**: CSP, HSTS, X-Frame-Options e afins.
- Divulgação do **Discord** em vários cantos do site.

### Correções
- **Layout do celular** corrigido (conteúdo não fica mais espremido).
- Barra de abas do editor sem cortar opções.
- Presets de tamanho duplicados removidos.
