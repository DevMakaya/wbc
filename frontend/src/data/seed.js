import Papa from "papaparse";

const CSV_BASE =
  "https://raw.githubusercontent.com/yourusername/wbc/main/data/";

const LENDER_COL_MAP = {
  "#": "id",
  "Lender Name": "lender_name",
  Website: "website",
  "Contact Name": "contact_name",
  "Linkedin Profile": "linkedin_profile",
  "Contact E-Mail": "contact_email",
  "Contact Phone": "contact_phone",
  "Lender Type": "lender_type",
  "CRE - Construction": "cre_construction",
  "CRE-Residential": "cre_residential",
  "CRE - Land": "cre_land",
  "CRE - Office": "cre_office",
  "CRE - Industrial": "cre_industrial",
  "CRE - Hotel": "cre_hotel",
  "CRE - Retail": "cre_retail",
  "CRE - Other": "cre_other",
  "Real Estate": "real_estate",
  Aircraft: "aircraft",
  Art: "art",
  "Insurance Premium": "insurance_premium",
  Yacht: "yacht",
  Sports: "sports",
  "Fund - LP": "fund_lp",
  "Fund - NAV": "fund_nav",
  "Fund - GP": "fund_gp",
  "Fund - Mgmt Company": "fund_mgmt_company",
  "Fund - SCF": "fund_scf",
  "Other Financing (specify)": "other_financing",
  Senior: "senior",
  Subbordinated: "subordinated",
  Recourse: "recourse",
  "Non-recourse": "non_recourse",
  "Based In": "based_in",
  "Geographic Coverage": "geographic_coverage",
  "Lender Location (City, State, Country)": "lender_location",
  Note: "note",
};

const PIPELINE_COL_MAP = {
  "#": "id",
  "Lead Source": "lead_source",
  "Pipeline Status": "pipeline_status",
  "Client Name": "client_name",
  "WBC Product": "wbc_product",
  "WBC Sub-Product": "wbc_sub_product",
  "Deal Stage": "deal_stage",
  "Prob (linked)": "probability",
  "Lead RM": "lead_rm",
  "Deal Team": "deal_team",
  "Deal Size (AuMs)": "deal_size",
  "Total Est. Revenue": "total_est_revenue",
  "Est. Close Date": "est_close_date",
  "Physical Location": "physical_location",
  "Client Type": "client_type",
  "Company Name": "company_name",
  Sector: "sector",
  "Contact Name": "contact_name",
};

const INT_FIELDS = new Set([
  "cre_construction",
  "cre_residential",
  "cre_land",
  "cre_office",
  "cre_industrial",
  "cre_hotel",
  "cre_retail",
  "cre_other",
  "real_estate",
  "aircraft",
  "art",
  "insurance_premium",
  "yacht",
  "sports",
  "fund_lp",
  "fund_nav",
  "fund_gp",
  "fund_mgmt_company",
  "fund_scf",
  "senior",
  "subordinated",
  "recourse",
  "non_recourse",
]);

const FLOAT_FIELDS = new Set([
  "probability",
  "deal_size",
  "total_est_revenue",
]);

function mapRow(row, colMap) {
  const mapped = {};
  for (const [csvCol, dbCol] of Object.entries(colMap)) {
    let val = row[csvCol];
    if (val === undefined || val === null || val === "") {
      mapped[dbCol] = INT_FIELDS.has(dbCol) ? 0 : FLOAT_FIELDS.has(dbCol) ? null : "";
    } else if (INT_FIELDS.has(dbCol)) {
      mapped[dbCol] = parseInt(val, 10) || 0;
    } else if (FLOAT_FIELDS.has(dbCol)) {
      mapped[dbCol] = parseFloat(val) || null;
    } else {
      mapped[dbCol] = String(val).trim();
    }
  }
  return mapped;
}

export function parseLendersCSV(csvText) {
  const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return data.map((row, i) => ({ ...mapRow(row, LENDER_COL_MAP), id: i + 1 }));
}

export function parsePipelineCSV(csvText) {
  const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return data.map((row, i) => ({ ...mapRow(row, PIPELINE_COL_MAP), id: i + 1 }));
}

export { LENDER_COL_MAP, PIPELINE_COL_MAP, INT_FIELDS, FLOAT_FIELDS };
