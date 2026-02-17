import pandas as pd
import random
import warnings

warnings.filterwarnings("ignore")

random.seed(99)

INPUT_PATH = r"data\Cursor Sample.xlsx"
OUTPUT_PATH = r"data\pipeline_cleaned.csv"

CLIENT_FIRST = [
    "James", "Maria", "Carlos", "Jennifer", "Roberto", "Sarah", "Michael",
    "Ana", "David", "Laura", "Daniel", "Patricia", "Richard", "Monica",
    "Thomas", "Elena", "William", "Sophia", "Christopher", "Isabella",
    "Andrew", "Natalia", "Matthew", "Valentina", "Joshua", "Camila",
    "Robert", "Gabriela", "John", "Alejandra", "Steven", "Victoria",
    "Mark", "Andrea", "Brian", "Carolina", "Kevin", "Paula",
    "Jason", "Diana", "Ryan", "Lucia", "Eric", "Marina",
    "Patrick", "Teresa", "George", "Carmen", "Edward", "Adriana"
]
CLIENT_LAST = [
    "Smith", "Johnson", "Martinez", "Garcia", "Rodriguez", "Lopez",
    "Hernandez", "Gonzalez", "Wilson", "Anderson", "Taylor", "Thompson",
    "Brown", "Davis", "Miller", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "White", "Harris", "Clark", "Lewis",
    "Robinson", "Walker", "Young", "Allen", "King", "Wright",
    "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
    "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
    "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans"
]

COMPANY_TEMPLATES = {
    "Aircraft Financing ": [
        "{last} Aviation Holdings", "{last} Jet Leasing", "{last} Air Charter Group",
        "{last} Aerospace Ventures", "{last} Flight Capital"
    ],
    "CRE - Office": [
        "{last} Commercial Properties", "{last} Office Realty", "{last} Workspace Holdings",
        "{last} Corporate Real Estate", "{last} Tower Properties"
    ],
    "Art Financing ": [
        "{last} Art Collection LLC", "{last} Fine Art Investments", "{last} Gallery Holdings",
        "{last} Art Capital Trust", "{last} Cultural Assets"
    ],
    "CRE - Hotel": [
        "{last} Hospitality Group", "{last} Hotel Ventures", "{last} Resort Properties",
        "{last} Lodge Investments", "{last} Inn Holdings"
    ],
    "LP": [
        "{last} Limited Partners", "{last} LP Investments", "{last} Fund Holdings",
        "{last} Portfolio Partners", "{last} Capital LP"
    ],
    "Other Financing": [
        "{last} Enterprises", "{last} Holdings Group", "{last} Capital Ventures",
        "{last} Investment Corp", "{last} Financial Holdings"
    ],
    "CRE - Land": [
        "{last} Land Development", "{last} Terrain Holdings", "{last} Acres Group",
        "{last} Land Trust", "{last} Property Development"
    ],
    "CRE-Residential": [
        "{last} Residential Group", "{last} Home Investments", "{last} Living Spaces",
        "{last} Dwelling Holdings", "{last} Residential Capital"
    ],
    "Real Estate": [
        "{last} Real Estate Holdings", "{last} Property Group", "{last} Realty Investors",
        "{last} Estate Management", "{last} RE Ventures"
    ],
    "CRE - Other": [
        "{last} Mixed-Use Properties", "{last} Specialty Realty", "{last} Diversified RE",
        "{last} Alternative Properties", "{last} Flex Space Holdings"
    ],
    "CRE - Industrial": [
        "{last} Industrial Partners", "{last} Warehouse Group", "{last} Logistics RE",
        "{last} Industrial Holdings", "{last} Distribution Centers"
    ],
    "Management Company": [
        "{last} Management Co", "{last} Fund Management", "{last} Asset Management",
        "{last} Wealth Management", "{last} Capital Management"
    ],
    "Sports Financing": [
        "{last} Sports Group", "{last} Athletic Ventures", "{last} Sports Capital",
        "{last} Sports Holdings", "{last} Team Investments"
    ],
    "Insurance Premium Financing": [
        "{last} Insurance Holdings", "{last} Premium Finance", "{last} Policy Capital",
        "{last} Insurance Trust", "{last} Premium Holdings"
    ],
    "GP": [
        "{last} General Partners", "{last} GP Capital", "{last} GP Holdings",
        "{last} Managing Partners", "{last} GP Ventures"
    ],
    "Yacht Financing": [
        "{last} Marine Holdings", "{last} Yacht Capital", "{last} Maritime Ventures",
        "{last} Nautical Investments", "{last} Yacht Group"
    ],
    "CRE - Retail": [
        "{last} Retail Properties", "{last} Shopping Centers", "{last} Retail Holdings",
        "{last} Mall Investments", "{last} Retail Capital"
    ],
}

