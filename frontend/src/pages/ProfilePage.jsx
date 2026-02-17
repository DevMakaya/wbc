import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, FileText, Camera, Save, Check } from "lucide-react";
import { getUserByEmail, updateUserProfile } from "../lib/dataService";

export default function ProfilePage() {
  const email = localStorage.getItem("wbc_user_email") || "";
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", bio: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    getUserByEmail(email).then((u) => {
      if (u) {
        setUser(u);
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          bio: u.bio || "",
          avatar_url: u.avatar_url || "",
        });
      }
    });
  }, [email]);

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      alert("Image must be under 500KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatar_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      bio: form.bio.trim(),
      avatar_url: form.avatar_url,
    };
    await updateUserProfile(email, updates);
    if (updates.name && updates.name !== localStorage.getItem("wbc_user")) {
      localStorage.setItem("wbc_user", updates.name);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
      </div>
    );
  }

  const initials = (form.name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>

      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
        <div className="flex items-center gap-5 mb-8">
          <div className="relative group">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-navy-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-navy-800 border-2 border-navy-700 flex items-center justify-center">
                <span className="text-teal-400 text-xl font-bold">{initials}</span>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
            >
              <Camera size={20} className="text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatar}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-white text-lg font-semibold">{form.name || "User"}</h2>
            <p className="text-navy-400 text-sm capitalize">{user.role}</p>
            <p className="text-navy-500 text-xs mt-0.5">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <Field
            icon={User}
            label="Full Name"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <Field
            icon={Mail}
            label="Email"
            value={form.email}
            disabled
            hint="Email cannot be changed"
          />
          <Field
            icon={Phone}
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+1 (555) 000-0000"
          />
          <div>
            <label className="flex items-center gap-2 text-navy-400 text-xs font-medium mb-1.5">
              <FileText size={14} />
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              placeholder="Tell us a bit about yourself..."
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
            />
          </div>
        </div>

        {form.avatar_url && (
          <button
            onClick={() => setForm((f) => ({ ...f, avatar_url: "" }))}
            className="text-xs text-navy-500 hover:text-red-400 mt-3 transition-colors cursor-pointer"
          >
            Remove photo
          </button>
        )}

        <div className="flex justify-end mt-6 pt-5 border-t border-navy-800">
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-navy-950 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, disabled, hint, placeholder }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-navy-400 text-xs font-medium mb-1.5">
        <Icon size={14} />
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/50 ${
          disabled ? "text-navy-500 cursor-not-allowed" : "text-white"
        }`}
      />
      {hint && <p className="text-navy-600 text-xs mt-1">{hint}</p>}
    </div>
  );
}
