# Nebula Studio 🌌

Editor **gratuito e premium** de imagens, GIFs e vídeos para criadores do Discord.
Inspirado no EZGIF, com identidade própria — e **todo o processamento acontece no seu navegador** (nada é enviado a servidores).

## ✨ Recursos

- **Editor de imagens** — girar, espelhar, cortar (com overlay interativo), redimensionar, brilho, contraste, saturação, nitidez, desfoque, fundo (branco/preto/transparente/desfocado), conversão de formato e compressão — tudo com pré-visualização em tempo real.
- **Editor de GIF** — vídeo ⇄ GIF, FPS, velocidade, escala, cores/qualidade, inverter, loop.
- **Editor de vídeo** — cortar, redimensionar, girar, comprimir (CRF), FPS, extrair/remover áudio, converter para MP4/WEBM/GIF.
- **Otimização Inteligente** — modos de qualidade e alvos prontos para os limites do Discord (8/10/25 MB e Nitro), com busca binária de qualidade.
- **Conversor universal** — PNG · JPG · WEBP · GIF · MP4 · WEBM · MP3.
- **Processamento em lote** — dezenas de imagens de uma vez, download individual ou **ZIP**.
- **Histórico & favoritos** — salvos localmente.
- **Presets** — Avatar 512×512, Banner Discord 600×240, Instagram, YouTube, TikTok, etc.

## 🧱 Stack

- **Next.js 14** (App Router) + **React 18**
- **Tailwind CSS** + **Framer Motion** (tema escuro, glassmorphism, animações)
- **Canvas API** para imagens · **FFmpeg.wasm** para GIF/vídeo (carregado sob demanda)
- **lucide-react** para ícones

## 🚀 Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## ☁️ Publicando (grátis)

Como é 100% client-side, hospeda em qualquer lugar:

- **Vercel** — importe o repositório em vercel.com → deploy automático (zero config).
- **Netlify** — build `npm run build`, publish `.next` (com o plugin Next.js) ou use o preset da Netlify.

> A primeira operação de GIF/vídeo baixa o núcleo do FFmpeg (~30 MB) uma única vez via CDN.
