import { useState, useMemo, useRef, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter } from "lucide-react";
import FilterPanel from "./FilterPanel";
import ColumnManager from "./ColumnManager";

function loadPrefs(tableId) {
  if (!tableId) return null;
  try {
    const saved = localStorage.getItem(`wbc_col_prefs_${tableId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function DataTable({
  tableId,
  columns,
  data,
  onRowClick,
  searchKeys,
  onCellEdit,
  editable,
}) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const clickTimeout = useRef(null);
  const perPage = 25;

  const [visibleKeys, setVisibleKeys] = useState(() => {
    const prefs = loadPrefs(tableId);
    return prefs?.visible
      ? new Set(prefs.visible)
      : new Set(columns.filter((c) => !c.defaultHidden).map((c) => c.key));
  });
  const [colOrder, setColOrder] = useState(() => loadPrefs(tableId)?.order || null);
  const [colLabels, setColLabels] = useState(() => loadPrefs(tableId)?.labels || {});

  const savePrefs = useCallback(
    (visible, order, labels) => {
      if (!tableId) return;
      localStorage.setItem(
        `wbc_col_prefs_${tableId}`,
        JSON.stringify({
          visible: visible ? [...visible] : null,
          order,
          labels,
        })
      );
    },
    [tableId]
  );

  const handleColumnChange = useCallback(
    ({ visible, order, labels }) => {
      if (visible === null) {
        const defaults = new Set(columns.filter((c) => !c.defaultHidden).map((c) => c.key));
        setVisibleKeys(defaults);
        setColOrder(null);
        setColLabels({});
        if (tableId) localStorage.removeItem(`wbc_col_prefs_${tableId}`);
      } else {
        setVisibleKeys(visible);
        setColOrder(order);
        setColLabels(labels);
        savePrefs(visible, order, labels);
      }
    },
    [columns, tableId, savePrefs]
  );

  const activeCols = useMemo(() => {
    let cols = columns.filter((c) => visibleKeys.has(c.key));
    if (colOrder) {
      const map = new Map(colOrder.map((k, i) => [k, i]));
      cols = [...cols].sort((a, b) => (map.get(a.key) ?? 999) - (map.get(b.key) ?? 999));
    }
    return cols.map((c) => (colLabels[c.key] ? { ...c, label: colLabels[c.key] } : c));
  }, [columns, visibleKeys, colOrder, colLabels]);

  const filtered = useMemo(() => {
    let result = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        (searchKeys || columns.map((c) => c.key)).some((k) =>
          String(row[k] ?? "").toLowerCase().includes(q)
        )
      );
    }
    for (const [key, val] of Object.entries(filters)) {
      if (!val) continue;
      const col = columns.find((c) => c.key === key);
      if (!col) continue;
      if (col.filterType === "number" && typeof val === "object" && !Array.isArray(val)) {
        result = result.filter((row) => {
          const v = Number(row[key]) || 0;
          if (val.min !== "" && val.min !== undefined && v < Number(val.min)) return false;
          if (val.max !== "" && val.max !== undefined && v > Number(val.max)) return false;
          return true;
        });
      } else if (col.filterType === "select" && Array.isArray(val) && val.length) {
        result = result.filter((row) => val.includes(String(row[key] ?? "")));
      } else if (typeof val === "string" && val.trim()) {
        const q = val.toLowerCase();
        result = result.filter((row) => String(row[key] ?? "").toLowerCase().includes(q));
      }
    }
    return result;
  }, [data, search, filters, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const col = columns.find((c) => c.key === sortCol);
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (col?.sortValue) {
        av = col.sortValue(a);
        bv = col.sortValue(b);
      } else {
        av = a[sortCol] ?? "";
        bv = b[sortCol] ?? "";
      }
      const numA = Number(av);
      const numB = Number(bv);
      if (!isNaN(numA) && !isNaN(numB) && av !== "" && bv !== "") {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortCol, sortDir, columns]);

  const paged = sorted.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  const toggleSort = (key) => {
    if (sortCol === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) return v.min !== "" || v.max !== "";
    return typeof v === "string" && v.trim() !== "";
  }).length;

  const handleRowClick = (e, row) => {
    if (!onRowClick) return;
    if (editable && onCellEdit) {
      clickTimeout.current = setTimeout(() => onRowClick(row), 200);
    } else {
      onRowClick(row);
    }
  };

  const handleCellDoubleClick = (e, row, col) => {
    if (!editable || !onCellEdit || !col.editable) return;
    e.stopPropagation();
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    setEditingCell({ rowId: row.id, colKey: col.key });
    setEditValue(String(row[col.key] ?? ""));
  };

  const saveEdit = (row, col) => {
    if (!editingCell) return;
    const oldVal = String(row[col.key] ?? "");
    if (oldVal !== editValue) {
      onCellEdit(row, col.key, editValue);
    }
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronsUpDown size={14} className="text-navy-600" />;
    return sortDir === "asc" ? (
      <ChevronUp size={14} className="text-gold-400" />
    ) : (
      <ChevronDown size={14} className="text-gold-400" />
    );
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-navy-900 border border-navy-700 text-white placeholder-navy-500 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <span className="text-navy-500 text-sm">{sorted.length} results</span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
            showFilters || activeFilterCount
              ? "bg-gold-500/10 border-gold-500/30 text-gold-400"
              : "bg-navy-900 border-navy-700 text-navy-300 hover:text-white"
          }`}
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-gold-500 text-navy-950 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        <ColumnManager
          allColumns={columns}
          visibleKeys={visibleKeys}
          colOrder={colOrder}
          colLabels={colLabels}
          onChange={handleColumnChange}
        />
      </div>

      {showFilters && (
        <FilterPanel
          columns={activeCols}
          data={data}
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            setPage(0);
          }}
        />
      )}

      <div className="overflow-x-auto rounded-xl border border-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-900 border-b border-navy-800">
              {activeCols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-4 py-3 text-left text-navy-400 font-medium cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={(e) => handleRowClick(e, row)}
                className={`border-b border-navy-800/50 transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-navy-900/80" : ""
                } ${i % 2 === 0 ? "bg-navy-950" : "bg-navy-900/30"}`}
              >
                {activeCols.map((col) => (
                  <td
                    key={col.key}
                    onDoubleClick={(e) => handleCellDoubleClick(e, row, col)}
                    className={`px-4 py-3 text-navy-200 whitespace-nowrap max-w-[200px] truncate ${
                      editable && col.editable ? "hover:bg-navy-800/30" : ""
                    }`}
                  >
                    {editingCell?.rowId === row.id && editingCell?.colKey === col.key ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(row, col);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        onBlur={() => saveEdit(row, col)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 rounded bg-navy-950 border border-gold-500 text-white text-sm focus:outline-none"
                      />
                    ) : col.render ? (
                      col.render(row[col.key], row)
                    ) : (
                      (row[col.key] ?? "")
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={activeCols.length} className="px-4 py-8 text-center text-navy-500">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-navy-500 text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-sm text-navy-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-sm text-navy-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
