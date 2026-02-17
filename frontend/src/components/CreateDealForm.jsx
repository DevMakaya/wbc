import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, ArrowLeft, Plus, User } from "lucide-react";
import { createPipelineRecord, createUser, grantDealAccess, getVariables } from "../lib/dataService";

export default function CreateDealForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({});
  const [createPortalUser, setCreatePortalUser] = useState(false);
  const [form, setForm] = useState({
    client_name: "", company_name: "", contact_name: "",
    wbc_sub_product: "", deal_size: "", deal_stage: "1. Lead / Intake",
    pipeline_status: "Active", physical_location: "", sector: "",
    est_close_date: "", lead_rm: "", fee_percentage: "",
    portal_email: "", portal_password: "", portal_name: "",
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
    const deal = await createPipelineRecord({
      client_name: form.client_name,
      company_name: form.company_name,
      contact_name: form.contact_name,
      wbc_sub_product: form.wbc_sub_product,
      deal_size: form.deal_size ? Number(form.deal_size) : null,
      deal_stage: form.deal_stage,
      pipeline_status: form.pipeline_status,
      physical_location: form.physical_location,
      sector: form.sector,
      est_close_date: form.est_close_date,
      lead_rm: form.lead_rm || localStorage.getItem("wbc_user") || "",
      fee_percentage: form.fee_percentage ? Number(form.fee_percentage) : null,
      wbc_product: "Lending Advisory", lead_source: "", deal_team: "",
      probability: null, total_est_revenue: null, client_type: "",
    });
    if (createPortalUser && form.portal_email) {
      const user = await createUser({
        email: form.portal_email,
        password: form.portal_password,
        name: form.portal_name || form.client_name,
        role: "prospect",
      });
      await grantDealAccess(user.id, deal.id);
    }
    setLoading(false);
    navigate("/deals");
  };

  const inp = "px-4 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-teal-500";
  const sel = inp + " cursor-pointer";

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-navy-400 hover:text-white mb-6 text-sm cursor-pointer">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="flex items-center gap-3 mb-6">
        <Plus size={24} className="text-teal-400" />
        <h1 className="text-2xl font-bold text-white">New Deal</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-teal-400" />
            <h2 className="text-white font-semibold">Deal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Client Name *" required className={inp} />
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
              {(options.deal_stage || ["1. Lead / Intake"]).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input type="number" value={form.deal_size} onChange={(e) => set("deal_size", e.target.value)} placeholder="Deal Size ($)" className={inp} />
            <input value={form.physical_location} onChange={(e) => set("physical_location", e.target.value)} placeholder="Location" className={inp} />
            <select value={form.sector} onChange={(e) => set("sector", e.target.value)} className={sel}>
              <option value="">Sector...</option>
              {(options.sector || []).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input type="date" value={form.est_close_date} onChange={(e) => set("est_close_date", e.target.value)} className={inp} />
            <input value={form.lead_rm} onChange={(e) => set("lead_rm", e.target.value)} placeholder="Relationship Manager" className={inp} />
            <input type="number" step="0.1" value={form.fee_percentage} onChange={(e) => set("fee_percentage", e.target.value)} placeholder="Fee % (e.g. 1.5)" className={inp} />
          </div>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={createPortalUser} onChange={(e) => setCreatePortalUser(e.target.checked)} className="w-4 h-4 accent-teal-500 cursor-pointer" />
            <div className="flex items-center gap-2">
              <User size={18} className="text-teal-400" />
              <span className="text-white font-semibold text-sm">Create client portal access</span>
            </div>
          </label>
          {createPortalUser && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <input value={form.portal_name} onChange={(e) => set("portal_name", e.target.value)} placeholder="Portal User Name (defaults to client)" className={inp} />
              <input type="email" value={form.portal_email} onChange={(e) => set("portal_email", e.target.value)} placeholder="Portal Email *" required={createPortalUser} className={inp} />
              <input value={form.portal_password} onChange={(e) => set("portal_password", e.target.value)} placeholder="Portal Password *" required={createPortalUser} className={inp} />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-500 text-navy-950 font-semibold hover:bg-teal-400 transition-colors cursor-pointer disabled:opacity-60">
            <Plus size={18} />
            {loading ? "Creating..." : "Create Deal"}
          </button>
        </div>
      </form>
    </div>
  );
}
