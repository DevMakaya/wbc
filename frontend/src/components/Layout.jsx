import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Building2, Upload,
  History, Shield, Briefcase, LogOut, Settings, BookOpen,
} from "lucide-react";
import { usePageTracker } from "../lib/tracker";
import { getUserByEmail } from "../lib/dataService";
import FeedbackPanel from "./FeedbackPanel";

const ADMIN_NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/lenders", icon: Building2, label: "Lenders" },
  { to: "/deals", icon: Briefcase, label: "Deals" },
  { to: "/activity", icon: History, label: "Activity" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/variables", icon: Settings, label: "Variables" },
  { to: "/admin", icon: Shield, label: "Admin" },
  { to: "/docs", icon: BookOpen, label: "Docs" },
];

const MANAGER_NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/lenders", icon: Building2, label: "Lenders" },
  { to: "/deals", icon: Briefcase, label: "Deals" },
  { to: "/activity", icon: History, label: "Activity" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/variables", icon: Settings, label: "Variables" },
  { to: "/docs", icon: BookOpen, label: "Docs" },
];

const PROSPECT_NAV = [
  { to: "/my-deals", icon: Briefcase, label: "My Deals" },
  { to: "/docs", icon: BookOpen, label: "Docs" },
];

export default function Layout() {
  const navigate = useNavigate();
  usePageTracker();

  const role = localStorage.getItem("wbc_user_role") || "manager";
  const userName = localStorage.getItem("wbc_user") || "User";
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem("wbc_user_email");
    if (email) {
      getUserByEmail(email).then((u) => {
        if (u?.avatar_url) setAvatarUrl(u.avatar_url);
      });
    }
  }, []);

  const navItems = role === "admin" ? ADMIN_NAV
    : role === "prospect" ? PROSPECT_NAV
    : MANAGER_NAV;

  const logout = () => {
    localStorage.removeItem("wbc_auth");
    localStorage.removeItem("wbc_user");
    localStorage.removeItem("wbc_user_role");
    localStorage.removeItem("wbc_user_id");
    localStorage.removeItem("wbc_user_email");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-navy-900 border-r border-navy-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-navy-800">
          {role === "prospect" ? (
            <div>
              <p className="text-gold-400 font-semibold text-sm">Client Portal</p>
              <p className="text-navy-400 text-xs mt-0.5">{userName}</p>
            </div>
          ) : (
            <img src="https://whitebridge.capital/images/WBC-logo-white.svg" alt="WBC" className="h-10" />
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-navy-800 text-gold-400"
                    : "text-navy-300 hover:text-white hover:bg-navy-800/50"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-navy-800">
          <Link to="/profile" className="flex items-center gap-3 px-4 py-2 mb-1 rounded-lg hover:bg-navy-800/50 transition-colors">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center">
                <span className="text-gold-400 text-xs font-bold">
                  {userName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-navy-200 text-sm truncate">{userName}</p>
              <p className="text-navy-500 text-xs capitalize">{role}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-navy-400 hover:text-red-400 hover:bg-navy-800/50 transition-colors w-full cursor-pointer"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-navy-950">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      <FeedbackPanel />
    </div>
  );
}
