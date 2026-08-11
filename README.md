# Gif Edition

Editor **gratuito** de imagens, GIFs e vídeos para criadores do Discord.
Todo o processamento acontece **no seu navegador** — nada é enviado a servidores.

## Recursos

- **Editor de imagens** — girar, espelhar, cortar, redimensionar, brilho, contraste, saturação, nitidez, desfoque, fundo, conversão e compressão.
- **Editor de GIF** — vídeo para GIF, FPS, velocidade, escala, cores/qualidade, inverter, loop.
- **Editor de vídeo** — cortar, redimensionar, girar, comprimir, FPS, extrair/remover áudio, converter.
- **Otimização Inteligente** — modos de qualidade e alvos prontos para os limites do Discord (8/10/25 MB e Nitro).
- **Conversor universal** — PNG, JPG, WEBP, GIF, MP4, WEBM, MP3.
- **Processamento em lote** — dezenas de imagens de uma vez, download individual ou ZIP.
- **Projetos** — salve e retome edições com todos os ajustes preservados.
- **Parceria** — programa de parceria para criadores e empresas.

## Stack

- **Next.js 14** (App Router) + **React 18**
- **Tailwind CSS** + **Framer Motion**
- **Canvas API** para imagens · **FFmpeg.wasm** para GIF/vídeo
- **lucide-react** para ícones

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## Deploy (Square Cloud)

1. `npm run build` (gera `.next/standalone`)
2. Monte o ZIP com: `.next/standalone/`, `.next/static/`, `public/`, `main_file.js`, `squarecloud.app`, `package.json`
3. Faça upload no painel da Square Cloud

> A primeira operação de GIF/vídeo baixa o FFmpeg (~30 MB) uma única vez via CDN.
