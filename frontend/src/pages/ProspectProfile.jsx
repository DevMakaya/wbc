import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, User, Building2, MapPin, DollarSign,
  Calendar, Briefcase, TrendingUp, Users,
} from "lucide-react";
import {
  getProspect, getLenders, getPipeline, getChangelog,
  getDealAccess, getUsers, grantDealAccess, revokeDealAccess,
} from "../lib/dataService";
import { matchLendersForProspect } from "../lib/matchingEngine";
import { LenderMatchCard } from "../components/MatchCard";
import DocumentGenerator from "../components/DocumentGenerator";
import EmailPreview from "../components/EmailPreview";
import NotesPanel from "../components/NotesPanel";
import DocumentUpload from "../components/DocumentUpload";

export default function ProspectProfile() {
  const { id } = useParams();
  const [prospect, setProspect] = useState(null);
  const [matches, setMatches] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [activity, setActivity] = useState([]);
  const [accessList, setAccessList] = useState([]);
  const [prospectUsers, setProspectUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("matches");

  const loadAll = () => {
    Promise.all([
      getProspect(id),
      getLenders(),
      getPipeline(),
      getChangelog("pipeline", id),
      getDealAccess(id),
      getUsers(),
    ]).then(([p, lenders, allPipeline, changes, access, users]) => {
      setProspect(p);
      setPipeline(allPipeline);
      setActivity(changes);
      setAccessList(access);
      setProspectUsers(users.filter((u) => u.role === "prospect"));
      if (p) setMatches(matchLendersForProspect(p, lenders));
      setLoading(false);
    });
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleGrantAccess = async () => {
    if (!selectedUserId) return;
    await grantDealAccess(selectedUserId, id);
    setSelectedUserId("");
    loadAll();
  };

  const handleRevokeAccess = async (userId) => {
    await revokeDealAccess(userId, id);
    loadAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400" />
      </div>
    );
  }

  if (!prospect) {
    return <div className="text-navy-400">Prospect not found.</div>;
  }

  const tabs = [
    { id: "matches", label: `Matches (${matches.length})` },
    { id: "documents", label: "Documents" },
    { id: "notes", label: "Notes" },
    { id: "email", label: "Email Draft" },
    { id: "access", label: `Access (${accessList.length})` },
    { id: "activity", label: `Activity (${activity.length})` },
  ];

  return (
    <div>
      <Link to="/pipeline" className="inline-flex items-center gap-2 text-navy-400 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Pipeline
      </Link>

      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{prospect.client_name}</h1>
            <p className="text-navy-400 mt-1">{prospect.company_name}</p>
          </div>
          <StatusBadge status={prospect.pipeline_status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Detail icon={Briefcase} label="Product" value={prospect.wbc_sub_product} />
          <Detail icon={DollarSign} label="Deal Size" value={prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "N/A"} />
          <Detail icon={TrendingUp} label="Est. Revenue" value={prospect.total_est_revenue ? `$${Number(prospect.total_est_revenue).toLocaleString()}` : "N/A"} />
          <Detail icon={Calendar} label="Close Date" value={prospect.est_close_date} />
          <Detail icon={MapPin} label="Location" value={prospect.physical_location} />
          <Detail icon={User} label="Contact" value={prospect.contact_name} />
          <Detail icon={Users} label="Deal Team" value={prospect.deal_team} />
          <Detail icon={Building2} label="Sector" value={prospect.sector} />
        </div>

        <div className="mt-4 flex gap-3 text-sm flex-wrap">
          <span className="bg-navy-800 text-navy-300 px-3 py-1 rounded-full">
            Stage: {prospect.deal_stage || "N/A"}
          </span>
          <span className="bg-navy-800 text-navy-300 px-3 py-1 rounded-full">
            RM: {prospect.lead_rm || "N/A"}
          </span>
          <span className="bg-navy-800 text-navy-300 px-3 py-1 rounded-full">
            Source: {prospect.lead_source || "N/A"}
          </span>
          <span className="bg-navy-800 text-navy-300 px-3 py-1 rounded-full">
            Prob: {prospect.probability ? `${(prospect.probability * 100).toFixed(0)}%` : "N/A"}
          </span>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tab === t.id
                ? "bg-navy-800 text-gold-400"
                : "text-navy-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "matches" && (
        <div>
          {matches.length === 0 ? (
            <p className="text-navy-500">No matching lenders found for this product type.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <LenderMatchCard key={m.lender.id} match={m} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Generate Documents</h3>
            <DocumentGenerator prospect={prospect} matches={matches} />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Uploaded Documents</h3>
            <DocumentUpload dealId={id} />
          </div>
        </div>
      )}

      {tab === "notes" && <NotesPanel entityType="pipeline" entityId={id} />}

      {tab === "email" && (
        <EmailPreview prospect={prospect} matches={matches} pipeline={pipeline} />
      )}

      {tab === "access" && (
        <div>
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 mb-4">
            <h3 className="text-white font-semibold mb-3">Grant Prospect Access</h3>
            <div className="flex gap-3">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-sm text-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-500 cursor-pointer"
              >
                <option value="">Select a prospect user...</option>
                {prospectUsers
                  .filter((u) => !accessList.find((a) => a.user_id === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
              </select>
              <button
                onClick={handleGrantAccess}
                disabled={!selectedUserId}
                className="px-4 py-2.5 rounded-lg bg-gold-500 text-navy-950 text-sm font-medium hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Grant Access
              </button>
            </div>
          </div>
          {accessList.length === 0 ? (
            <p className="text-navy-500 text-sm text-center py-8">No prospect users have access to this deal</p>
          ) : (
            <div className="space-y-2">
              {accessList.map((access) => {
                const user = prospectUsers.find((u) => u.id === access.user_id);
                return (
                  <div key={access.id} className="flex items-center justify-between bg-navy-900 border border-navy-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm">{user?.name || `User #${access.user_id}`}</p>
                      <p className="text-navy-500 text-xs">{user?.email} &middot; Granted by {access.granted_by} &middot; {new Date(access.granted_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleRevokeAccess(access.user_id)}
                      className="px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-900/50 hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "activity" && <ActivityFeed entries={activity} />}
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

function StatusBadge({ status }) {
  const colors = {
    Active: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
    "On Hold": "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    "Closed - Won": "bg-blue-900/50 text-blue-300 border-blue-700",
    "Closed - Lost": "bg-red-900/50 text-red-300 border-red-700",
    "Closed - Mandate": "bg-purple-900/50 text-purple-300 border-purple-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[status] || "bg-navy-800 text-navy-300 border-navy-700"}`}>
      {status || "Unknown"}
    </span>
  );
}

function ActivityFeed({ entries }) {
  if (!entries.length) {
    return <p className="text-navy-500 text-center py-8">No activity recorded</p>;
  }
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-navy-900 border border-navy-800 rounded-xl px-4 py-3">
          <p className="text-sm text-navy-200">
            <span className="text-white font-medium">{entry.user_name}</span>
            {" changed "}
            <span className="text-gold-400">{entry.field}</span>
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-red-400/70 line-through truncate max-w-[200px]">
              {entry.old_value || "(empty)"}
            </span>
            <span className="text-navy-600">&rarr;</span>
            <span className="text-emerald-400/70 truncate max-w-[200px]">
              {entry.new_value || "(empty)"}
            </span>
          </div>
          <span className="text-navy-600 text-xs">{new Date(entry.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
