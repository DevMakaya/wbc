import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Briefcase, DollarSign, MapPin,
  Calendar, TrendingUp, Building2,
} from "lucide-react";
import { getProspect } from "../lib/dataService";
import NotesPanel from "../components/NotesPanel";
import DocumentUpload from "../components/DocumentUpload";

export default function ProspectDealView() {
  const { id } = useParams();
  const [prospect, setProspect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("documents");

  useEffect(() => {
    getProspect(id).then((p) => {
      setProspect(p);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400" />
      </div>
    );
  }

  if (!prospect) {
    return <div className="text-navy-400">Deal not found.</div>;
  }

  const STATUS_COLORS = {
    Active: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
    "On Hold": "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    "Closed - Won": "bg-blue-900/50 text-blue-300 border-blue-700",
    "Closed - Lost": "bg-red-900/50 text-red-300 border-red-700",
    "Closed - Mandate": "bg-purple-900/50 text-purple-300 border-purple-700",
  };

  const tabs = [
    { id: "documents", label: "Documents" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div>
      <Link to="/my-deals" className="inline-flex items-center gap-2 text-navy-400 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to My Deals
      </Link>

      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{prospect.client_name}</h1>
            <p className="text-navy-400 mt-1">{prospect.company_name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[prospect.pipeline_status] || "bg-navy-800 text-navy-300 border-navy-700"}`}>
            {prospect.pipeline_status || "Unknown"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Detail icon={Briefcase} label="Product" value={prospect.wbc_sub_product} />
          <Detail icon={DollarSign} label="Deal Size" value={prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "N/A"} />
          <Detail icon={TrendingUp} label="Stage" value={prospect.deal_stage} />
          <Detail icon={Calendar} label="Close Date" value={prospect.est_close_date} />
          <Detail icon={MapPin} label="Location" value={prospect.physical_location} />
          <Detail icon={Building2} label="Sector" value={prospect.sector} />
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-800 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "bg-navy-800 text-gold-400"
                : "text-navy-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "documents" && <DocumentUpload dealId={id} />}
      {tab === "notes" && <NotesPanel entityType="pipeline" entityId={id} />}
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={16} className="text-navy-500 shrink-0" />
      <span className="text-navy-400">{label}:</span>
      <span className="text-navy-200 truncate">{value || "N/A"}</span>
    </div>
  );
}
