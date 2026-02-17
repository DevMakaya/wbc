import { supabase, hasSupabase } from "./supabase";

const DB_NAME = "wbc_files";
const STORE_NAME = "documents";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadFile(docId, dealId, folder, file) {
  if (hasSupabase) {
    const path = `${dealId}/${folder}/${file.name}`;
    const { error } = await supabase.storage
      .from("deal-documents")
      .upload(path, file, { upsert: true });
    if (!error) return path;
  }
  const db = await openDB();
  const buffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      id: docId,
      data: buffer,
      type: file.type,
      name: file.name,
    });
    tx.oncomplete = () => resolve(`local://${docId}`);
    tx.onerror = () => reject(tx.error);
  });
}

export async function downloadFile(doc) {
  if (hasSupabase && doc.storage_path && !doc.storage_path.startsWith("local://")) {
    const { data, error } = await supabase.storage
      .from("deal-documents")
      .download(doc.storage_path);
    if (!error && data) {
      triggerDownload(data, doc.filename);
      return;
    }
  }
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(doc.id);
    req.onsuccess = () => {
      if (req.result) {
        const blob = new Blob([req.result.data], {
          type: req.result.type || doc.file_type,
        });
        triggerDownload(blob, doc.filename);
      }
      resolve();
    };
  });
}

export async function deleteFile(doc) {
  if (hasSupabase && doc.storage_path && !doc.storage_path.startsWith("local://")) {
    await supabase.storage.from("deal-documents").remove([doc.storage_path]);
    return;
  }
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(doc.id);
    tx.oncomplete = () => resolve();
  });
}
