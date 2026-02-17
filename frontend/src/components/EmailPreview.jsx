import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";

export default function EmailPreview({ prospect, matches, pipeline }) {
  const [copied, setCopied] = useState(false);

  const priorDeals = pipeline.filter(
    (p) =>
      p.id !== prospect.id &&
      p.wbc_sub_product?.trim() === prospect.wbc_sub_product?.trim() &&
      (p.pipeline_status === "Closed - Won" || p.pipeline_status === "Closed - Mandate")
  );

  const activeDeals = pipeline.filter(
    (p) =>
      p.id !== prospect.id &&
      p.wbc_sub_product?.trim() === prospect.wbc_sub_product?.trim() &&
      p.pipeline_status === "Active"
  );

  const topLenders = matches.slice(0, 5);

  const subject = `${prospect.wbc_sub_product || "Financing"} Opportunity - ${prospect.company_name || prospect.client_name}`;

  const body = `Dear ${prospect.contact_name || prospect.client_name},

Thank you for engaging Whitebridge Capital for your ${prospect.wbc_sub_product || "financing"} needs. Following our review, we are pleased to share our preliminary findings and recommended financing sources.

DEAL SUMMARY
- Product: ${prospect.wbc_sub_product || "N/A"}
- Deal Size: ${prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "To be determined"}
- Sector: ${prospect.sector || "N/A"}
- Target Close: ${prospect.est_close_date || "TBD"}

RECOMMENDED LENDERS (Top ${topLenders.length})
${topLenders.map((m, i) => `${i + 1}. ${m.lender.lender_name} (${m.lender.lender_type || "N/A"}) - ${m.lender.geographic_coverage || "N/A"} coverage, Match Score: ${m.score}/90`).join("\n")}
${priorDeals.length > 0 ? `
PRIOR SUCCESSFUL DEALS (Similar Product)
${priorDeals.map((d) => `- ${d.company_name || d.client_name}: ${d.wbc_sub_product}, $${Number(d.deal_size || 0).toLocaleString()}`).join("\n")}` : ""}
${activeDeals.length > 0 ? `
CURRENT ACTIVE DEALS (Same Product Category)
${activeDeals.map((d) => `- ${d.company_name || d.client_name}: ${d.deal_stage || "Active"}`).join("\n")}` : ""}

We would welcome the opportunity to discuss these options in detail at your convenience. Please do not hesitate to reach out with any questions.

Best regards,
${prospect.lead_rm || "WBC"} | Whitebridge Capital
Credit Advisory Team`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-teal-400" />
          <h2 className="text-white font-semibold">Email Draft Preview</h2>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 bg-navy-800 border border-navy-700 text-navy-200 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      <div className="bg-navy-950 rounded-lg p-5 border border-navy-800">
        <div className="border-b border-navy-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-sm mb-1">
            <span className="text-navy-500">To:</span>
            <span className="text-navy-200">
              {prospect.contact_name || prospect.client_name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-navy-500">Subject:</span>
            <span className="text-white font-medium">{subject}</span>
          </div>
        </div>
        <pre className="text-navy-200 text-sm whitespace-pre-wrap font-sans leading-relaxed">
          {body}
        </pre>
      </div>

      <p className="text-navy-500 text-xs mt-3">
        This is a preview only. Copy and paste into your email client to send.
      </p>
    </div>
  );
}
