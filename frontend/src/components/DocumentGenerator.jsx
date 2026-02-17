import { FileText, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const NAVY = [16, 42, 67];
const GOLD = [251, 191, 36];
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [217, 226, 236];

function addHeader(doc, title) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(...GOLD);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("WBC", 15, 20);
  doc.setFontSize(9);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text("WHITEBRIDGE CAPITAL", 42, 17);
  doc.text(title.toUpperCase(), 42, 24);
  doc.setTextColor(...NAVY);
  return 45;
}

function addField(doc, label, value, x, y) {
  doc.setFontSize(8);
  doc.setTextColor(130, 154, 177);
  doc.text(label, x, y);
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(String(value || "N/A"), x, y + 5);
  return y + 14;
}

function generateSpecSheet(prospect, matches) {
  const doc = new jsPDF();
  let y = addHeader(doc, "Spec Sheet");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(prospect.client_name, 15, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(prospect.company_name || "", 15, y);
  y += 12;

  const fields = [
    ["Product", prospect.wbc_sub_product],
    ["Deal Size", prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "N/A"],
    ["Sector", prospect.sector],
    ["Location", prospect.physical_location],
    ["Deal Stage", prospect.deal_stage],
    ["Est. Close", prospect.est_close_date],
    ["Lead RM", prospect.lead_rm],
    ["Client Type", prospect.client_type],
  ];

  let col = 0;
  for (const [label, value] of fields) {
    const x = col < 2 ? 15 : col < 4 ? 75 : 135;
    y = addField(doc, label, value, x, y);
    col++;
    if (col % 2 === 0 && col % 6 !== 0) y -= 14;
    if (col % 6 === 0) y += 4;
  }

  y = Math.max(y, 120);
  y += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Top Matched Lenders", 15, y);
  y += 8;

  const top5 = matches.slice(0, 5);
  if (top5.length) {
    doc.autoTable({
      startY: y,
      head: [["Lender", "Type", "Coverage", "Score"]],
      body: top5.map((m) => [
        m.lender.lender_name,
        m.lender.lender_type || "N/A",
        m.lender.geographic_coverage || "N/A",
        `${m.score} pts`,
      ]),
      theme: "grid",
      headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [51, 78, 104] },
      margin: { left: 15, right: 15 },
    });
  }

  doc.save(`SpecSheet_${prospect.client_name.replace(/\s/g, "_")}.pdf`);
}

