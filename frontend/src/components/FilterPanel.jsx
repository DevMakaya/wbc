import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterPanel({ columns, data, filters, onFilterChange }) {
  const filterableCols = columns.filter((c) => c.filterType);

  const distinctValues = useMemo(() => {
    const vals = {};
    for (const col of filterableCols) {
      if (col.filterType === "select") {
        if (col.filterOptions?.length) {
          vals[col.key] = col.filterOptions;
        } else {
          const set = new Set();
          data.forEach((row) => {
            const v = row[col.key];
            if (v != null && v !== "") set.add(String(v));
          });
          vals[col.key] = [...set].sort();
        }
      }
    }
    return vals;
  }, [filterableCols, data]);

  const hasActive = Object.values(filters).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) return v.min !== "" || v.max !== "";
    return typeof v === "string" && v.trim() !== "";
  });

  if (!filterableCols.length) return null;

  return (
    <div className="bg-navy-900/50 border border-navy-800 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-navy-300">Filters</span>
        {hasActive && (
          <button
            onClick={() => onFilterChange({})}
            className="text-xs text-navy-500 hover:text-red-400 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filterableCols.map((col) => (
          <FilterControl
            key={col.key}
            column={col}
            value={filters[col.key]}
            options={distinctValues[col.key]}
            onChange={(v) => onFilterChange({ ...filters, [col.key]: v })}
          />
        ))}
      </div>
    </div>
  );
}

function FilterControl({ column, value, options, onChange }) {
  if (column.filterType === "select")
    return <SelectFilter label={column.label} value={value || []} options={options || []} onChange={onChange} />;
  if (column.filterType === "number")
    return <NumberFilter label={column.label} value={value || { min: "", max: "" }} onChange={onChange} />;
  return <TextFilter label={column.label} value={value || ""} onChange={onChange} />;
}

function TextFilter({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-navy-500 mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter..."
        className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
    </div>
  );
}

function NumberFilter({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-navy-500 mb-1 block">{label}</label>
      <div className="flex gap-2">
        <input
          type="number"
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          placeholder="Min"
          className="w-full px-2 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <input
          type="number"
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          placeholder="Max"
          className="w-full px-2 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
    </div>
  );
}

function SelectFilter({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const toggle = (opt) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-xs text-navy-500 mb-1 block">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-sm text-left flex items-center justify-between cursor-pointer hover:border-navy-600"
      >
        <span className={value.length ? "text-white" : "text-navy-600"}>
          {value.length ? `${value.length} selected` : "All"}
        </span>
        <ChevronDown size={14} className="text-navy-500" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-navy-900 border border-navy-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-navy-800 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-teal-400"
              />
              <span className="text-navy-200 truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
