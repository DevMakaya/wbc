import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import DataTable from "../components/DataTable";
import { getLenders, updateLender, logChange } from "../lib/dataService";
import { getProductFlags } from "../lib/matchingEngine";

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

export default function LendersTable() {
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    getLenders().then((data) => {
      setLenders(data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 size={24} className="text-gold-400" />
        <h1 className="text-2xl font-bold text-white">Lenders</h1>
        <span className="bg-navy-800 text-navy-300 px-2.5 py-0.5 rounded-full text-sm">
          {lenders.length}
        </span>
      </div>
      <DataTable
        tableId="lenders"
        columns={ALL_COLUMNS}
        data={lenders}
        onRowClick={(row) => navigate(`/lenders/${row.id}`)}
        searchKeys={["lender_name", "lender_type", "contact_name", "based_in"]}
        onCellEdit={handleCellEdit}
        editable
      />
    </div>
  );
}
