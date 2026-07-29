import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { MediaProvider } from "@/components/MediaContext";
import Toaster from "@/components/Toaster";
import ConsentGate from "@/components/ConsentGate";
import { DISCORD_INVITE } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata = {
  title: "Nebula Studio — Editor de mídia para Discord",
  description:
    "Editor gratuito e premium de imagens, GIFs e vídeos para criadores do Discord. Processamento 100% no navegador.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <MediaProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 lg:pl-0 flex flex-col">
              <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8 flex-1">
                {children}
              </div>
              <footer className="mt-8 border-t border-white/10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
                  <span>© {new Date().getFullYear()} Nebula Studio · feito para a comunidade do Discord</span>
                  <div className="flex items-center gap-4">
                    <Link href="/termos" className="hover:text-white/80 transition-colors">Termos</Link>
                    <Link href="/privacidade" className="hover:text-white/80 transition-colors">Privacidade</Link>
                    <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-brand-200 transition-colors">Discord</a>
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
