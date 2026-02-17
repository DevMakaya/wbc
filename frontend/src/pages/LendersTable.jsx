import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, X } from "lucide-react";
import DataTable from "../components/DataTable";
import { getLenders, updateLender, createLender, logChange, getAllVariables } from "../lib/dataService";
import { getProductFlags } from "../lib/matchingEngine";

const PRODUCT_FIELDS = [
  { key: "cre_construction", label: "CRE Construction" },
  { key: "cre_residential", label: "CRE Residential" },
  { key: "cre_land", label: "CRE Land" },
  { key: "cre_office", label: "CRE Office" },
  { key: "cre_industrial", label: "CRE Industrial" },
  { key: "cre_hotel", label: "CRE Hotel" },
  { key: "cre_retail", label: "CRE Retail" },
  { key: "cre_other", label: "CRE Other" },
  { key: "real_estate", label: "Real Estate" },
  { key: "aircraft", label: "Aircraft" },
  { key: "art", label: "Art" },
  { key: "insurance_premium", label: "Insurance Premium" },
  { key: "yacht", label: "Yacht" },
  { key: "sports", label: "Sports" },
  { key: "fund_lp", label: "Fund LP" },
  { key: "fund_nav", label: "Fund NAV" },
  { key: "fund_gp", label: "Fund GP" },
  { key: "fund_mgmt_company", label: "Fund Mgmt Co" },
  { key: "fund_scf", label: "Fund SCF" },
];

const ALL_COLUMNS = [
  { key: "id", label: "#" },
  { key: "lender_name", label: "Lender Name", editable: true, filterType: "text" },
  { key: "lender_type", label: "Type", editable: true, filterType: "select" },
  {
    key: "_products",
    label: "Products",
    sortValue: (row) => getProductFlags(row).length,
    render: (_, row) => {
      const flags = getProductFlags(row);
      if (!flags.length) return <span className="text-navy-600">None</span>;
      return (
        <span className="text-emerald-400" title={flags.join(", ")}>
          {flags.length} product{flags.length > 1 ? "s" : ""}
        </span>
      );
    },
  },
  { key: "contact_name", label: "Contact", editable: true, filterType: "text" },
  { key: "contact_email", label: "Email", editable: true, filterType: "text", defaultHidden: true },
  { key: "contact_phone", label: "Phone", editable: true, defaultHidden: true },
  { key: "website", label: "Website", editable: true, defaultHidden: true },
  { key: "based_in", label: "Based In", editable: true, filterType: "select" },
  { key: "geographic_coverage", label: "Coverage", editable: true, filterType: "select" },
  { key: "lender_location", label: "Location", editable: true, defaultHidden: true },
  { key: "note", label: "Note", editable: true, defaultHidden: true },
  { key: "senior", label: "Senior", editable: true, filterType: "select", defaultHidden: true },
  { key: "subordinated", label: "Subordinated", editable: true, filterType: "select", defaultHidden: true },
  { key: "recourse", label: "Recourse", editable: true, filterType: "select", defaultHidden: true },
  { key: "non_recourse", label: "Non-Recourse", editable: true, filterType: "select", defaultHidden: true },
];

const EMPTY_FORM = {
  lender_name: "", lender_type: "", contact_name: "", contact_email: "",
  contact_phone: "", website: "", linkedin_profile: "", based_in: "",
  geographic_coverage: "", lender_location: "", note: "",
  senior: 0, subordinated: 0, recourse: 0, non_recourse: 0,
};

