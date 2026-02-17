import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Globe, MapPin, Phone, Mail,
  Linkedin, ExternalLink, Building2,
} from "lucide-react";
import { getLender, getPipeline, getChangelog } from "../lib/dataService";
import { matchProspectsForLender, getProductFlags } from "../lib/matchingEngine";
import { ProspectMatchCard } from "../components/MatchCard";
import NotesPanel from "../components/NotesPanel";

export default function LenderProfile() {
  const { id } = useParams();
  const [lender, setLender] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");

  useEffect(() => {
    Promise.all([getLender(id), getPipeline(), getChangelog("lender", id)]).then(
      ([l, pipeline, changes]) => {
        setLender(l);
        setActivity(changes);
        if (l) setMatches(matchProspectsForLender(l, pipeline));
        setLoading(false);
      }
    );
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
      </div>
    );
  }

  if (!lender) {
    return <div className="text-navy-400">Lender not found.</div>;
  }

  const products = getProductFlags(lender);
  const tabs = [
    { id: "info", label: "Info" },
    { id: "notes", label: "Notes" },
    { id: "matches", label: `Matches (${matches.length})` },
    { id: "activity", label: `Activity (${activity.length})` },
  ];

  return (
    <div>
      <Link to="/lenders" className="inline-flex items-center gap-2 text-navy-400 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Lenders
      </Link>

      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{lender.lender_name}</h1>
            <p className="text-navy-400 mt-1">{lender.lender_type}</p>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-teal-400" />
            <span className="text-teal-400 font-semibold">ID #{lender.id}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoRow icon={Mail} label="Email" value={lender.contact_email} href={`mailto:${lender.contact_email}`} />
          <InfoRow icon={Phone} label="Phone" value={lender.contact_phone} />
          <InfoRow icon={Linkedin} label="LinkedIn" value="Profile" href={lender.linkedin_profile} />
          <InfoRow icon={ExternalLink} label="Website" value={lender.website?.replace("https://www.", "")} href={lender.website} />
          <InfoRow icon={MapPin} label="Location" value={lender.lender_location || lender.based_in} />
          <InfoRow icon={Globe} label="Coverage" value={lender.geographic_coverage} />
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-800 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "bg-navy-800 text-teal-400"
                : "text-navy-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="space-y-6">
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Product Offerings</h2>
            {products.length === 0 ? (
              <p className="text-navy-500 text-sm">No active product flags</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {products.map((p) => (
                  <span key={p} className="bg-navy-800 border border-navy-700 text-navy-200 px-3 py-1 rounded-full text-sm">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
          {lender.note && (
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Notes</h2>
              <p className="text-navy-200 text-sm leading-relaxed">{lender.note}</p>
            </div>
          )}
        </div>
      )}

      {tab === "notes" && <NotesPanel entityType="lender" entityId={id} />}

      {tab === "matches" && (
        <div>
          {matches.length === 0 ? (
            <p className="text-navy-500">No matching deals found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <ProspectMatchCard key={m.prospect.id} match={m} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "activity" && <ActivityFeed entries={activity} />}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value) return null;
  const content = (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={16} className="text-navy-500 shrink-0" />
      <span className="text-navy-400">{label}:</span>
      <span className="text-navy-200 truncate">{value}</span>
    </div>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
        {content}
      </a>
    );
  }
  return content;
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
            <span className="text-teal-400">{entry.field}</span>
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
