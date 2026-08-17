"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PrivacidadeRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/regras"); }, [router]);
  return <p className="text-sm text-muted p-6">Redirecionando para Regras, Termos e Privacidade…</p>;
}
