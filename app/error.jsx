"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-ink mb-2">Algo deu errado</h1>
      <p className="text-muted max-w-md mb-2">
        Ocorreu um erro inesperado. Tente novamente ou volte para o inicio.
      </p>
      <p className="text-xs text-subtle mb-6 max-w-md break-all">{error?.message}</p>
      <button onClick={reset} className="btn-primary">
        <RefreshCw className="h-4 w-4" /> Tentar novamente
      </button>
    </div>
  );
}