SECTOR_MAP = {
    "Aircraft Financing ": "Aviation & Aerospace",
    "CRE - Office": "Commercial Real Estate",
    "Art Financing ": "Art & Collectibles",
    "CRE - Hotel": "Hospitality & Lodging",
    "LP": "Private Equity / Fund Investment",
    "Other Financing": "Diversified Financial Services",
    "CRE - Land": "Land Banking Real Estate",
    "CRE-Residential": "Residential Real Estate",
    "Real Estate": "Real Estate",
    "CRE - Other": "Alternative Real Estate",
    "CRE - Industrial": "Industrial Real Estate",
    "Management Company": "Fund Management",
    "Sports Financing": "Sports & Entertainment",
    "Insurance Premium Financing": "Insurance",
    "GP": "Private Equity / Fund Management",
    "Yacht Financing": "Marine & Luxury Assets",
    "CRE - Retail": "Retail Real Estate",
}

LEAD_SOURCES = [
    "Self-Sourced", "Client Referral", "Non-Partner Referral",
    "Partner Referral - Panghea", "Partner Referral - Cetera"
]
LEAD_SOURCE_WEIGHTS = [0.3, 0.25, 0.15, 0.2, 0.1]

CLIENT_TYPES = ["SFO", "Direct", "Entity", "Firm", "Art Platform", "Vertix"]
CLIENT_TYPE_WEIGHTS = [0.3, 0.25, 0.2, 0.15, 0.05, 0.05]

LOCATIONS = ["US", "Argentina", "Mty", "Spain", "Bahamas", "Mexico", "Colombia", "Brazil", "Chile", "UK"]
LOCATION_WEIGHTS = [0.35, 0.15, 0.1, 0.08, 0.05, 0.1, 0.05, 0.05, 0.04, 0.03]

RMS = ["TC", "KS", "RH", "FV"]
DEAL_TEAMS = [
    "Kathia, Regina", "Kathia", "Regina", "Ford",
    "Kathia, Laura", "Regina, Laura", "Regina\nLaura"
]

DEAL_STAGES = [
    "1. Lead / Intake",
    "2. Discovery & NDA",
    "3. Preliminary Analysis (Two Pager)",
    "4. Market Sounding & Client Engagement",
    "5. Diligence & Financing Memo",
    "6. Term Sheets & Negotiation",
    "7. Term sheet Signed & Closing",
    "8. Closed",
]
PROB_MAP = {
    "1. Lead / Intake": 0.10,
    "2. Discovery & NDA": 0.15,
    "2. Internal Conviction & Approval": 0.20,
    "3. Preliminary Analysis (Two Pager)": 0.25,
    "4. Market Sounding & Client Engagement": 0.40,
    "5. Diligence & Financing Memo": 0.50,
    "6. Term Sheets & Negotiation": 0.60,
    "7. Term sheet Signed & Closing": 0.85,
    "8. Closed": 1.00,
}


def pick_weighted(options, weights):
    return random.choices(options, weights=weights, k=1)[0]


df = pd.read_excel(INPUT_PATH, sheet_name="WBC Credit Advisory Pipeline", header=0)

str_cols = ["Client Name", "Contact Name", "Company Name", "Sector", "Lead Source",
            "Physical Location", "Client Type", "Deal Team", "Pipeline Status",
            "Lead RM", "Est. Close Date"]
for col in str_cols:
    if col in df.columns:
        df[col] = df[col].astype("object")

