import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
import { MessagesSquare, Rocket } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { MediaProvider } from "@/components/MediaContext";
import Toaster from "@/components/Toaster";
import ConsentGate from "@/components/ConsentGate";
import { DISCORD_INVITE, SITE_VERSION } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata = {
  metadataBase: new URL("https://gifediton.com.br"),
  title: { default: "Gif Edition — Editor de mídia para Discord", template: "%s | Gif Edition" },
  description:
    "Editor gratuito de imagens, GIFs e vídeos para criadores do Discord. Processamento 100% no navegador, sem upload.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Gif Edition — Editor de mídia para Discord",
    description: "Edite imagens, GIFs e vídeos direto no navegador. Grátis, privado, sem marca d'água.",
    siteName: "Gif Edition",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gif Edition — Editor de mídia para Discord",
    description: "Edite imagens, GIFs e vídeos direto no navegador. Grátis e 100% privado.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <MediaProvider>
          {/* Atualizações + Discord — canto superior direito (desktop) */}
          <div className="hidden lg:flex fixed top-4 right-6 z-40 items-center gap-2">
            <Link
              href="/atualizacoes"
              className="flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm font-bold text-ink shadow-card-sm border border-line hover:border-brand-400/60 hover:-translate-y-0.5 transition-all"
            >
              <Rocket className="h-4 w-4 text-brand-500" />
              Atualizações
            </Link>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm font-bold text-ink shadow-card-sm border border-brand-100 hover:border-brand-400/70 hover:-translate-y-0.5 transition-all"
            >
              <MessagesSquare className="h-4 w-4 text-brand-500" />
              Discord
            </a>
          </div>
          <div className="flex flex-col lg:flex-row min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 lg:pl-0 flex flex-col">
              <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:pb-8 lg:pt-20 flex-1">
                {children}
              </div>
              <footer className="mt-8 border-t border-line">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
                  <span>© {new Date().getFullYear()} Gif Edition · v{SITE_VERSION} · feito para a comunidade do Discord</span>
                  <div className="flex items-center gap-4">
                    <Link href="/regras" className="hover:text-ink transition-colors">Regras e Privacidade</Link>
                    <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-600 transition-colors">Discord</a>
                  </div>
                </div>
              </footer>
            </main>
          </div>
          <Toaster />
          <ConsentGate />
        </MediaProvider>
      </body>
    </html>
  );
}
