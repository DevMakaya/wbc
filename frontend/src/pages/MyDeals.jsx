import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, DollarSign, MapPin, TrendingUp,
} from "lucide-react";
import { getUserDealAccess, getPipeline } from "../lib/dataService";

const STATUS_COLORS = {
  Active: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  "On Hold": "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  "Closed - Won": "bg-blue-900/50 text-blue-300 border-blue-700",
  "Closed - Lost": "bg-red-900/50 text-red-300 border-red-700",
  "Closed - Mandate": "bg-purple-900/50 text-purple-300 border-purple-700",
};

export default function MyDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = localStorage.getItem("wbc_user_id");

  useEffect(() => {
    Promise.all([getUserDealAccess(userId), getPipeline()]).then(
      ([access, pipeline]) => {
        const dealIds = new Set(access.map((a) => a.deal_id));
        setDeals(pipeline.filter((p) => dealIds.has(p.id)));
        setLoading(false);
      }
    );
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Briefcase size={24} className="text-teal-400" />
        <h1 className="text-2xl font-bold text-white">My Deals</h1>
        <span className="bg-navy-800 text-navy-300 px-2.5 py-0.5 rounded-full text-sm">
          {deals.length}
        </span>
      </div>

      {deals.length === 0 ? (
        <div className="text-navy-500 text-center py-16">
          <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p>No deals assigned yet</p>
          <p className="text-sm mt-1">Your relationship manager will invite you to deals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <div
              key={deal.id}
              onClick={() => navigate(`/my-deals/${deal.id}`)}
              className="bg-navy-900 border border-navy-800 rounded-xl p-5 cursor-pointer hover:border-navy-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{deal.client_name}</h3>
                  <p className="text-navy-400 text-sm">{deal.company_name}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[deal.pipeline_status] || "bg-navy-800 text-navy-300 border-navy-700"}`}>
                  {deal.pipeline_status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-navy-300">
                  <Briefcase size={14} className="text-navy-500" />
                  {deal.wbc_sub_product || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-navy-300">
                  <DollarSign size={14} className="text-navy-500" />
                  {deal.deal_size ? `$${Number(deal.deal_size).toLocaleString()}` : "N/A"}
                </div>
                <div className="flex items-center gap-2 text-navy-300">
                  <MapPin size={14} className="text-navy-500" />
                  {deal.physical_location || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-navy-300">
                  <TrendingUp size={14} className="text-navy-500" />
                  Stage: {deal.deal_stage || "N/A"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
