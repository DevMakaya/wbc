import { useState, useEffect, useMemo } from "react";
import { History } from "lucide-react";
import { getChangelog } from "../lib/dataService";

export default function ActivityLog() {
  const [changelog, setChangelog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  useEffect(() => {
    getChangelog().then((data) => {
      setChangelog(data);
      setLoading(false);
    });
  }, []);

  const users = useMemo(
    () => [...new Set(changelog.map((c) => c.user_name))].sort(),
    [changelog]
  );

  const filtered = useMemo(() => {
    let result = changelog;
    if (typeFilter !== "all") result = result.filter((c) => c.entity_type === typeFilter);
    if (userFilter !== "all") result = result.filter((c) => c.user_name === userFilter);
    return result;
  }, [changelog, typeFilter, userFilter]);

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
        <History size={24} className="text-gold-400" />
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <span className="bg-navy-800 text-navy-300 px-2.5 py-0.5 rounded-full text-sm">
          {filtered.length}
        </span>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-navy-900 border border-navy-700 text-sm text-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-500 cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="lender">Lenders</option>
          <option value="pipeline">Deals</option>
        </select>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-navy-900 border border-navy-700 text-sm text-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-500 cursor-pointer"
        >
          <option value="all">All Users</option>
          {users.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-navy-500 text-center py-12">
          <History size={48} className="mx-auto mb-4 opacity-30" />
          <p>No activity recorded yet</p>
          <p className="text-sm mt-1">Changes to lenders and deal records will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="bg-navy-900 border border-navy-800 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-gold-400 text-sm font-bold">
                  {(entry.user_name || "U")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy-200">
                  <span className="text-white font-medium">{entry.user_name}</span>
                  {" changed "}
                  <span className="text-gold-400">{entry.field}</span>
                  {" on "}
                  <span className="text-white">
                    {entry.entity_name || `${entry.entity_type} #${entry.entity_id}`}
                  </span>
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
                <span className="text-navy-600 text-xs mt-1 block">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  entry.entity_type === "lender"
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-purple-900/30 text-purple-400"
                }`}
              >
                {entry.entity_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
