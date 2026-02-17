import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Users, BarChart3, Eye, UserPlus, Pencil,
  Trash2, X, Check, Activity, MessageSquare,
} from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, getAllDealAccess, getAllFeedback } from "../lib/dataService";
import { getEvents } from "../lib/tracker";
import StatCard from "../components/StatCard";

export default function AdminPanel() {
  const [tab, setTab] = useState("users");

  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "monitoring", label: "Prospect Monitoring", icon: Eye },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-teal-400" />
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-800 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "bg-navy-800 text-teal-400"
                : "text-navy-400 hover:text-white"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "monitoring" && <MonitoringTab />}
      {tab === "feedback" && <FeedbackTab />}
    </div>
  );
}

function UsersTab() {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" });

  const load = () => getUsers().then((d) => { setUsers(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const updates = { name: form.name, email: form.email, role: form.role };
      if (form.password) updates.password = form.password;
      await updateUser(editingUser.id, updates);
    } else {
      await createUser(form);
    }
    setShowForm(false);
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "manager" });
    load();
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setShowForm(true);
  };

  const handleToggleStatus = async (user) => {
    await updateUser(user.id, { status: user.status === "active" ? "disabled" : "active" });
    load();
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.name}?`)) return;
    await deleteUser(user.id);
    load();
  };

  const roleBadge = (role) => {
    const c = role === "admin" ? "bg-teal-500/20 text-teal-400"
      : role === "prospect" ? "bg-purple-500/20 text-purple-400"
      : "bg-blue-500/20 text-blue-400";
    return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{role}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-navy-300 text-sm">{users.length} users</span>
        <div className="flex gap-2">
          <button
            onClick={() => nav("/deals/new")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-500/50 text-teal-400 text-sm font-medium hover:bg-teal-500/10 transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            New Deal
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingUser(null); setForm({ name: "", email: "", password: "", role: "manager" }); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            Create User
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-navy-900 border border-navy-800 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-medium">{editingUser ? "Edit User" : "Create User"}</span>
            <button type="button" onClick={() => { setShowForm(false); setEditingUser(null); }} className="text-navy-400 hover:text-white cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              required
              className="px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              required
              className="px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingUser ? "New password (leave blank to keep)" : "Password"}
              required={!editingUser}
              className="px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-navy-950 text-sm font-medium hover:bg-teal-400 transition-colors cursor-pointer">
              <Check size={16} />
              {editingUser ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-900 border-b border-navy-800">
              <th className="px-4 py-3 text-left text-navy-400 font-medium">#</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Name</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Email</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Role</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Last Login</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={user.id} className={`border-b border-navy-800/50 ${i % 2 === 0 ? "bg-navy-950" : "bg-navy-900/30"}`}>
                <td className="px-4 py-3 text-navy-500">{user.id}</td>
                <td className="px-4 py-3 text-white">{user.name}</td>
                <td className="px-4 py-3 text-navy-300">{user.email}</td>
                <td className="px-4 py-3">{roleBadge(user.role)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-navy-400 text-xs">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(user)} className="p-1.5 rounded hover:bg-navy-800 text-navy-400 hover:text-white cursor-pointer" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleToggleStatus(user)} className="p-1.5 rounded hover:bg-navy-800 text-navy-400 hover:text-yellow-400 cursor-pointer" title={user.status === "active" ? "Disable" : "Enable"}>
                      <Activity size={14} />
                    </button>
                    <button onClick={() => handleDelete(user)} className="p-1.5 rounded hover:bg-red-900/30 text-navy-400 hover:text-red-400 cursor-pointer" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEvents(), getUsers()]).then(([e, u]) => {
      setEvents(e);
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const activeToday = useMemo(() => {
    const names = new Set(events.filter((e) => e.created_at?.startsWith(today)).map((e) => e.user_name));
    return names.size;
  }, [events, today]);

  const pageViewsWeek = useMemo(
    () => events.filter((e) => e.event_type === "page_view" && e.created_at >= weekAgo).length,
    [events, weekAgo]
  );

  const docViewsWeek = useMemo(
    () => events.filter((e) => e.event_type === "document_view" && e.created_at >= weekAgo).length,
    [events, weekAgo]
  );

  const userEngagement = useMemo(() => {
    const map = {};
    for (const u of users) {
      map[u.name] = { name: u.name, role: u.role, last_login: u.last_login, page_views: 0, doc_views: 0, last_active: null };
    }
    for (const e of events) {
      if (!map[e.user_name]) continue;
      if (e.event_type === "page_view") map[e.user_name].page_views++;
      if (e.event_type === "document_view") map[e.user_name].doc_views++;
      if (!map[e.user_name].last_active || e.created_at > map[e.user_name].last_active) {
        map[e.user_name].last_active = e.created_at;
      }
    }
    return Object.values(map).sort((a, b) => b.page_views - a.page_views);
  }, [users, events]);

  const topPages = useMemo(() => {
    const counts = {};
    events.filter((e) => e.event_type === "page_view").forEach((e) => {
      counts[e.page] = (counts[e.page] || 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [events]);

  const dailyActivity = useMemo(() => {
    const counts = {};
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000).toISOString().split("T")[0];
      counts[d] = 0;
    }
    events.forEach((e) => {
      const d = e.created_at?.split("T")[0];
      if (d && counts[d] !== undefined) counts[d]++;
    });
    return Object.entries(counts);
  }, [events]);

  const maxDaily = Math.max(...dailyActivity.map(([, c]) => c), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={users.length} sub={`${users.filter((u) => u.role === "prospect").length} prospects`} />
        <StatCard icon={Activity} label="Active Today" value={activeToday} sub="Unique users" color="text-emerald-400" />
        <StatCard icon={Eye} label="Page Views (7d)" value={pageViewsWeek} sub="Last 7 days" color="text-blue-400" />
        <StatCard icon={BarChart3} label="Doc Views (7d)" value={docViewsWeek} sub="Last 7 days" color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Activity (Last 30 Days)</h3>
          <div className="flex items-end gap-1 h-32">
            {dailyActivity.map(([date, count]) => (
              <div key={date} className="flex-1 flex flex-col items-center" title={`${date}: ${count}`}>
                <div
                  className="w-full bg-teal-500/60 rounded-t"
                  style={{ height: `${(count / maxDaily) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-navy-600 text-xs">
            <span>{dailyActivity[0]?.[0]?.slice(5)}</span>
            <span>Today</span>
          </div>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Most Viewed Pages</h3>
          {topPages.length === 0 ? (
            <p className="text-navy-500 text-sm">No page views yet</p>
          ) : (
            <div className="space-y-2">
              {topPages.map(([page, count]) => (
                <div key={page} className="flex items-center justify-between text-sm">
                  <span className="text-navy-300 truncate mr-3">{page}</span>
                  <span className="bg-navy-800 text-navy-200 px-2 py-0.5 rounded font-mono text-xs shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">User Engagement</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-800">
                <th className="px-3 py-2 text-left text-navy-400 font-medium">User</th>
                <th className="px-3 py-2 text-left text-navy-400 font-medium">Role</th>
                <th className="px-3 py-2 text-left text-navy-400 font-medium">Last Login</th>
                <th className="px-3 py-2 text-left text-navy-400 font-medium">Page Views</th>
                <th className="px-3 py-2 text-left text-navy-400 font-medium">Doc Views</th>
                <th className="px-3 py-2 text-left text-navy-400 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {userEngagement.map((u) => (
                <tr key={u.name} className="border-b border-navy-800/50 hover:bg-navy-800/30">
                  <td className="px-3 py-2 text-white">{u.name}</td>
                  <td className="px-3 py-2 text-navy-400 capitalize">{u.role}</td>
                  <td className="px-3 py-2 text-navy-400 text-xs">{u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}</td>
                  <td className="px-3 py-2 text-navy-200 font-mono">{u.page_views}</td>
                  <td className="px-3 py-2 text-navy-200 font-mono">{u.doc_views}</td>
                  <td className="px-3 py-2 text-navy-400 text-xs">{u.last_active ? new Date(u.last_active).toLocaleString() : "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MonitoringTab() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [dealAccess, setDealAccess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([getUsers(), getEvents(), getAllDealAccess()]).then(([u, e, da]) => {
      setUsers(u);
      setEvents(e);
      setDealAccess(da);
      setLoading(false);
    });
  }, []);

  const prospects = useMemo(() => {
    return users.filter((u) => u.role === "prospect").map((u) => {
      const userEvents = events.filter((e) => e.user_name === u.name);
      const deals = dealAccess.filter((a) => a.user_id === u.id).length;
      const pageViews = userEvents.filter((e) => e.event_type === "page_view").length;
      const docViews = userEvents.filter((e) => e.event_type === "document_view").length;
      const docUploads = userEvents.filter((e) => e.event_type === "document_upload").length;
      const notes = userEvents.filter((e) => e.event_type === "note_added").length;

      let engagement = "Never logged in";
      if (u.last_login) {
        const daysSince = (Date.now() - new Date(u.last_login).getTime()) / 86400000;
        engagement = daysSince <= 7 ? "Active" : "Inactive";
      }

      return { ...u, deals, pageViews, docViews, docUploads, notes, engagement, userEvents };
    });
  }, [users, events, dealAccess]);

  const engagementBadge = (status) => {
    const c = status === "Active" ? "bg-emerald-500/20 text-emerald-400"
      : status === "Inactive" ? "bg-yellow-500/20 text-yellow-400"
      : "bg-navy-700 text-navy-400";
    return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400" />
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <div className="text-navy-500 text-center py-12">
        <Eye size={48} className="mx-auto mb-4 opacity-30" />
        <p>No prospect users yet</p>
        <p className="text-sm mt-1">Create prospect users in the Users tab to start monitoring</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-navy-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-900 border-b border-navy-800">
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Name</th>
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Email</th>
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Deals</th>
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Last Login</th>
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Pages</th>
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Docs</th>
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Uploads</th>
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Notes</th>
            <th className="px-4 py-3 text-left text-navy-400 font-medium">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((p, i) => (
            <>
              <tr
                key={p.id}
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className={`border-b border-navy-800/50 cursor-pointer hover:bg-navy-900/80 ${i % 2 === 0 ? "bg-navy-950" : "bg-navy-900/30"}`}
              >
                <td className="px-4 py-3 text-white">{p.name}</td>
                <td className="px-4 py-3 text-navy-300">{p.email}</td>
                <td className="px-4 py-3 text-navy-200 font-mono">{p.deals}</td>
                <td className="px-4 py-3 text-navy-400 text-xs">{p.last_login ? new Date(p.last_login).toLocaleString() : "Never"}</td>
                <td className="px-4 py-3 text-navy-200 font-mono">{p.pageViews}</td>
                <td className="px-4 py-3 text-navy-200 font-mono">{p.docViews}</td>
                <td className="px-4 py-3 text-navy-200 font-mono">{p.docUploads}</td>
                <td className="px-4 py-3 text-navy-200 font-mono">{p.notes}</td>
                <td className="px-4 py-3">{engagementBadge(p.engagement)}</td>
              </tr>
              {expanded === p.id && (
                <tr key={`${p.id}-detail`}>
                  <td colSpan={9} className="bg-navy-900/60 px-6 py-4">
                    <p className="text-navy-300 text-xs font-medium mb-2">Recent Activity</p>
                    {p.userEvents.length === 0 ? (
                      <p className="text-navy-500 text-xs">No activity recorded</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {p.userEvents.slice(0, 20).map((ev) => (
                          <div key={ev.id} className="flex items-center gap-3 text-xs">
                            <span className="text-navy-500 w-36 shrink-0">{new Date(ev.created_at).toLocaleString()}</span>
                            <span className="bg-navy-800 text-navy-300 px-2 py-0.5 rounded">{ev.event_type}</span>
                            <span className="text-navy-400 truncate">{ev.page}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackTab() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getAllFeedback().then((data) => { setFeedback(data); setLoading(false); });
  }, []);

  const ROLE_COLORS = {
    admin: "text-teal-400",
    manager: "text-blue-400",
    prospect: "text-emerald-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-navy-300 text-sm">{feedback.length} feedback submissions</span>
      </div>
      {feedback.length === 0 ? (
        <p className="text-navy-500 text-center py-12">No feedback received yet</p>
      ) : (
        <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800 text-left">
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">User</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Email</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Role</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Page</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Message</th>
                <th className="px-4 py-3 text-navy-400 text-xs font-medium uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((item) => (
                <>
                  <tr
                    key={item.id}
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-white text-sm">{item.user_name}</td>
                    <td className="px-4 py-3 text-navy-300 text-sm">{item.user_email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm capitalize ${ROLE_COLORS[item.user_role] || "text-navy-300"}`}>{item.user_role}</span>
                    </td>
                    <td className="px-4 py-3 text-navy-400 text-xs font-mono">{item.page || "—"}</td>
                    <td className="px-4 py-3 text-navy-200 text-sm max-w-xs truncate">{item.message}</td>
                    <td className="px-4 py-3 text-navy-400 text-xs whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                  {expanded === item.id && (
                    <tr key={`${item.id}-exp`}>
                      <td colSpan={6} className="bg-navy-900/60 px-6 py-4">
                        <p className="text-navy-200 text-sm whitespace-pre-wrap">{item.message}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
