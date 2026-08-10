import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200">
        <Search className="h-10 w-10 text-brand-500" />
      </div>
      <h1 className="text-3xl font-bold text-ink mb-2">Pagina nao encontrada</h1>
      <p className="text-muted max-w-md mb-6">
        A pagina que voce procura nao existe ou foi movida. Volte para o inicio e tente novamente.
      </p>
      <Link href="/" className="btn-primary">
        <Home className="h-4 w-4" /> Voltar ao inicio
      </Link>
    </div>
  );
}
