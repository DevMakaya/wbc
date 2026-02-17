import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus } from "lucide-react";
import DataTable from "../components/DataTable";
import { getPipeline, updatePipelineRecord, logChange, getAllVariables } from "../lib/dataService";

const STATUS_COLORS = {
  Active: "text-emerald-400",
  "On Hold": "text-yellow-400",
  "Closed - Won": "text-blue-400",
  "Closed - Lost": "text-red-400",
  "Closed - Mandate": "text-purple-400",
};

const ALL_COLUMNS = [
  { key: "id", label: "#" },
  { key: "client_name", label: "Client", editable: true, filterType: "text" },
  { key: "company_name", label: "Company", editable: true, filterType: "text" },
  { key: "contact_name", label: "Contact", editable: true, filterType: "text", defaultHidden: true },
  { key: "wbc_sub_product", label: "Product", editable: true, filterType: "select" },
  {
    key: "pipeline_status",
    label: "Status",
    editable: true,
    filterType: "select",
    render: (val) => (
      <span className={STATUS_COLORS[val] || "text-navy-300"}>{val}</span>
    ),
  },
  { key: "deal_stage", label: "Stage", editable: true, filterType: "select" },
  {
    key: "deal_size",
    label: "Deal Size",
    editable: true,
    filterType: "number",
    sortValue: (row) => Number(row.deal_size) || 0,
    render: (val) => (val ? `$${Number(val).toLocaleString()}` : "N/A"),
  },
  {
    key: "fee_percentage",
    label: "Fee %",
    editable: true,
    filterType: "number",
    sortValue: (row) => Number(row.fee_percentage) || 0,
    render: (val) => (val ? `${Number(val)}%` : "N/A"),
  },
  {
    key: "est_fee",
    label: "Est. Fee",
    sortValue: (row) => (Number(row.deal_size) || 0) * (Number(row.fee_percentage) || 0) / 100,
    render: (_, row) => {
      const size = Number(row.deal_size) || 0;
      const pct = Number(row.fee_percentage) || 0;
      return size && pct ? `$${Math.round(size * pct / 100).toLocaleString()}` : "N/A";
    },
  },
  { key: "lead_rm", label: "RM", editable: true, filterType: "select" },
  { key: "physical_location", label: "Location", editable: true, filterType: "select" },
  { key: "sector", label: "Sector", editable: true, filterType: "select", defaultHidden: true },
  { key: "lead_source", label: "Lead Source", editable: true, filterType: "select", defaultHidden: true },
  { key: "wbc_product", label: "WBC Product", editable: true, defaultHidden: true },
  {
    key: "probability",
    label: "Probability",
    editable: true,
    filterType: "number",
    defaultHidden: true,
    sortValue: (row) => Number(row.probability) || 0,
    render: (val) => (val ? `${(Number(val) * 100).toFixed(0)}%` : "N/A"),
  },
  { key: "deal_team", label: "Deal Team", editable: true, defaultHidden: true },
  {
    key: "total_est_revenue",
    label: "Est. Revenue",
    editable: true,
    filterType: "number",
    defaultHidden: true,
    sortValue: (row) => Number(row.total_est_revenue) || 0,
    render: (val) => (val ? `$${Number(val).toLocaleString()}` : "N/A"),
  },
  { key: "est_close_date", label: "Close Date", editable: true, defaultHidden: true },
  { key: "client_type", label: "Client Type", editable: true, filterType: "select", defaultHidden: true },
];

export default function PipelineTable() {
  const [pipeline, setPipeline] = useState([]);
  const [varMap, setVarMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    Promise.all([getPipeline(), getAllVariables()]).then(([data, vars]) => {
      setPipeline(data);
      const map = {};
      vars.forEach((v) => { if (!map[v.category]) map[v.category] = []; map[v.category].push(v.value); });
      setVarMap(map);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const columns = ALL_COLUMNS.map((col) => {
    if (col.filterType === "select" && varMap[col.key]?.length) return { ...col, filterOptions: varMap[col.key] };
    return col;
  });

  const handleCellEdit = async (row, key, value) => {
    await logChange({
      entity_type: "pipeline",
      entity_id: row.id,
      entity_name: row.client_name,
      field: key,
      old_value: row[key],
      new_value: value,
    });
    await updatePipelineRecord(row.id, { [key]: value });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Deals</h1>
          <span className="bg-navy-800 text-navy-300 px-2.5 py-0.5 rounded-full text-sm">
            {pipeline.length}
          </span>
        </div>
        <button
          onClick={() => navigate("/deals/new")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 transition-colors cursor-pointer"
        >
          <UserPlus size={16} />
          New Deal
        </button>
      </div>
      <DataTable
        tableId="pipeline"
        columns={columns}
        data={pipeline}
        onRowClick={(row) => navigate(`/deals/${row.id}`)}
        searchKeys={["client_name", "company_name", "wbc_sub_product", "pipeline_status", "sector"]}
        onCellEdit={handleCellEdit}
        editable
      />
    </div>
  );
}
