import { useState, useEffect, useRef } from "react";
import { Upload, FolderOpen, Download, Trash2, File, Plus, X } from "lucide-react";
import { getDocuments, saveDocumentMeta, deleteDocumentMeta, getDealFolders, createDealFolder, deleteDealFolder } from "../lib/dataService";
import { uploadFile, downloadFile, deleteFile } from "../lib/documentStorage";
import { trackEvent } from "../lib/tracker";

export default function DocumentUpload({ dealId }) {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef(null);
  const role = localStorage.getItem("wbc_user_role");
  const canManage = role === "admin" || role === "manager";

  const load = () => {
    Promise.all([getDealFolders(dealId), getDocuments(dealId)]).then(([f, docs]) => {
      setFolders(f);
      if (!activeFolder && f.length) setActiveFolder(f[0].name);
      setDocuments(docs);
      setLoading(false);
    });
  };

  useEffect(load, [dealId]);

  const currentDocs = documents.filter((d) => d.folder === activeFolder);
  const user = localStorage.getItem("wbc_user") || "Unknown";

  const handleUpload = async (files) => {
    setUploading(true);
    for (const file of files) {
      const meta = {
        deal_id: Number(dealId),
        folder: activeFolder,
        filename: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        uploaded_by: user,
        uploaded_at: new Date().toISOString(),
      };
      const saved = await saveDocumentMeta(meta);
      await uploadFile(saved.id, dealId, activeFolder, file);
      trackEvent("document_upload", { entity_type: "deal", entity_id: Number(dealId), doc_id: saved.id, doc_name: file.name });
    }
    setUploading(false);
    load();
  };

  const handleDelete = async (doc) => {
    await deleteFile(doc);
    await deleteDocumentMeta(doc.id);
    load();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleUpload([...e.dataTransfer.files]);
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    await createDealFolder(dealId, newFolderName.trim());
    setNewFolderName("");
    setAddingFolder(false);
    load();
  };

  const handleDeleteFolder = async (folder) => {
    const docsInFolder = documents.filter((d) => d.folder === folder.name);
    if (docsInFolder.length) return alert("Cannot delete a folder that contains documents");
    await deleteDealFolder(folder.id);
    if (activeFolder === folder.name && folders.length > 1) setActiveFolder(folders.find((f) => f.id !== folder.id)?.name || "");
    load();
  };

  const formatSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-navy-900 border border-navy-800 rounded-xl p-1 overflow-x-auto items-center">
        {folders.map((folder) => {
          const count = documents.filter((d) => d.folder === folder.name).length;
          return (
            <div key={folder.id} className="flex items-center group">
              <button
                onClick={() => setActiveFolder(folder.name)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeFolder === folder.name
                    ? "bg-navy-800 text-gold-400"
                    : "text-navy-400 hover:text-white"
                }`}
              >
                <FolderOpen size={14} className="inline mr-1.5 -mt-0.5" />
                {folder.name}
                {count > 0 && (
                  <span className="ml-1.5 text-xs bg-navy-700 px-1.5 py-0.5 rounded-full">{count}</span>
                )}
              </button>
              {canManage && count === 0 && (
                <button onClick={() => handleDeleteFolder(folder)} className="opacity-0 group-hover:opacity-100 p-0.5 text-navy-600 hover:text-red-400 cursor-pointer transition-opacity" title="Delete folder">
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
        {canManage && (
          addingFolder ? (
            <div className="flex items-center gap-1 px-2">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddFolder(); if (e.key === "Escape") setAddingFolder(false); }}
                placeholder="Folder name"
                className="px-2 py-1 rounded bg-navy-950 border border-navy-700 text-white text-xs w-32 focus:outline-none focus:ring-1 focus:ring-gold-500"
                autoFocus
              />
              <button onClick={handleAddFolder} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Plus size={14} /></button>
              <button onClick={() => setAddingFolder(false)} className="text-navy-400 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setAddingFolder(true)} className="px-2 py-2 text-navy-500 hover:text-gold-400 cursor-pointer" title="Add folder">
              <Plus size={16} />
            </button>
          )
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
          dragOver ? "border-gold-400 bg-gold-500/5" : "border-navy-700 hover:border-navy-600"
        }`}
      >
        <Upload size={32} className="mx-auto mb-3 text-navy-500" />
        <p className="text-navy-300 text-sm">{uploading ? "Uploading..." : "Drop files here or click to upload"}</p>
        <p className="text-navy-600 text-xs mt-1">Files will be saved to &ldquo;{activeFolder}&rdquo;</p>
        <input ref={fileInputRef} type="file" multiple onChange={(e) => { if (e.target.files.length) handleUpload([...e.target.files]); e.target.value = ""; }} className="hidden" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-400" />
        </div>
      ) : currentDocs.length === 0 ? (
        <div className="text-navy-500 text-sm text-center py-8">No documents in this folder</div>
      ) : (
        <div className="space-y-2">
          {currentDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 bg-navy-900 border border-navy-800 rounded-xl px-4 py-3">
              <File size={20} className="text-navy-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{doc.filename}</p>
                <p className="text-navy-500 text-xs">
                  {formatSize(doc.file_size)} &middot; {doc.uploaded_by} &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { downloadFile(doc); trackEvent("document_view", { entity_type: "deal", entity_id: Number(dealId), doc_id: doc.id, doc_name: doc.filename }); }}
                  className="p-2 rounded-lg hover:bg-navy-800 text-navy-400 hover:text-white transition-colors cursor-pointer"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                {canManage && (
                  <button onClick={() => handleDelete(doc)} className="p-2 rounded-lg hover:bg-red-900/30 text-navy-400 hover:text-red-400 transition-colors cursor-pointer" title="Delete">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
