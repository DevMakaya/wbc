import { useEffect, useState } from "react";
import { Building2, Users, TrendingUp, Target } from "lucide-react";
import StatCard from "../components/StatCard";
import { getLenders, getPipeline } from "../lib/dataService";
import { matchLendersForProspect } from "../lib/matchingEngine";

const STAGE_COLORS = {
  "1. Lead / Intake": "bg-navy-600",
  "2. Discovery & NDA": "bg-blue-700",
  "2. Internal Conviction & Approval": "bg-blue-600",
  "3. Preliminary Analysis (Two Pager)": "bg-indigo-600",
  "4. Market Sounding & Client Engagement": "bg-violet-600",
  "5. Diligence & Financing Memo": "bg-purple-600",
  "6. Term Sheets & Negotiation": "bg-gold-600",
  "7. Term sheet Signed & Closing": "bg-amber-600",
  "8. Closed": "bg-emerald-600",
};

export default function Dashboard() {
  const [lenders, setLenders] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLenders(), getPipeline()]).then(([l, p]) => {
      setLenders(l);
      setPipeline(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400" />
      </div>
    );
  }

  const active = pipeline.filter((p) => p.pipeline_status === "Active");
  const totalRevenue = pipeline.reduce(
    (sum, p) => sum + (Number(p.total_est_revenue) || 0), 0
  );
  const totalMatches = pipeline.reduce((sum, p) => {
    const matches = matchLendersForProspect(p, lenders);
    return sum + matches.length;
  }, 0);

  const stageCounts = {};
  for (const p of pipeline) {
    const stage = p.deal_stage || "Unknown";
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  }
  const maxStageCount = Math.max(...Object.values(stageCounts), 1);

  const statusCounts = {};
  for (const p of pipeline) {
    const s = p.pipeline_status || "Unknown";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  const productCounts = {};
  for (const p of pipeline) {
    const sp = (p.wbc_sub_product || "Other").trim();
    productCounts[sp] = (productCounts[sp] || 0) + 1;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Total Lenders" value={lenders.length} sub="Financing sources" />
        <StatCard icon={Users} label="Active Deals" value={active.length} sub={`${pipeline.length} total pipeline`} color="text-blue-400" />
        <StatCard icon={Target} label="Total Matches" value={totalMatches.toLocaleString()} sub="Lender-prospect pairs" color="text-emerald-400" />
        <StatCard icon={TrendingUp} label="Est. Revenue" value={`$${(totalRevenue / 1e6).toFixed(1)}M`} sub="Total pipeline" color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Pipeline by Stage</h2>
          <div className="space-y-3">
            {Object.entries(stageCounts)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([stage, count]) => (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-navy-300 truncate mr-2">{stage}</span>
                    <span className="text-navy-400 font-mono">{count}</span>
                  </div>
                  <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STAGE_COLORS[stage] || "bg-navy-600"}`}
                      style={{ width: `${(count / maxStageCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Status Breakdown</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="bg-navy-800 rounded-lg px-4 py-3">
                  <p className="text-navy-400 text-xs">{status}</p>
                  <p className="text-white text-xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Top Products</h2>
            <div className="space-y-2">
              {Object.entries(productCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([product, count]) => (
                  <div key={product} className="flex items-center justify-between text-sm">
                    <span className="text-navy-300">{product}</span>
                    <span className="bg-navy-800 text-navy-200 px-2 py-0.5 rounded font-mono text-xs">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
