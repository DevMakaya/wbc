const SUB_PRODUCT_TO_COLUMN = {
  "Aircraft Financing": "aircraft",
  "Art Financing": "art",
  "CRE - Construction": "cre_construction",
  "CRE-Residential": "cre_residential",
  "CRE - Land": "cre_land",
  "CRE - Office": "cre_office",
  "CRE - Industrial": "cre_industrial",
  "CRE - Hotel": "cre_hotel",
  "CRE - Retail": "cre_retail",
  "CRE - Other": "cre_other",
  "Real Estate": "real_estate",
  LP: "fund_lp",
  NAV: "fund_nav",
  GP: "fund_gp",
  "Management Company": "fund_mgmt_company",
  SCF: "fund_scf",
  "Insurance Premium Financing": "insurance_premium",
  "Yacht Financing": "yacht",
  "Sports Financing": "sports",
  "Other Financing": "other_financing",
};

const PRODUCT_COLUMNS = [
  "cre_construction", "cre_residential", "cre_land", "cre_office",
  "cre_industrial", "cre_hotel", "cre_retail", "cre_other",
  "real_estate", "aircraft", "art", "insurance_premium",
  "yacht", "sports", "fund_lp", "fund_nav", "fund_gp",
  "fund_mgmt_company", "fund_scf",
];

const STRUCTURE_COLUMNS = ["senior", "subordinated", "recourse", "non_recourse"];

const US_LOCATIONS = new Set([
  "US", "USA", "United States", "NY", "CA", "TX", "FL",
  "New York", "California", "Texas", "Florida", "Miami",
  "Chicago", "Dallas", "San Francisco", "Los Angeles",
]);

const LATAM_LOCATIONS = new Set([
  "Argentina", "Mexico", "Mty", "Monterrey", "Colombia",
  "Brazil", "Chile", "Spain", "Peru", "Bahamas",
]);

function normalizeSubProduct(sp) {
  if (!sp) return null;
  const trimmed = sp.trim();
  if (SUB_PRODUCT_TO_COLUMN[trimmed]) return trimmed;
  for (const key of Object.keys(SUB_PRODUCT_TO_COLUMN)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) return key;
    if (trimmed.toLowerCase().includes(key.toLowerCase())) return key;
    if (key.toLowerCase().includes(trimmed.toLowerCase())) return key;
  }
  return null;
}

function lenderHasProduct(lender, column) {
  if (column === "other_financing") {
    return lender[column] && lender[column] !== "0" && lender[column] !== "";
  }
  return Number(lender[column]) === 1;
}

function geoScore(lender, prospectLocation) {
  const coverage = (lender.geographic_coverage || "").trim().toLowerCase();
  if (coverage === "global") return 20;
  if (coverage === "international") return 15;
  const loc = (prospectLocation || "").trim();
  if (!loc) return 10;
  const lenderRegion = (lender.based_in || "").trim();
  const isProspectUS = US_LOCATIONS.has(loc);
  const isProspectLatam = LATAM_LOCATIONS.has(loc);
  const isLenderUS =
    US_LOCATIONS.has(lenderRegion) ||
    (lender.lender_location || "").includes("US") ||
    (lender.lender_location || "").includes("USA");
  const isLenderLatam =
    LATAM_LOCATIONS.has(lenderRegion) ||
    (lender.lender_location || "").toLowerCase().includes("mexico") ||
    (lender.lender_location || "").toLowerCase().includes("argentina");

  if (isProspectUS && isLenderUS) return 20;
  if (isProspectLatam && isLenderLatam) return 20;
  if (coverage === "domestic" || coverage === "domestic (us)") return 0;
  return 5;
}

function breadthScore(lender) {
  let count = 0;
  for (const col of PRODUCT_COLUMNS) {
    if (lenderHasProduct(lender, col)) count++;
  }
  return Math.min(count, 10);
}

function structureScore(lender) {
  let score = 0;
  for (const col of STRUCTURE_COLUMNS) {
    if (Number(lender[col]) === 1) score += 2.5;
  }
  return Math.min(score, 10);
}

export function matchLendersForProspect(prospect, lenders) {
  const normalized = normalizeSubProduct(prospect.wbc_sub_product);
  if (!normalized) return [];

  const column = SUB_PRODUCT_TO_COLUMN[normalized];
  if (!column) return [];

  const results = [];
  for (const lender of lenders) {
    if (!lenderHasProduct(lender, column)) continue;

    const primary = 50;
    const geo = geoScore(lender, prospect.physical_location);
    const breadth = breadthScore(lender);
    const structure = structureScore(lender);
    const total = primary + geo + breadth + structure;

    results.push({
      lender,
      score: total,
      breakdown: { primary, geo, breadth, structure },
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function matchProspectsForLender(lender, pipeline) {
  const activeColumns = [];
  for (const [subProduct, col] of Object.entries(SUB_PRODUCT_TO_COLUMN)) {
    if (lenderHasProduct(lender, col)) {
      activeColumns.push({ subProduct, col });
    }
  }

  if (!activeColumns.length) return [];

  const results = [];
  for (const prospect of pipeline) {
    const normalized = normalizeSubProduct(prospect.wbc_sub_product);
    if (!normalized) continue;

    const column = SUB_PRODUCT_TO_COLUMN[normalized];
    if (!column) continue;
    if (!lenderHasProduct(lender, column)) continue;

    const geo = geoScore(lender, prospect.physical_location);
    const total = 50 + geo;

    results.push({
      prospect,
      score: total,
      matchedProduct: normalized,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function getProductFlags(lender) {
  const flags = [];
  for (const [subProduct, col] of Object.entries(SUB_PRODUCT_TO_COLUMN)) {
    if (lenderHasProduct(lender, col)) {
      flags.push(subProduct);
    }
  }
  return flags;
}

export { SUB_PRODUCT_TO_COLUMN, PRODUCT_COLUMNS };
