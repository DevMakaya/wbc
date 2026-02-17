import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, User, Building2, MapPin, DollarSign,
  Calendar, Briefcase, TrendingUp, Users, Eye,
  CheckCircle, Download as DownloadIcon, Upload as UploadIcon,
  Search, Plus, Trash2, X, FileText,
} from "lucide-react";
import {
  getProspect, getLenders, getPipeline, getChangelog,
  getDealAccess, getUsers, grantDealAccess, revokeDealAccess,
  getDealOutreach, addDealOutreach, updateDealOutreach, deleteDealOutreach,
  getDealTermSheets, addTermSheet, updateTermSheet, deleteTermSheet,
} from "../lib/dataService";
import { getEvents } from "../lib/tracker";
import { matchLendersForProspect } from "../lib/matchingEngine";
import { LenderMatchCard } from "../components/MatchCard";
import DocumentGenerator from "../components/DocumentGenerator";
import EmailPreview from "../components/EmailPreview";
import NotesPanel from "../components/NotesPanel";
import DocumentUpload from "../components/DocumentUpload";

export default function ProspectProfile() {
  const { id } = useParams();
  const [prospect, setProspect] = useState(null);
  const [allLenders, setAllLenders] = useState([]);
  const [matches, setMatches] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [activity, setActivity] = useState([]);
  const [accessList, setAccessList] = useState([]);
  const [prospectUsers, setProspectUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [docEvents, setDocEvents] = useState([]);
  const [outreach, setOutreach] = useState([]);
  const [termSheets, setTermSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("outreach");

  const loadAll = () => {
    Promise.all([
      getProspect(id),
      getLenders(),
      getPipeline(),
      getChangelog("pipeline", id),
      getDealAccess(id),
      getUsers(),
      getEvents({ entity_id: Number(id) }),
      getDealOutreach(id),
      getDealTermSheets(id),
    ]).then(([p, lenders, allPipeline, changes, access, users, events, oData, tsData]) => {
      setProspect(p);
      setAllLenders(lenders);
      setPipeline(allPipeline);
      setActivity(changes);
      setAccessList(access);
      setProspectUsers(users.filter((u) => u.role === "prospect"));
      setDocEvents(events.filter((e) => e.event_type === "document_view" || e.event_type === "document_upload"));
      setOutreach(oData);
      setTermSheets(tsData);
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

  const lenderDataRoomNames = useMemo(() => {
    return outreach
      .filter((o) => ["interested", "nda_signed", "term_sheet_received", "selected"].includes(o.status))
      .map((o) => {
        const lender = allLenders.find((l) => l.id === o.lender_id);
        return lender?.institution_name || lender?.lender_name || `Lender #${o.lender_id}`;
      });
  }, [outreach, allLenders]);

  const outreachCounts = useMemo(() => {
    const contacted = outreach.filter((o) => o.status !== "pending").length;
    const interested = outreach.filter((o) => ["interested", "nda_signed", "term_sheet_received", "selected"].includes(o.status)).length;
    const ts = outreach.filter((o) => o.status === "term_sheet_received").length;
    return { contacted, interested, ts };
  }, [outreach]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
      </div>
    );
  }

  if (!prospect) {
    return <div className="text-navy-400">Deal not found.</div>;
  }

  const tabs = [
    { id: "outreach", label: `Outreach (${outreach.length})` },
    { id: "term-sheets", label: `Term Sheets (${termSheets.length})` },
    { id: "matches", label: `Matches (${matches.length})` },
    { id: "documents", label: "Documents" },
    { id: "doc-activity", label: `Doc Activity (${docEvents.length})` },
    { id: "notes", label: "Notes" },
    { id: "email", label: "Email Draft" },
    { id: "access", label: `Access (${accessList.length})` },
    { id: "activity", label: `Activity (${activity.length})` },
  ];

  return (
    <div>
      <Link to="/deals" className="inline-flex items-center gap-2 text-navy-400 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Deals
      </Link>

      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{prospect.client_name}</h1>
            <p className="text-navy-400 mt-1">{prospect.company_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/deals/${id}/preview`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-navy-700 text-navy-300 text-sm hover:text-white hover:border-navy-600 transition-colors">
              <Eye size={14} /> View as Client
            </Link>
            <StatusBadge status={prospect.pipeline_status} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Detail icon={Briefcase} label="Product" value={prospect.wbc_sub_product} />
          <Detail icon={DollarSign} label="Deal Size" value={prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "N/A"} />
          <Detail icon={TrendingUp} label="Fee %" value={prospect.fee_percentage ? `${prospect.fee_percentage}%` : "N/A"} />
          <Detail icon={DollarSign} label="Est. Fee" value={prospect.deal_size && prospect.fee_percentage ? `$${Math.round(Number(prospect.deal_size) * Number(prospect.fee_percentage) / 100).toLocaleString()}` : "N/A"} />
          <Detail icon={Calendar} label="Close Date" value={prospect.est_close_date} />
          <Detail icon={MapPin} label="Location" value={prospect.physical_location} />
          <Detail icon={User} label="Contact" value={prospect.contact_name} />
          <Detail icon={Building2} label="Sector" value={prospect.sector} />
        </div>

        <div className="mt-4 flex gap-3 text-sm flex-wrap">
          <span className="bg-navy-800 text-navy-300 px-3 py-1 rounded-full">Stage: {prospect.deal_stage || "N/A"}</span>
          <span className="bg-navy-800 text-navy-300 px-3 py-1 rounded-full">RM: {prospect.lead_rm || "N/A"}</span>
          <span className="bg-navy-800 text-navy-300 px-3 py-1 rounded-full">Source: {prospect.lead_source || "N/A"}</span>
          <span className="bg-teal-900/30 text-teal-300 px-3 py-1 rounded-full">{outreachCounts.contacted} contacted</span>
          <span className="bg-emerald-900/30 text-emerald-300 px-3 py-1 rounded-full">{outreachCounts.interested} interested</span>
          <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full">{outreachCounts.ts} term sheets</span>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tab === t.id ? "bg-navy-800 text-teal-400" : "text-navy-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "outreach" && (
        <LenderOutreachPanel
          dealId={id}
          outreach={outreach}
          allLenders={allLenders}
          onRefresh={loadAll}
        />
      )}

      {tab === "term-sheets" && (
        <TermSheetsPanel
          dealId={id}
          termSheets={termSheets}
          outreach={outreach}
          allLenders={allLenders}
          onRefresh={loadAll}
        />
      )}

      {tab === "matches" && (
        <div>
          {matches.length === 0 ? (
            <p className="text-navy-500">No matching lenders found for this product type.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => <LenderMatchCard key={m.lender.id} match={m} />)}
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
            <DocumentUpload dealId={id} lenderFolders={lenderDataRoomNames} />
          </div>
        </div>
      )}

      {tab === "doc-activity" && <DocActivityPanel events={docEvents} />}
      {tab === "notes" && <NotesPanel entityType="pipeline" entityId={id} />}
      {tab === "email" && <EmailPreview prospect={prospect} matches={matches} pipeline={pipeline} />}

      {tab === "access" && (
        <div>
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 mb-4">
            <h3 className="text-white font-semibold mb-3">Grant Prospect Access</h3>
            <div className="flex gap-3">
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-sm text-navy-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                <option value="">Select a prospect user...</option>
                {prospectUsers.filter((u) => !accessList.find((a) => a.user_id === u.id)).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <button onClick={handleGrantAccess} disabled={!selectedUserId} className="px-4 py-2.5 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
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
                    <button onClick={() => handleRevokeAccess(access.user_id)} className="px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-900/50 hover:bg-red-900/20 transition-colors cursor-pointer">
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

const OUTREACH_STATUSES = ["pending", "contacted", "interested", "not_interested", "nda_signed", "term_sheet_received", "selected"];
const STATUS_COLORS = {
  pending: "bg-navy-700 text-navy-300",
  contacted: "bg-blue-900/50 text-blue-300",
  interested: "bg-emerald-900/50 text-emerald-300",
  not_interested: "bg-red-900/50 text-red-300",
  nda_signed: "bg-violet-900/50 text-violet-300",
  term_sheet_received: "bg-teal-900/50 text-teal-300",
  selected: "bg-green-900/50 text-green-300",
};
const STATUS_LABELS = {
  pending: "Pending",
  contacted: "Contacted",
  interested: "Interested",
  not_interested: "Not Interested",
  nda_signed: "NDA Signed",
  term_sheet_received: "Term Sheet",
  selected: "Selected",
};

function LenderOutreachPanel({ dealId, outreach, allLenders, onRefresh }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const available = useMemo(() => {
    const existingIds = new Set(outreach.map((o) => o.lender_id));
    return allLenders.filter((l) => !existingIds.has(l.id));
  }, [outreach, allLenders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return available.slice(0, 20);
    const q = search.toLowerCase();
    return available.filter((l) =>
      (l.institution_name || l.lender_name || "").toLowerCase().includes(q) ||
      (l.lender_type || "").toLowerCase().includes(q)
    ).slice(0, 20);
  }, [available, search]);

  const handleAdd = async (lender) => {
    await addDealOutreach({
      deal_id: Number(dealId),
      lender_id: lender.id,
      status: "pending",
      contacted_at: null,
      response_at: null,
      notes: "",
      created_by: localStorage.getItem("wbc_user") || "Unknown",
    });
    onRefresh();
  };

  const handleStatusChange = async (entry, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === "contacted" && !entry.contacted_at) updates.contacted_at = new Date().toISOString();
    if (["interested", "not_interested", "nda_signed", "term_sheet_received", "selected"].includes(newStatus)) updates.response_at = new Date().toISOString();
    await updateDealOutreach(entry.id, updates);
    onRefresh();
  };

  const handleDelete = async (entryId) => {
    await deleteDealOutreach(entryId);
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Lender Outreach</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 transition-colors cursor-pointer">
          <Plus size={16} /> Add Lender
        </button>
      </div>

      {showAdd && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-navy-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lenders..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-navy-500" />
            <button onClick={() => setShowAdd(false)} className="text-navy-500 hover:text-white cursor-pointer"><X size={16} /></button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-navy-500 text-sm py-2">No matching lenders found</p>
            ) : (
              filtered.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors">
                  <div>
                    <p className="text-white text-sm">{l.institution_name || l.lender_name}</p>
                    <p className="text-navy-500 text-xs">{l.lender_type} {l.products_offered ? `· ${l.products_offered}` : ""}</p>
                  </div>
                  <button onClick={() => handleAdd(l)} className="px-3 py-1 rounded bg-navy-700 text-navy-200 text-xs hover:bg-navy-600 transition-colors cursor-pointer">
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {outreach.length === 0 ? (
        <p className="text-navy-500 text-center py-8">No lenders added to outreach yet</p>
      ) : (
        <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800 text-left">
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Lender</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Type</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Status</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Contacted</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Response</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Notes</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase w-16"></th>
              </tr>
            </thead>
            <tbody>
              {outreach.map((entry) => {
                const lender = allLenders.find((l) => l.id === entry.lender_id);
                return (
                  <OutreachRow
                    key={entry.id}
                    entry={entry}
                    lender={lender}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onRefresh={onRefresh}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OutreachRow({ entry, lender, onStatusChange, onDelete, onRefresh }) {
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(entry.notes || "");

  const saveNotes = async () => {
    await updateDealOutreach(entry.id, { notes });
    setEditNotes(false);
    onRefresh();
  };

  return (
    <tr className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
      <td className="px-4 py-3 text-white text-sm">{lender?.institution_name || lender?.lender_name || `#${entry.lender_id}`}</td>
      <td className="px-4 py-3 text-navy-300 text-sm">{lender?.lender_type || "N/A"}</td>
      <td className="px-4 py-3">
        <select
          value={entry.status}
          onChange={(e) => onStatusChange(entry, e.target.value)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[entry.status] || "bg-navy-700 text-navy-300"}`}
        >
          {OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </td>
      <td className="px-4 py-3 text-navy-400 text-xs">{entry.contacted_at ? new Date(entry.contacted_at).toLocaleDateString() : "—"}</td>
      <td className="px-4 py-3 text-navy-400 text-xs">{entry.response_at ? new Date(entry.response_at).toLocaleDateString() : "—"}</td>
      <td className="px-4 py-3">
        {editNotes ? (
          <div className="flex gap-1">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1 px-2 py-1 rounded bg-navy-950 border border-navy-700 text-white text-xs outline-none" autoFocus onKeyDown={(e) => e.key === "Enter" && saveNotes()} />
            <button onClick={saveNotes} className="text-emerald-400 cursor-pointer"><CheckCircle size={14} /></button>
            <button onClick={() => setEditNotes(false)} className="text-navy-500 cursor-pointer"><X size={14} /></button>
          </div>
        ) : (
          <span onClick={() => setEditNotes(true)} className="text-navy-400 text-xs cursor-pointer hover:text-white truncate block max-w-[200px]">
            {entry.notes || "Click to add notes..."}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <button onClick={() => onDelete(entry.id)} className="text-navy-600 hover:text-red-400 transition-colors cursor-pointer">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

function TermSheetsPanel({ dealId, termSheets, outreach, allLenders, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    lender_id: "", loan_amount: "", rate: "", ltv: "", term_years: "",
    loan_type: "senior", recourse: "no", conditions: "", notes: "",
  });

  const eligibleLenders = useMemo(() => {
    return outreach
      .filter((o) => ["interested", "nda_signed", "term_sheet_received", "selected"].includes(o.status))
      .map((o) => {
        const l = allLenders.find((x) => x.id === o.lender_id);
        return { id: o.lender_id, name: l?.institution_name || l?.lender_name || `#${o.lender_id}` };
      });
  }, [outreach, allLenders]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async (e) => {
    e.preventDefault();
    await addTermSheet({
      deal_id: Number(dealId),
      lender_id: Number(form.lender_id),
      received_at: new Date().toISOString(),
      loan_amount: form.loan_amount ? Number(form.loan_amount) : null,
      rate: form.rate || null,
      ltv: form.ltv || null,
      term_years: form.term_years ? Number(form.term_years) : null,
      loan_type: form.loan_type,
      recourse: form.recourse,
      conditions: form.conditions,
      notes: form.notes,
      status: "received",
    });
    setShowForm(false);
    setForm({ lender_id: "", loan_amount: "", rate: "", ltv: "", term_years: "", loan_type: "senior", recourse: "no", conditions: "", notes: "" });
    onRefresh();
  };

  const handleAccept = async (ts) => {
    await updateTermSheet(ts.id, { status: "accepted" });
    termSheets.filter((t) => t.id !== ts.id && t.status !== "rejected").forEach(async (t) => {
      await updateTermSheet(t.id, { status: "rejected" });
    });
    onRefresh();
  };

  const handleReject = async (ts) => {
    await updateTermSheet(ts.id, { status: "rejected" });
    onRefresh();
  };

  const handleDeleteTS = async (tsId) => {
    await deleteTermSheet(tsId);
    onRefresh();
  };

  const inp = "px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Term Sheets</h3>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 transition-colors cursor-pointer">
          <FileText size={16} /> Add Term Sheet
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-navy-900 border border-navy-800 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <select value={form.lender_id} onChange={(e) => set("lender_id", e.target.value)} required className={inp + " cursor-pointer"}>
              <option value="">Select Lender...</option>
              {eligibleLenders.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <input type="number" value={form.loan_amount} onChange={(e) => set("loan_amount", e.target.value)} placeholder="Loan Amount ($)" className={inp} />
            <input value={form.rate} onChange={(e) => set("rate", e.target.value)} placeholder="Rate (e.g. SOFR+250)" className={inp} />
            <input value={form.ltv} onChange={(e) => set("ltv", e.target.value)} placeholder="LTV (e.g. 65%)" className={inp} />
            <input type="number" step="0.5" value={form.term_years} onChange={(e) => set("term_years", e.target.value)} placeholder="Term (years)" className={inp} />
            <select value={form.loan_type} onChange={(e) => set("loan_type", e.target.value)} className={inp + " cursor-pointer"}>
              <option value="senior">Senior</option>
              <option value="subordinated">Subordinated</option>
              <option value="mezzanine">Mezzanine</option>
            </select>
            <select value={form.recourse} onChange={(e) => set("recourse", e.target.value)} className={inp + " cursor-pointer"}>
              <option value="no">Non-Recourse</option>
              <option value="yes">Full Recourse</option>
              <option value="limited">Limited Recourse</option>
            </select>
            <input value={form.conditions} onChange={(e) => set("conditions", e.target.value)} placeholder="Key Conditions" className={inp} />
          </div>
          <div className="flex gap-2">
            <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Notes..." className={inp + " flex-1"} />
            <button type="submit" className="px-4 py-2 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 cursor-pointer">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-navy-700 text-navy-300 text-sm hover:text-white cursor-pointer">Cancel</button>
          </div>
        </form>
      )}

      {termSheets.length === 0 ? (
        <p className="text-navy-500 text-center py-8">No term sheets received yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {termSheets.map((ts) => {
            const lender = allLenders.find((l) => l.id === ts.lender_id);
            const lenderName = lender?.institution_name || lender?.lender_name || `#${ts.lender_id}`;
            const statusColor = ts.status === "accepted" ? "border-emerald-600 bg-emerald-900/20"
              : ts.status === "rejected" ? "border-red-900/50 bg-red-900/10 opacity-60"
              : "border-navy-800";
            return (
              <div key={ts.id} className={`bg-navy-900 border rounded-xl p-5 ${statusColor}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold text-sm">{lenderName}</h4>
                    <p className="text-navy-500 text-xs">{ts.received_at ? new Date(ts.received_at).toLocaleDateString() : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ts.status === "accepted" ? "bg-emerald-900/50 text-emerald-300"
                      : ts.status === "rejected" ? "bg-red-900/50 text-red-300"
                      : ts.status === "under_review" ? "bg-blue-900/50 text-blue-300"
                      : "bg-navy-700 text-navy-300"
                    }`}>{ts.status?.replace("_", " ")}</span>
                    <button onClick={() => handleDeleteTS(ts.id)} className="text-navy-600 hover:text-red-400 cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-navy-500">Amount: </span><span className="text-white">{ts.loan_amount ? `$${Number(ts.loan_amount).toLocaleString()}` : "N/A"}</span></div>
                  <div><span className="text-navy-500">Rate: </span><span className="text-white">{ts.rate || "N/A"}</span></div>
                  <div><span className="text-navy-500">LTV: </span><span className="text-white">{ts.ltv || "N/A"}</span></div>
                  <div><span className="text-navy-500">Term: </span><span className="text-white">{ts.term_years ? `${ts.term_years} yrs` : "N/A"}</span></div>
                  <div><span className="text-navy-500">Type: </span><span className="text-white capitalize">{ts.loan_type || "N/A"}</span></div>
                  <div><span className="text-navy-500">Recourse: </span><span className="text-white capitalize">{ts.recourse || "N/A"}</span></div>
                </div>
                {ts.conditions && <p className="text-navy-400 text-xs mb-3"><span className="text-navy-500">Conditions: </span>{ts.conditions}</p>}
                {ts.notes && <p className="text-navy-400 text-xs mb-3"><span className="text-navy-500">Notes: </span>{ts.notes}</p>}
                {ts.status !== "accepted" && ts.status !== "rejected" && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAccept(ts)} className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors cursor-pointer">Accept</button>
                    <button onClick={() => handleReject(ts)} className="flex-1 px-3 py-1.5 rounded-lg border border-red-900/50 text-red-400 text-xs font-medium hover:bg-red-900/20 transition-colors cursor-pointer">Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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

function DocActivityPanel({ events }) {
  const actionIcon = { document_view: DownloadIcon, document_upload: UploadIcon };
  const actionColor = { document_view: "text-blue-400", document_upload: "text-emerald-400" };
  const actionLabel = { document_view: "Downloaded / Viewed", document_upload: "Uploaded" };

  if (!events.length) return <p className="text-navy-500 text-center py-8">No document activity recorded</p>;

  return (
    <div className="space-y-2">
      {events.map((e, i) => {
        const Icon = actionIcon[e.event_type] || CheckCircle;
        const color = actionColor[e.event_type] || "text-navy-400";
        const label = actionLabel[e.event_type] || e.event_type;
        const meta = typeof e.metadata === "string" ? JSON.parse(e.metadata || "{}") : (e.metadata || {});
        return (
          <div key={e.id || i} className="flex items-center gap-4 bg-navy-900 border border-navy-800 rounded-xl px-4 py-3">
            <Icon size={18} className={color + " shrink-0"} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm">
                {meta.doc_name || "Document"} <span className="text-navy-400">&mdash; {label}</span>
              </p>
              <p className="text-navy-500 text-xs">{e.user_name || "Unknown"} &middot; {new Date(e.created_at).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityFeed({ entries }) {
  if (!entries.length) return <p className="text-navy-500 text-center py-8">No activity recorded</p>;
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
            <span className="text-red-400/70 line-through truncate max-w-[200px]">{entry.old_value || "(empty)"}</span>
            <span className="text-navy-600">&rarr;</span>
            <span className="text-emerald-400/70 truncate max-w-[200px]">{entry.new_value || "(empty)"}</span>
          </div>
          <span className="text-navy-600 text-xs">{new Date(entry.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
