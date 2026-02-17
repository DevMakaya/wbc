import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Briefcase, ArrowLeft } from "lucide-react";
import { createUser, createPipelineRecord, grantDealAccess, getVariables } from "../lib/dataService";

export default function CreateProspectForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({});
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    client_name: "", company_name: "", wbc_sub_product: "", deal_size: "",
    deal_stage: "", pipeline_status: "Active", physical_location: "",
    sector: "", est_close_date: "", lead_rm: "", contact_name: "",
  });

  useEffect(() => {
    Promise.all([
      getVariables("pipeline_status"),
      getVariables("deal_stage"),
      getVariables("wbc_sub_product"),
      getVariables("sector"),
    ]).then(([statuses, stages, products, sectors]) => {
      setOptions({
        pipeline_status: statuses.map((v) => v.value),
        deal_stage: stages.map((v) => v.value),
        wbc_sub_product: products.map((v) => v.value),
        sector: sectors.map((v) => v.value),
      });
    });
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const user = await createUser({ email: form.email, password: form.password, name: form.name, role: "prospect" });
    const deal = await createPipelineRecord({
      client_name: form.client_name || form.name,
      company_name: form.company_name,
      contact_name: form.contact_name || form.name,
      wbc_sub_product: form.wbc_sub_product,
      deal_size: form.deal_size ? Number(form.deal_size) : null,
      deal_stage: form.deal_stage,
      pipeline_status: form.pipeline_status,
      physical_location: form.physical_location,
      sector: form.sector,
      est_close_date: form.est_close_date,
      lead_rm: form.lead_rm || localStorage.getItem("wbc_user") || "",
      wbc_product: "", lead_source: "", deal_team: "", probability: null,
      total_est_revenue: null, client_type: "",
    });
    await grantDealAccess(user.id, deal.id);
    setLoading(false);
    navigate(-1);
  };

  const inp = "px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-gold-500";
  const sel = inp + " cursor-pointer";

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-navy-400 hover:text-white mb-6 text-sm cursor-pointer">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="flex items-center gap-3 mb-6">
        <UserPlus size={24} className="text-gold-400" />
        <h1 className="text-2xl font-bold text-white">New Prospect + Deal</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={18} className="text-gold-400" />
            <h2 className="text-white font-semibold">Prospect User</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full Name" required className={inp} />
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" required className={inp} />
            <input value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Password" required className={inp} />
          </div>
        </div>
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-gold-400" />
            <h2 className="text-white font-semibold">Deal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Client Name (defaults to user name)" className={inp} />
            <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Company Name" className={inp} />
            <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Contact Name" className={inp} />
            <select value={form.wbc_sub_product} onChange={(e) => set("wbc_sub_product", e.target.value)} className={sel}>
              <option value="">Product...</option>
              {(options.wbc_sub_product || []).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={form.pipeline_status} onChange={(e) => set("pipeline_status", e.target.value)} className={sel}>
              {(options.pipeline_status || ["Active"]).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={form.deal_stage} onChange={(e) => set("deal_stage", e.target.value)} className={sel}>
              <option value="">Stage...</option>
              {(options.deal_stage || []).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input type="number" value={form.deal_size} onChange={(e) => set("deal_size", e.target.value)} placeholder="Deal Size ($)" className={inp} />
            <input value={form.physical_location} onChange={(e) => set("physical_location", e.target.value)} placeholder="Location" className={inp} />
            <select value={form.sector} onChange={(e) => set("sector", e.target.value)} className={sel}>
              <option value="">Sector...</option>
              {(options.sector || []).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input type="date" value={form.est_close_date} onChange={(e) => set("est_close_date", e.target.value)} className={inp} />
            <input value={form.lead_rm} onChange={(e) => set("lead_rm", e.target.value)} placeholder="Relationship Manager" className={inp} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold-500 text-navy-950 font-semibold hover:bg-gold-400 transition-colors cursor-pointer disabled:opacity-60">
            <UserPlus size={18} />
            {loading ? "Creating..." : "Create Prospect + Deal"}
          </button>
        </div>
      </form>
    </div>
  );
}
