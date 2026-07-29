"use client";
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { logEvent } from "@/lib/logger";

const MediaCtx = createContext(null);

export function MediaProvider({ children }) {
  // The file currently being handed from the dropzone to an editor.
  const [media, setMediaState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const setMedia = useCallback((file) => {
    if (!file) {
      setMediaState(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setMediaState({
      file,
      url,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  }, []);

  const toast = useCallback((message, kind = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, kind }]);
    logEvent(kind, message); // mirror every toast into the terminal
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3600);
  }, []);

  // Capture uncaught errors so they always surface in the Logs terminal.
  useEffect(() => {
    const onErr = (e) => logEvent("error", e?.message || "Erro desconhecido");
    const onRej = (e) => logEvent("error", `Promise rejeitada: ${e?.reason?.message || e?.reason || "desconhecido"}`);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    logEvent("info", "Sessão iniciada — pronto para processar mídia.");
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  return (
    <MediaCtx.Provider value={{ media, setMedia, toasts, toast }}>
      {children}
    </MediaCtx.Provider>
  );
}

export function useMedia() {
  const ctx = useContext(MediaCtx);
  if (!ctx) throw new Error("useMedia must be used within MediaProvider");
  return ctx;
}