used_clients = set()
for idx, row in df.iterrows():
    sub_product = row.get("WBC Sub-Product", "Other Financing")
    if pd.isna(sub_product):
        sub_product = "Other Financing"
    sub_product = sub_product.strip() if isinstance(sub_product, str) else sub_product

    first = CLIENT_FIRST[idx % len(CLIENT_FIRST)]
    last = CLIENT_LAST[idx % len(CLIENT_LAST)]

    if pd.isna(row.get("Client Name")):
        client = f"{first} {last}"
        counter = 2
        while client in used_clients:
            client = f"{first} {last} {counter}"
            counter += 1
        used_clients.add(client)
        df.at[idx, "Client Name"] = client

    if pd.isna(row.get("Contact Name")):
        df.at[idx, "Contact Name"] = f"{first} {last}"

    if pd.isna(row.get("Company Name")):
        templates = COMPANY_TEMPLATES.get(sub_product, ["{last} Holdings"])
        company = random.choice(templates).format(last=last)
        df.at[idx, "Company Name"] = company

    if pd.isna(row.get("Sector")):
        sector = SECTOR_MAP.get(sub_product)
        if not sector:
            for key, val in SECTOR_MAP.items():
                if key.strip() == sub_product.strip():
                    sector = val
                    break
        df.at[idx, "Sector"] = sector or "Financial Services"

    if pd.isna(row.get("Lead Source")):
        df.at[idx, "Lead Source"] = pick_weighted(LEAD_SOURCES, LEAD_SOURCE_WEIGHTS)

    if pd.isna(row.get("Physical Location")):
        df.at[idx, "Physical Location"] = pick_weighted(LOCATIONS, LOCATION_WEIGHTS)

    if pd.isna(row.get("Client Type")):
        df.at[idx, "Client Type"] = pick_weighted(CLIENT_TYPES, CLIENT_TYPE_WEIGHTS)

    if pd.isna(row.get("Lead RM")):
        df.at[idx, "Lead RM"] = random.choice(RMS)

    if pd.isna(row.get("Deal Team")):
        df.at[idx, "Deal Team"] = random.choice(DEAL_TEAMS)

    if pd.isna(row.get("Pipeline Status")):
        df.at[idx, "Pipeline Status"] = "Active"

    deal_stage = row.get("Deal Stage")
    if pd.notna(deal_stage):
        expected_prob = PROB_MAP.get(deal_stage)
        if expected_prob is not None:
            df.at[idx, "Prob (linked)"] = expected_prob

    if pd.isna(row.get("Deal Size (AuMs)")):
        df.at[idx, "Deal Size (AuMs)"] = random.choice(
            [1000000, 2000000, 5000000, 7500000, 10000000, 15000000,
             20000000, 25000000, 30000000, 50000000, 75000000, 100000000]
        )

    deal_size = df.at[idx, "Deal Size (AuMs)"]
    if pd.isna(row.get("Total Est. Revenue")) and pd.notna(deal_size):
        rate = random.choice([0.005, 0.0075, 0.01, 0.015])
        df.at[idx, "Total Est. Revenue"] = deal_size * rate

    if pd.isna(row.get("Est. Close Date")):
        df.at[idx, "Est. Close Date"] = random.choice(
            ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"]
        )

    est_close = df.at[idx, "Est. Close Date"]
    if isinstance(est_close, str):
        df.at[idx, "Est. Close Date"] = est_close.strip().replace("Q12026", "Q1 2026")

df["#"] = range(1, len(df) + 1)

df_fields = pd.read_excel(INPUT_PATH, sheet_name="Fields", header=0)
df_fields = df_fields.drop(columns=[c for c in df_fields.columns if "Unnamed" in str(c)], errors="ignore")

df.to_csv(OUTPUT_PATH, index=False)

fields_output = r"data\fields_reference.csv"
df_fields.to_csv(fields_output, index=False)

print(f"Pipeline output saved to {OUTPUT_PATH}")
print(f"Fields reference saved to {fields_output}")
print(f"Pipeline shape: {df.shape}")
print(f"\nSample rows:")
print(df[["#", "Client Name", "Company Name", "WBC Sub-Product", "Sector", "Lead Source", "Physical Location"]].head(15).to_string())
print(f"\nFilled columns check:")
print(df.notna().sum())
