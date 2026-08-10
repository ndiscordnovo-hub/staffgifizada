// IndexedDB-backed library of SAVED media (the real files, not just metadata).
// Blobs are stored directly so items can be re-opened in the editor or
// re-downloaded later. Everything stays in the user's browser.
"use client";

const DB_NAME = "nebula-studio";
const STORE = "saved";
const VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB indisponível"));
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id" });
        os.createIndex("createdAt", "createdAt");
        os.createIndex("kind", "kind");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// kind: "image" | "gif" | "video" | "audio"
export async function saveMedia({ name, kind, type, blob, w = null, h = null }) {
  const db = await openDB();
  const record = {
    id: uid(),
    name,
    kind,
    type: type || blob.type || "application/octet-stream",
    blob,
    w,
    h,
    size: blob.size,
    createdAt: Date.now(),
  };
  await new Promise((resolve, reject) => {
    const r = tx(db, "readwrite").put(record);
    r.onsuccess = resolve;
    r.onerror = () => reject(r.error);
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nebula:saved"));
  return record;
}

export async function getAllSaved() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = tx(db, "readonly").getAll();
    r.onsuccess = () => resolve((r.result || []).sort((a, b) => b.createdAt - a.createdAt));
    r.onerror = () => reject(r.error);
  });
}

export async function deleteSaved(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const r = tx(db, "readwrite").delete(id);
    r.onsuccess = resolve;
    r.onerror = () => reject(r.error);
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nebula:saved"));
}

export async function clearSaved() {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const r = tx(db, "readwrite").clear();
    r.onsuccess = resolve;
    r.onerror = () => reject(r.error);
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nebula:saved"));
}