function generateInvestmentOnePager(prospect, matches) {
  const doc = new jsPDF();
  let y = addHeader(doc, "Investment One-Pager");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text(prospect.company_name || prospect.client_name, 15, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${prospect.sector || "N/A"} | ${prospect.physical_location || "N/A"}`, 15, y);
  y += 15;

  doc.setFillColor(240, 244, 248);
  doc.rect(15, y - 5, 180, 30, "F");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  const dealSize = prospect.deal_size ? `$${(Number(prospect.deal_size) / 1e6).toFixed(1)}M` : "N/A";
  const revenue = prospect.total_est_revenue ? `$${Number(prospect.total_est_revenue).toLocaleString()}` : "N/A";
  doc.setFont("helvetica", "bold");
  doc.text("Deal Size", 25, y + 2);
  doc.text("Est. Revenue", 75, y + 2);
  doc.text("Probability", 130, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(dealSize, 25, y + 14);
  doc.text(revenue, 75, y + 14);
  doc.text(prospect.probability ? `${(prospect.probability * 100).toFixed(0)}%` : "N/A", 130, y + 14);
  y += 40;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Deal Summary", 15, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const summary = `${prospect.client_name} is seeking ${prospect.wbc_sub_product || "financing"} advisory services. ` +
    `The deal is currently in stage "${prospect.deal_stage || "N/A"}" with an estimated close date of ${prospect.est_close_date || "TBD"}. ` +
    `${matches.length} potential lender matches have been identified.`;
  const lines = doc.splitTextToSize(summary, 180);
  doc.text(lines, 15, y);
  y += lines.length * 5 + 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text(`Matched Lenders (${matches.length})`, 15, y);
  y += 8;

  if (matches.length) {
    doc.autoTable({
      startY: y,
      head: [["Lender", "Type", "Location", "Coverage", "Score"]],
      body: matches.slice(0, 10).map((m) => [
        m.lender.lender_name,
        m.lender.lender_type || "",
        m.lender.based_in || "",
        m.lender.geographic_coverage || "",
        `${m.score}`,
      ]),
      theme: "striped",
      headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 15, right: 15 },
    });
  }

  doc.save(`InvestmentOnePager_${prospect.client_name.replace(/\s/g, "_")}.pdf`);
}

function generateOfferMemo(prospect, matches) {
  const doc = new jsPDF();
  let y = addHeader(doc, "Offer Memorandum");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Confidential Offer Memorandum", 15, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Prepared for: ${prospect.client_name}`, 15, y);
  y += 6;
  doc.text(`Company: ${prospect.company_name || "N/A"}`, 15, y);
  y += 6;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, y);
  y += 15;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("1. Transaction Overview", 15, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const overview = `Whitebridge Capital ("WBC") has been engaged to provide ${prospect.wbc_sub_product || "credit advisory"} services ` +
    `for ${prospect.company_name || prospect.client_name}. The proposed transaction involves a financing of ` +
    `${prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "an undisclosed amount"} ` +
    `in the ${prospect.sector || "financial services"} sector.`;
  const oLines = doc.splitTextToSize(overview, 180);
  doc.text(oLines, 15, y);
  y += oLines.length * 5 + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("2. Key Terms", 15, y);
  y += 8;

  const terms = [
    ["Product", prospect.wbc_sub_product || "N/A"],
    ["Deal Size", prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "N/A"],
    ["Est. Revenue", prospect.total_est_revenue ? `$${Number(prospect.total_est_revenue).toLocaleString()}` : "N/A"],
    ["Stage", prospect.deal_stage || "N/A"],
    ["Close Date", prospect.est_close_date || "TBD"],
    ["Location", prospect.physical_location || "N/A"],
  ];
  doc.autoTable({
    startY: y,
    body: terms,
    theme: "plain",
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
    margin: { left: 15, right: 15 },
  });
  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("3. Recommended Financing Sources", 15, y);
  y += 8;

  if (matches.length) {
    doc.autoTable({
      startY: y,
      head: [["Lender", "Type", "Coverage", "Location", "Score"]],
      body: matches.slice(0, 15).map((m) => [
        m.lender.lender_name,
        m.lender.lender_type || "",
        m.lender.geographic_coverage || "",
        m.lender.based_in || "",
        `${m.score}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 15, right: 15 },
    });
  }

  doc.save(`OfferMemo_${prospect.client_name.replace(/\s/g, "_")}.pdf`);
}

function generatePOA(prospect) {
  const doc = new jsPDF();
  let y = addHeader(doc, "Power of Attorney");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Limited Power of Attorney", 105, y, { align: "center" });
  y += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const body = [
    `I, ${prospect.contact_name || prospect.client_name}, ` +
    `acting in my capacity as authorized representative of ${prospect.company_name || "[Company Name]"}, ` +
    `hereby grant Whitebridge Capital LLC ("WBC") a limited power of attorney to act on my/our behalf ` +
    `in connection with the following transaction:`,
    "",
    `Transaction Type: ${prospect.wbc_sub_product || "[Product Type]"}`,
    `Estimated Transaction Size: ${prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "[Amount]"}`,
    `Sector: ${prospect.sector || "[Sector]"}`,
    "",
    "This Power of Attorney authorizes WBC to:",
    "",
    "1. Solicit and negotiate financing terms with potential lenders on behalf of the Principal;",
    "2. Submit loan applications and supporting documentation to prospective financing sources;",
    "3. Receive and review term sheets, commitment letters, and related financing documents;",
    "4. Coordinate due diligence processes with potential lenders.",
    "",
    "This Power of Attorney shall remain in effect until the earlier of: (i) completion or termination of the above-referenced transaction, or (ii) written revocation by the Principal.",
    "",
    "",
    "______________________________          ______________________________",
    `${prospect.contact_name || "[Name]"}                                    Date`,
    `${prospect.company_name || "[Company]"}`,
    "",
    "",
    "______________________________          ______________________________",
    "Whitebridge Capital LLC                          Date",
  ];

  const allLines = [];
  for (const para of body) {
    if (para === "") {
      allLines.push("");
    } else {
      allLines.push(...doc.splitTextToSize(para, 180));
    }
  }
  doc.text(allLines, 15, y);

  doc.save(`POA_${prospect.client_name.replace(/\s/g, "_")}.pdf`);
}

const DOCS = [
  {
    id: "spec",
    title: "Spec Sheet",
    desc: "One-pager with prospect details and top 5 matched lenders",
    gen: generateSpecSheet,
  },
  {
    id: "onepager",
    title: "Investment One-Pager",
    desc: "Deal summary with key financials and matched lender count",
    gen: generateInvestmentOnePager,
  },
  {
    id: "memo",
    title: "Offer Memorandum",
    desc: "Full memo with background, terms, and recommended lenders",
    gen: generateOfferMemo,
  },
  {
    id: "poa",
    title: "Power of Attorney",
    desc: "Pre-filled limited POA template for client signing",
    gen: (p) => generatePOA(p),
  },
];

export default function DocumentGenerator({ prospect, matches }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {DOCS.map((d) => (
        <div key={d.id} className="bg-navy-900 border border-navy-800 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <FileText size={20} className="text-gold-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold">{d.title}</h3>
              <p className="text-navy-400 text-sm mt-1">{d.desc}</p>
            </div>
          </div>
          <button
            onClick={() => d.gen(prospect, matches)}
            className="inline-flex items-center gap-2 bg-navy-800 border border-navy-700 text-navy-200 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <FileDown size={16} />
            Generate PDF
          </button>
        </div>
      ))}
    </div>
  );
}
