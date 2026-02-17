import { useState, useEffect, useRef } from "react";
import { Upload, FolderOpen, Download, Trash2, File } from "lucide-react";
import { getDocuments, saveDocumentMeta, deleteDocumentMeta } from "../lib/dataService";
import { uploadFile, downloadFile, deleteFile } from "../lib/documentStorage";
import { trackEvent } from "../lib/tracker";

const FOLDERS = [
  "Closing Documents",
  "Monthly Reporting",
  "Due Diligence",
  "Correspondence",
  "Other",
];

export default function DocumentUpload({ dealId }) {
  const [activeFolder, setActiveFolder] = useState(FOLDERS[0]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => {
    getDocuments(dealId).then((docs) => {
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
      const storagePath = await uploadFile(saved.id, dealId, activeFolder, file);
      saved.storage_path = storagePath;
      trackEvent("document_upload", { entity_type: "deal", entity_id: Number(dealId) });
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

  const formatSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-navy-900 border border-navy-800 rounded-xl p-1 overflow-x-auto">
        {FOLDERS.map((folder) => {
          const count = documents.filter((d) => d.folder === folder).length;
          return (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeFolder === folder
                  ? "bg-navy-800 text-gold-400"
                  : "text-navy-400 hover:text-white"
              }`}
            >
              <FolderOpen size={14} className="inline mr-1.5 -mt-0.5" />
              {folder}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-navy-700 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
          dragOver
            ? "border-gold-400 bg-gold-500/5"
            : "border-navy-700 hover:border-navy-600"
        }`}
      >
        <Upload size={32} className="mx-auto mb-3 text-navy-500" />
        <p className="text-navy-300 text-sm">
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </p>
        <p className="text-navy-600 text-xs mt-1">
          Files will be saved to &ldquo;{activeFolder}&rdquo;
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files.length) handleUpload([...e.target.files]);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-400" />
        </div>
      ) : currentDocs.length === 0 ? (
        <div className="text-navy-500 text-sm text-center py-8">
          No documents in this folder
        </div>
      ) : (
        <div className="space-y-2">
          {currentDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 bg-navy-900 border border-navy-800 rounded-xl px-4 py-3"
            >
              <File size={20} className="text-navy-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{doc.filename}</p>
                <p className="text-navy-500 text-xs">
                  {formatSize(doc.file_size)} &middot; {doc.uploaded_by} &middot;{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { downloadFile(doc); trackEvent("document_view", { entity_type: "deal", entity_id: Number(dealId) }); }}
                  className="p-2 rounded-lg hover:bg-navy-800 text-navy-400 hover:text-white transition-colors cursor-pointer"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2 rounded-lg hover:bg-red-900/30 text-navy-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
