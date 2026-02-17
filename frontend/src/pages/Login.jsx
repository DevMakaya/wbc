import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { getUsers, updateUser } from "../lib/dataService";
import { trackEvent } from "../lib/tracker";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const users = await getUsers();
    const match = users.find((u) => u.email === email && u.password === password);

    if (!match) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    if (match.status === "disabled") {
      setError("Account is disabled. Contact an administrator.");
      setLoading(false);
      return;
    }

    localStorage.setItem("wbc_auth", "true");
    localStorage.setItem("wbc_user", match.name);
    localStorage.setItem("wbc_user_role", match.role);
    localStorage.setItem("wbc_user_id", String(match.id));
    localStorage.setItem("wbc_user_email", match.email);

    await updateUser(match.id, { last_login: new Date().toISOString() });
    trackEvent("login");

    navigate(match.role === "prospect" ? "/my-deals" : "/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/wbc-logo.svg" alt="WBC" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Deal Matching System</h1>
          <p className="text-navy-400 mt-1">Whitebridge Capital</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-navy-900 rounded-xl p-8 border border-navy-800 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Lock size={20} className="text-gold-400" />
            <span className="text-navy-200 font-medium">Sign In</span>
          </div>
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-2 mb-4">
              {error}
            </div>
          )}
          <label className="block mb-4">
            <span className="text-navy-300 text-sm">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="admin@wbc.com"
            />
          </label>
          <label className="block mb-6">
            <span className="text-navy-300 text-sm">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold rounded-lg py-2.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
