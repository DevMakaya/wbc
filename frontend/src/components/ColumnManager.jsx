import { useState, useMemo, useRef, useEffect } from "react";
import { Settings2, Eye, EyeOff, ChevronUp, ChevronDown, Check } from "lucide-react";

export default function ColumnManager({ allColumns, visibleKeys, colOrder, colLabels, onChange }) {
  const [open, setOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setEditingKey(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const orderedCols = useMemo(() => {
    if (!colOrder) return allColumns;
    const map = new Map(colOrder.map((k, i) => [k, i]));
    return [...allColumns].sort((a, b) => (map.get(a.key) ?? 999) - (map.get(b.key) ?? 999));
  }, [allColumns, colOrder]);

  const isVisible = (key) => visibleKeys.has(key);

  const toggleVisibility = (key) => {
    const next = new Set(visibleKeys);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    onChange({ visible: next, order: colOrder, labels: colLabels });
  };

  const moveCol = (key, dir) => {
    const order = colOrder || allColumns.map((c) => c.key);
    const idx = order.indexOf(key);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= order.length) return;
    const next = [...order];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange({ visible: visibleKeys, order: next, labels: colLabels });
  };

  const startRename = (key) => {
    setEditingKey(key);
    setEditLabel(colLabels[key] || allColumns.find((c) => c.key === key)?.label || "");
  };

  const saveRename = (key) => {
    const next = { ...colLabels };
    const original = allColumns.find((c) => c.key === key)?.label;
    if (editLabel && editLabel !== original) {
      next[key] = editLabel;
    } else {
      delete next[key];
    }
    onChange({ visible: visibleKeys, order: colOrder, labels: next });
    setEditingKey(null);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-900 border border-navy-700 text-sm text-navy-300 hover:text-white transition-colors cursor-pointer"
      >
        <Settings2 size={16} />
        Columns
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 bg-navy-900 border border-navy-700 rounded-xl shadow-xl">
          <div className="p-3 border-b border-navy-800">
            <span className="text-sm font-medium text-navy-300">Manage Columns</span>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
            {orderedCols.map((col, idx) => (
              <div
                key={col.key}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-800/50"
              >
                <button onClick={() => toggleVisibility(col.key)} className="shrink-0 cursor-pointer">
                  {isVisible(col.key) ? (
                    <Eye size={14} className="text-emerald-400" />
                  ) : (
                    <EyeOff size={14} className="text-navy-600" />
                  )}
                </button>
                {editingKey === col.key ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(col.key);
                        if (e.key === "Escape") setEditingKey(null);
                      }}
                      className="flex-1 px-2 py-0.5 rounded bg-navy-950 border border-navy-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button onClick={() => saveRename(col.key)} className="cursor-pointer">
                      <Check size={14} className="text-emerald-400" />
                    </button>
                  </div>
                ) : (
                  <span
                    className="text-sm text-navy-200 flex-1 truncate cursor-pointer"
                    onDoubleClick={() => startRename(col.key)}
                    title="Double-click to rename"
                  >
                    {colLabels[col.key] || col.label}
                  </span>
                )}
                <div className="flex gap-0.5 shrink-0">
                  <button
                    onClick={() => moveCol(col.key, -1)}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-navy-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={12} className="text-navy-400" />
                  </button>
                  <button
                    onClick={() => moveCol(col.key, 1)}
                    disabled={idx === orderedCols.length - 1}
                    className="p-0.5 rounded hover:bg-navy-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={12} className="text-navy-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-navy-800">
            <button
              onClick={() => onChange({ visible: null, order: null, labels: {} })}
              className="w-full text-xs text-navy-500 hover:text-white py-1 cursor-pointer"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
