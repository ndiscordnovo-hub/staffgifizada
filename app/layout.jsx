import "./globals.css";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { MediaProvider } from "@/components/MediaContext";
import Toaster from "@/components/Toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata = {
  title: "Nebula Studio — Editor de mídia para Discord",
  description:
    "Editor gratuito e premium de imagens, GIFs e vídeos para criadores do Discord. Processamento 100% no navegador.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <MediaProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 lg:pl-0">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </MediaProvider>
      </body>
    </html>
  );
}
