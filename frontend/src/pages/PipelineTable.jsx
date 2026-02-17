import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import DataTable from "../components/DataTable";
import { getPipeline, updatePipelineRecord, logChange } from "../lib/dataService";

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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    getPipeline().then((data) => {
      setPipeline(data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users size={24} className="text-gold-400" />
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <span className="bg-navy-800 text-navy-300 px-2.5 py-0.5 rounded-full text-sm">
          {pipeline.length}
        </span>
      </div>
      <DataTable
        tableId="pipeline"
        columns={ALL_COLUMNS}
        data={pipeline}
        onRowClick={(row) => navigate(`/pipeline/${row.id}`)}
        searchKeys={["client_name", "company_name", "wbc_sub_product", "pipeline_status", "sector"]}
        onCellEdit={handleCellEdit}
        editable
      />
    </div>
  );
}
