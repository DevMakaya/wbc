import { useState, useEffect } from "react";
import { Settings, Plus, Trash2, GripVertical, Pencil, Check, X } from "lucide-react";
import { getAllVariables, saveVariable, updateVariable, deleteVariable } from "../lib/dataService";

const CATEGORIES = [
  { key: "pipeline_status", label: "Deal Status" },
  { key: "deal_stage", label: "Deal Stage" },
  { key: "wbc_product", label: "WBC Product" },
  { key: "wbc_sub_product", label: "Sub Product" },
  { key: "sector", label: "Sector" },
  { key: "client_type", label: "Client Type" },
  { key: "lead_source", label: "Lead Source" },
  { key: "lender_type", label: "Lender Type" },
];

export default function VariablesPage() {
  const [allVars, setAllVars] = useState([]);
  const [active, setActive] = useState(CATEGORIES[0].key);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState("");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");

  const load = () => getAllVariables().then((d) => { setAllVars(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const items = allVars.filter((v) => v.category === active).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    await saveVariable({ category: active, value: newValue.trim(), sort_order: items.length });
    setNewValue("");
    load();
  };

  const handleDelete = async (id) => {
    await deleteVariable(id);
    load();
  };

  const handleRename = async (id) => {
    if (!editText.trim()) return;
    await updateVariable(id, { value: editText.trim() });
    setEditing(null);
    load();
  };

  const handleMoveUp = async (idx) => {
    if (idx === 0) return;
    await updateVariable(items[idx].id, { sort_order: items[idx - 1].sort_order });
    await updateVariable(items[idx - 1].id, { sort_order: items[idx].sort_order });
    load();
  };

  const handleMoveDown = async (idx) => {
    if (idx === items.length - 1) return;
    await updateVariable(items[idx].id, { sort_order: items[idx + 1].sort_order });
    await updateVariable(items[idx + 1].id, { sort_order: items[idx].sort_order });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-teal-400" />
        <h1 className="text-2xl font-bold text-white">Variables</h1>
      </div>

      <div className="flex gap-6">
        <div className="w-56 shrink-0">
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-2 space-y-0.5">
            {CATEGORIES.map((cat) => {
              const count = allVars.filter((v) => v.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActive(cat.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    active === cat.key ? "bg-navy-800 text-teal-400" : "text-navy-300 hover:text-white hover:bg-navy-800/50"
                  }`}
                >
                  {cat.label}
                  <span className="text-xs bg-navy-700 px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder={`Add ${CATEGORIES.find((c) => c.key === active)?.label}...`}
                className="flex-1 px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button onClick={handleAdd} disabled={!newValue.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 disabled:opacity-40 transition-colors cursor-pointer">
                <Plus size={16} /> Add
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-navy-500 text-sm text-center py-8">No values for this category</p>
            ) : (
              <div className="space-y-1">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 bg-navy-950 border border-navy-800 rounded-lg px-3 py-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="text-navy-500 hover:text-white disabled:opacity-20 cursor-pointer">
                        <GripVertical size={12} />
                      </button>
                      <button onClick={() => handleMoveDown(idx)} disabled={idx === items.length - 1} className="text-navy-500 hover:text-white disabled:opacity-20 cursor-pointer">
                        <GripVertical size={12} />
                      </button>
                    </div>

                    {editing === item.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRename(item.id)}
                          className="flex-1 px-3 py-1 rounded bg-navy-900 border border-navy-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          autoFocus
                        />
                        <button onClick={() => handleRename(item.id)} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check size={14} /></button>
                        <button onClick={() => setEditing(null)} className="text-navy-400 hover:text-white cursor-pointer"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-white text-sm">{item.value}</span>
                        <button onClick={() => { setEditing(item.id); setEditText(item.value); }} className="p-1 text-navy-400 hover:text-white cursor-pointer"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-navy-400 hover:text-red-400 cursor-pointer"><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
