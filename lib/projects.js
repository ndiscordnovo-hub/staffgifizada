"use client";

const DB_NAME = "nebula-studio";
const STORE = "projects";
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB indisponível"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains("saved")) {
        const os = db.createObjectStore("saved", { keyPath: "id" });
        os.createIndex("createdAt", "createdAt");
        os.createIndex("kind", "kind");
      }
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id" });
        os.createIndex("updatedAt", "updatedAt");
        os.createIndex("editor", "editor");
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

export async function saveProject({ name, editor, file, opts, thumbnail }) {
  const db = await openDB();
  const record = {
    id: uid(),
    name,
    editor,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    blob: file,
    opts: JSON.parse(JSON.stringify(opts)),
    thumbnail,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await new Promise((resolve, reject) => {
    const r = tx(db, "readwrite").put(record);
    r.onsuccess = resolve;
    r.onerror = () => reject(r.error);
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nebula:projects"));
  return record;
}

export async function updateProject(id, updates) {
  const db = await openDB();
  const existing = await new Promise((resolve, reject) => {
    const r = tx(db, "readonly").get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: Date.now() };
  if (updates.opts) updated.opts = JSON.parse(JSON.stringify(updates.opts));
  await new Promise((resolve, reject) => {
    const r = tx(db, "readwrite").put(updated);
    r.onsuccess = resolve;
    r.onerror = () => reject(r.error);
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nebula:projects"));
  return updated;
}

export async function getAllProjects() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = tx(db, "readonly").getAll();
    r.onsuccess = () => resolve((r.result || []).sort((a, b) => b.updatedAt - a.updatedAt));
    r.onerror = () => reject(r.error);
  });
}

export async function getProject(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = tx(db, "readonly").get(id);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}

export async function deleteProject(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const r = tx(db, "readwrite").delete(id);
    r.onsuccess = resolve;
    r.onerror = () => reject(r.error);
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nebula:projects"));
}

export async function clearProjects() {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const r = tx(db, "readwrite").clear();
    r.onsuccess = resolve;
    r.onerror = () => reject(r.error);
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nebula:projects"));
}

export const EDITOR_LABELS = {
  image: "Imagens",
  gif: "GIF",
  video: "Vídeos",
};

export const EDITOR_ROUTES = {
  image: "/image",
  gif: "/gif",
  video: "/video",
};