export default function LendersTable() {
  const [lenders, setLenders] = useState([]);
  const [varMap, setVarMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [products, setProducts] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () =>
    Promise.all([getLenders(), getAllVariables()]).then(([data, vars]) => {
      setLenders(data);
      const map = {};
      vars.forEach((v) => { if (!map[v.category]) map[v.category] = []; map[v.category].push(v.value); });
      setVarMap(map);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  const columns = ALL_COLUMNS.map((col) => {
    if (col.filterType === "select" && varMap[col.key]?.length) return { ...col, filterOptions: varMap[col.key] };
    return col;
  });

  const handleCellEdit = async (row, key, value) => {
    await logChange({
      entity_type: "lender",
      entity_id: row.id,
      entity_name: row.lender_name,
      field: key,
      old_value: row[key],
      new_value: value,
    });
    await updateLender(row.id, { [key]: value });
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const record = { ...form };
    PRODUCT_FIELDS.forEach(({ key }) => { record[key] = products[key] ? 1 : 0; });
    record.other_financing = "0";
    await createLender(record);
    setForm({ ...EMPTY_FORM });
    setProducts({});
    setShowForm(false);
    setSaving(false);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
      </div>
    );
  }

  const inp = "px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Lenders</h1>
          <span className="bg-navy-800 text-navy-300 px-2.5 py-0.5 rounded-full text-sm">
            {lenders.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 transition-colors cursor-pointer"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New Lender"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-navy-900 border border-navy-800 rounded-xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Add New Lender</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <input value={form.lender_name} onChange={(e) => set("lender_name", e.target.value)} placeholder="Lender / Institution Name *" required className={inp} />
            <select value={form.lender_type} onChange={(e) => set("lender_type", e.target.value)} className={inp + " cursor-pointer"}>
              <option value="">Type...</option>
              {(varMap.lender_type || ["Bank", "Non-Bank", "Private Credit", "Family Office"]).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Contact Name" className={inp} />
            <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="Contact Email" className={inp} />
            <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="Contact Phone" className={inp} />
            <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="Website" className={inp} />
            <input value={form.linkedin_profile} onChange={(e) => set("linkedin_profile", e.target.value)} placeholder="LinkedIn Profile" className={inp} />
            <input value={form.based_in} onChange={(e) => set("based_in", e.target.value)} placeholder="Based In (e.g. New York, NY)" className={inp} />
            <select value={form.geographic_coverage} onChange={(e) => set("geographic_coverage", e.target.value)} className={inp + " cursor-pointer"}>
              <option value="">Geographic Coverage...</option>
              <option value="Domestic">Domestic</option>
              <option value="International">International</option>
              <option value="Global">Global</option>
            </select>
            <input value={form.lender_location} onChange={(e) => set("lender_location", e.target.value)} placeholder="State / Region" className={inp} />
          </div>

          <div className="mb-4">
            <p className="text-navy-300 text-sm font-medium mb-2">Debt Structure</p>
            <div className="flex flex-wrap gap-3">
              {[
                { key: "senior", label: "Senior" },
                { key: "subordinated", label: "Subordinated" },
                { key: "recourse", label: "Recourse" },
                { key: "non_recourse", label: "Non-Recourse" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-navy-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) => set(key, e.target.checked ? 1 : 0)}
                    className="w-4 h-4 accent-teal-500 cursor-pointer"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-navy-300 text-sm font-medium mb-2">Products Offered</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {PRODUCT_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-xs text-navy-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!products[key]}
                    onChange={(e) => setProducts((p) => ({ ...p, [key]: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-teal-500 cursor-pointer"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <textarea value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Notes (loan area, value range, book size, etc.)" rows={2} className={inp + " w-full resize-none"} />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-500 text-navy-950 font-semibold text-sm hover:bg-teal-400 transition-colors cursor-pointer disabled:opacity-60">
              <Plus size={16} />
              {saving ? "Saving..." : "Add Lender"}
            </button>
          </div>
        </form>
      )}

      <DataTable
        tableId="lenders"
        columns={columns}
        data={lenders}
        onRowClick={(row) => navigate(`/lenders/${row.id}`)}
        searchKeys={["lender_name", "lender_type", "contact_name", "based_in"]}
        onCellEdit={handleCellEdit}
        editable
      />
    </div>
  );
}
