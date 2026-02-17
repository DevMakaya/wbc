import { useState, useCallback } from "react";
import { Upload as UploadIcon, Download, FileUp, Check, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { LENDER_COL_MAP, PIPELINE_COL_MAP, INT_FIELDS, FLOAT_FIELDS } from "../data/seed";
import { upsertLenders, upsertPipeline } from "../lib/dataService";

const LENDER_HEADERS = Object.keys(LENDER_COL_MAP).filter((k) => k !== "#");
const PIPELINE_HEADERS = Object.keys(PIPELINE_COL_MAP).filter((k) => k !== "#");

function generateVerticalTemplate(headers, slots = 5) {
  const rows = [["Field", ...Array.from({ length: slots }, (_, i) => `Record ${i + 1}`)]];
  for (const h of headers) {
    rows.push([h, ...Array(slots).fill("")]);
  }
  return rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n") + "\n";
}

function transposeCSV(text) {
  const { data } = Papa.parse(text, { header: false, skipEmptyLines: true });
  if (!data.length) return [];

  const fieldCol = data.map((row) => (row[0] || "").trim());
  const recordCount = data[0].length - 1;
  if (recordCount < 1) return [];

  const records = [];
  for (let r = 1; r <= recordCount; r++) {
    const obj = {};
    let hasData = false;
    for (let f = 0; f < data.length; f++) {
      const key = fieldCol[f];
      const val = (data[f][r] || "").trim();
      if (key && key !== "Field") {
        obj[key] = val;
        if (val) hasData = true;
      }
    }
    if (hasData) records.push(obj);
  }
  return records;
}

function mapTransposedRows(records, colMap) {
  const intFields = INT_FIELDS;
  const floatFields = FLOAT_FIELDS;

  return records.map((row, i) => {
    const mapped = { id: i + 1 };
    for (const [csvCol, dbCol] of Object.entries(colMap)) {
      if (csvCol === "#") continue;
      const val = row[csvCol];
      if (val === undefined || val === null || val === "") {
        mapped[dbCol] = intFields.has(dbCol) ? 0 : floatFields.has(dbCol) ? null : "";
      } else if (intFields.has(dbCol)) {
        mapped[dbCol] = parseInt(val, 10) || 0;
      } else if (floatFields.has(dbCol)) {
        mapped[dbCol] = parseFloat(val) || null;
      } else {
        mapped[dbCol] = String(val).trim();
      }
    }
    return mapped;
  });
}

function isVerticalFormat(text) {
  const { data } = Papa.parse(text, { header: false, skipEmptyLines: true });
  if (!data.length || data.length < 2) return false;
  const firstCol = data.map((r) => (r[0] || "").trim()).filter(Boolean);
  const knownFields = [...LENDER_HEADERS, ...PIPELINE_HEADERS, "Field"];
  const matchCount = firstCol.filter((f) => knownFields.includes(f)).length;
  return matchCount >= 3;
}

function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Upload() {
  const [mode, setMode] = useState("lenders");
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const colMap = mode === "lenders" ? LENDER_COL_MAP : PIPELINE_COL_MAP;

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      setStatus(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        try {
          let rows;
          if (isVerticalFormat(text)) {
            const records = transposeCSV(text);
            rows = mapTransposedRows(records, colMap);
          } else {
            const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
            rows = mapTransposedRows(data, colMap);
          }
          if (!rows.length) {
            setStatus({ type: "error", message: "No valid records found in file" });
            return;
          }
          setPreview(rows);
        } catch (err) {
          setStatus({ type: "error", message: err.message });
        }
      };
      reader.readAsText(file);
    },
    [mode, colMap]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!preview) return;
    try {
      if (mode === "lenders") {
        await upsertLenders(preview);
      } else {
        await upsertPipeline(preview);
      }
      setStatus({ type: "success", message: `${preview.length} records imported successfully` });
      setPreview(null);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  const previewKeys = preview
    ? Object.keys(preview[0]).filter((k) => k !== "id").slice(0, 8)
    : [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <UploadIcon size={24} className="text-teal-400" />
        <h1 className="text-2xl font-bold text-white">Upload Data</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-800 rounded-xl p-1 w-fit">
        {["lenders", "pipeline"].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setPreview(null); setStatus(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize cursor-pointer ${
              mode === m ? "bg-navy-800 text-teal-400" : "text-navy-400 hover:text-white"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-3">Download Template</h2>
          <p className="text-navy-400 text-sm mb-2">
            Vertical layout -- fields go down, records go across.
          </p>
          <p className="text-navy-500 text-xs mb-4">
            Fill in columns B, C, D... for each record (up to 100). Also accepts horizontal CSVs.
          </p>
          <button
            onClick={() =>
              downloadCSV(
                `${mode}_template.csv`,
                generateVerticalTemplate(
                  mode === "lenders" ? LENDER_HEADERS : PIPELINE_HEADERS
                )
              )
            }
            className="inline-flex items-center gap-2 bg-navy-800 border border-navy-700 text-navy-200 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <Download size={16} />
            Download {mode} template
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`bg-navy-900 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver ? "border-teal-500 bg-teal-500/5" : "border-navy-700"
          }`}
        >
          <FileUp size={40} className="mx-auto text-navy-500 mb-3" />
          <p className="text-navy-300 mb-2">Drag & drop a CSV file here</p>
          <p className="text-navy-500 text-sm mb-4">Vertical or horizontal format</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-navy-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <UploadIcon size={16} />
            Choose File
          </label>
        </div>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-6 text-sm ${
            status.type === "success"
              ? "bg-emerald-900/30 border border-emerald-700 text-emerald-300"
              : "bg-red-900/30 border border-red-700 text-red-300"
          }`}
        >
          {status.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      {preview && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">
              Preview ({preview.length} record{preview.length !== 1 ? "s" : ""})
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 rounded-lg bg-navy-800 text-navy-300 hover:text-white text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-navy-950 font-semibold text-sm cursor-pointer"
              >
                Import {preview.length} Record{preview.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-800">
                  {previewKeys.map((col) => (
                    <th key={col} className="px-3 py-2 text-left text-navy-400 font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-navy-800/50">
                    {previewKeys.map((col) => (
                      <td key={col} className="px-3 py-2 text-navy-200 whitespace-nowrap max-w-[150px] truncate">
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <p className="text-navy-500 text-sm mt-2 text-center">
                ...and {preview.length - 10} more rows
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
